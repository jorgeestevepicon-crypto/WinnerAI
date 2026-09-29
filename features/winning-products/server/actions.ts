"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { runProductDiscovery } from "@/features/products/server/actions";
import { demandFromVolume } from "@/features/products/server/adapters/aliexpress-adapter";
import { getValidAccessToken } from "@/lib/aliexpress/connection";
import { getAliExpressProductDetail, parseAliExpressItemId } from "@/lib/aliexpress/product-detail";
import { recordSnapshot } from "@/features/winning-products/server/snapshots";
import { getOrCreateScoreConfig, updateScoreConfig } from "@/features/winning-products/server/config";
import { computeAdTestMetrics } from "@/features/winning-products/server/ad-test-metrics";
import {
  addManualProductSchema,
  discoverCandidatesSchema,
  manualSignalSchema,
  adTestSchema,
  checklistSchema,
  setWinningStatusSchema,
  scoreConfigSchema,
} from "@/features/winning-products/schemas";
import type { TrendDirection } from "@/features/winning-products/types";

async function requireOwnedProduct(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== userId) return null;
  return product;
}

/** Seeds the manual "Google Trends direction" field from the real trend/growth signal we already have on the product (features/products/server/actions.ts's enrichment step), so the user isn't asked to hand-classify something we already know from real data. They can still override it. */
function trendDirectionFromGrowth(growthScore: number | null | undefined): TrendDirection | undefined {
  if (growthScore === null || growthScore === undefined) return undefined;
  if (growthScore >= 60) return "RISING";
  if (growthScore <= 20) return "FALLING";
  return "STABLE";
}

export async function discoverWinningCandidates(input: unknown) {
  const user = await requireUser();
  const parsed = discoverCandidatesSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const config = await getOrCreateScoreConfig(user.id);

  const result = await runProductDiscovery({
    sourceId: "aliexpress",
    query: parsed.data.query,
    category: parsed.data.category,
    limit: 50,
    country: config.targetCountry,
    currency: config.priceCurrency,
  });

  if (!result.success) return result;
  if (result.count === 0 || !result.productIds?.length) return { success: true as const, count: 0 };

  const products = await prisma.product.findMany({ where: { id: { in: result.productIds } } });

  await prisma.$transaction([
    ...products.map((product) => prisma.product.update({ where: { id: product.id }, data: { winningStatus: "CANDIDATE" } })),
    ...products.map((product) => {
      const metadata = (product.metadata as Record<string, unknown> | null) ?? {};
      return prisma.productSnapshot.create({
        data: {
          productId: product.id,
          price: product.price,
          cost: product.cost,
          orders: typeof metadata.recentOrders === "number" ? metadata.recentOrders : null,
          rating: typeof metadata.productRating === "number" ? metadata.productRating : null,
        },
      });
    }),
    ...products.map((product) =>
      prisma.productManualSignal.upsert({
        where: { productId: product.id },
        create: { productId: product.id, googleTrendsManual: trendDirectionFromGrowth(product.growthScore) },
        update: {},
      })
    ),
  ]);

  revalidatePath("/winning-products");
  return { success: true as const, count: result.count };
}

export async function addManualAliExpressProduct(input: unknown) {
  const user = await requireUser();
  const parsed = addManualProductSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const itemId = parseAliExpressItemId(parsed.data.urlOrId);
  if (!itemId) {
    return { success: false as const, error: "Couldn't find an AliExpress item ID in that URL. Paste the product page URL or just the numeric ID." };
  }

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) return { success: false as const, error: "Connect your AliExpress account first from the Product Finder." };

  const config = await getOrCreateScoreConfig(user.id);
  const detail = await getAliExpressProductDetail(itemId, accessToken, { currency: config.priceCurrency, shipToCountry: config.targetCountry });
  if (!detail?.title || !detail.price) {
    return {
      success: false as const,
      error: "AliExpress didn't return usable data for that item (this detail endpoint hasn't been verified against your account yet — check the server logs for the raw response).",
    };
  }

  const suggestedPrice = Math.floor(detail.price * 3) + 0.99;

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      title: detail.title,
      images: detail.image ? [detail.image] : [],
      source: "ALIEXPRESS",
      sourceUrl: `https://www.aliexpress.com/item/${itemId}.html`,
      cost: detail.price,
      price: suggestedPrice,
      currency: detail.currency,
      demandScore: detail.orders !== undefined ? demandFromVolume(detail.orders) : null,
      estimatedMargin: Math.round(((suggestedPrice - detail.price) / suggestedPrice) * 1000) / 10,
      storeRating: detail.storeRating ?? null,
      reviewCount: detail.reviewCount ?? null,
      weightGrams: detail.weightGrams ?? null,
      shippingDays: detail.shippingDays ?? null,
      shippingCost: detail.shippingCost ?? null,
      winningStatus: "CANDIDATE",
      discoveryOrigin: parsed.data.discoveryOrigin,
      discoveryUrl: parsed.data.discoveryUrl || null,
      metadata: { aliexpressProductId: itemId },
    },
  });

  await recordSnapshot(product.id, { price: product.price, cost: product.cost, orders: detail.orders, rating: detail.rating });
  await prisma.productManualSignal.create({
    data: { productId: product.id, googleTrendsManual: trendDirectionFromGrowth(product.growthScore) },
  });
  await logActivity({ userId: user.id, action: "winning_product_added_manually", entityType: "product", entityId: product.id });

  revalidatePath("/winning-products");
  return { success: true as const, productId: product.id };
}

export async function refreshAliExpressProductDetail(productId: string) {
  const user = await requireUser();
  const product = await requireOwnedProduct(productId, user.id);
  if (!product) return { success: false as const, error: "Product not found" };

  const metadata = (product.metadata as Record<string, unknown> | null) ?? {};
  const itemId =
    typeof metadata.aliexpressProductId === "string" || typeof metadata.aliexpressProductId === "number" ? String(metadata.aliexpressProductId) : null;
  if (!itemId) return { success: false as const, error: "This product has no linked AliExpress item ID." };

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) return { success: false as const, error: "Your AliExpress account isn't connected." };

  const config = await getOrCreateScoreConfig(user.id);
  const detail = await getAliExpressProductDetail(itemId, accessToken, { currency: config.priceCurrency, shipToCountry: config.targetCountry });
  if (!detail) {
    return { success: false as const, error: "AliExpress didn't return updated data for this item — see server logs for the raw response." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      cost: detail.price ?? product.cost,
      storeRating: detail.storeRating ?? product.storeRating,
      reviewCount: detail.reviewCount ?? product.reviewCount,
      weightGrams: detail.weightGrams ?? product.weightGrams,
      shippingDays: detail.shippingDays ?? product.shippingDays,
      shippingCost: detail.shippingCost ?? product.shippingCost,
      demandScore: detail.orders !== undefined ? demandFromVolume(detail.orders) : product.demandScore,
    },
  });

  await recordSnapshot(productId, { price: detail.price ?? product.price, cost: detail.price ?? product.cost, orders: detail.orders, rating: detail.rating });

  revalidatePath(`/winning-products/${productId}`);
  return { success: true as const };
}

export async function upsertManualSignal(productId: string, input: unknown) {
  const user = await requireUser();
  const product = await requireOwnedProduct(productId, user.id);
  if (!product) return { success: false as const, error: "Product not found" };

  const parsed = manualSignalSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.productManualSignal.upsert({
    where: { productId },
    create: { productId, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath(`/winning-products/${productId}`);
  return { success: true as const };
}

export async function createAdTest(productId: string, input: unknown) {
  const user = await requireUser();
  const product = await requireOwnedProduct(productId, user.id);
  if (!product) return { success: false as const, error: "Product not found" };

  const parsed = adTestSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const test = await prisma.productAdTest.create({ data: { productId, ...parsed.data } });
  await logActivity({ userId: user.id, action: "ad_test_added", entityType: "product", entityId: productId });

  revalidatePath(`/winning-products/${productId}`);
  return { success: true as const, testId: test.id };
}

export async function updateAdTest(testId: string, input: unknown) {
  const user = await requireUser();
  const test = await prisma.productAdTest.findUnique({ where: { id: testId }, include: { product: true } });
  if (!test || test.product.userId !== user.id) return { success: false as const, error: "Test not found" };

  const parsed = adTestSchema.partial().safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.productAdTest.update({ where: { id: testId }, data: parsed.data });
  revalidatePath(`/winning-products/${test.productId}`);
  return { success: true as const };
}

export async function deleteAdTest(testId: string) {
  const user = await requireUser();
  const test = await prisma.productAdTest.findUnique({ where: { id: testId }, include: { product: true } });
  if (!test || test.product.userId !== user.id) return { success: false as const, error: "Test not found" };

  await prisma.productAdTest.delete({ where: { id: testId } });
  revalidatePath(`/winning-products/${test.productId}`);
  return { success: true as const };
}

export async function updateSupplierChecklist(productId: string, input: unknown) {
  const user = await requireUser();
  const product = await requireOwnedProduct(productId, user.id);
  if (!product) return { success: false as const, error: "Product not found" };

  const parsed = checklistSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // readyToScale is always derived from these three checks, server-side —
  // there's no separate field the client can set directly, so the gate
  // described in the spec ("don't allow marking ready to scale unless the
  // checklist is complete") can't be bypassed from the UI.
  const { sampleOrdered, sampleReceived, qualityOk } = parsed.data;
  const readyToScale = sampleOrdered && sampleReceived && qualityOk;

  await prisma.productSupplierChecklist.upsert({
    where: { productId },
    create: { productId, ...parsed.data, readyToScale },
    update: { ...parsed.data, readyToScale },
  });

  revalidatePath(`/winning-products/${productId}`);
  return { success: true as const, readyToScale };
}

export async function setWinningStatus(productId: string, input: unknown) {
  const user = await requireUser();
  const product = await requireOwnedProduct(productId, user.id);
  if (!product) return { success: false as const, error: "Product not found" };

  const parsed = setWinningStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (parsed.data.status === "WINNER") {
    const config = await getOrCreateScoreConfig(user.id);
    const tests = await prisma.productAdTest.findMany({ where: { productId } });
    const meetsThreshold = tests.some((test) => {
      const metrics = computeAdTestMetrics(test, product);
      return metrics.roas !== null && metrics.roas >= config.minRoasForWinner;
    });
    if (!meetsThreshold) {
      return {
        success: false as const,
        error: `No ad test yet reaches the configured minimum ROAS (${config.minRoasForWinner}x) to mark this product as a Winner. Add or update a test first.`,
      };
    }
  }

  await prisma.product.update({ where: { id: productId }, data: { winningStatus: parsed.data.status } });
  await logActivity({ userId: user.id, action: "winning_status_changed", entityType: "product", entityId: productId, metadata: { status: parsed.data.status } });

  revalidatePath("/winning-products");
  revalidatePath(`/winning-products/${productId}`);
  return { success: true as const };
}

export async function getScoreConfigAction() {
  const user = await requireUser();
  return getOrCreateScoreConfig(user.id);
}

export async function updateScoreConfigAction(input: unknown) {
  const user = await requireUser();
  const parsed = scoreConfigSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateScoreConfig(user.id, parsed.data);
  revalidatePath("/winning-products/settings");
  revalidatePath("/winning-products");
  return { success: true as const };
}
