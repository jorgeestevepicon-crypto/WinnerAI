"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { runAIJob } from "@/lib/ai/job-runner";
import { generateProductAnalysis } from "@/lib/ai/services/product-analysis";
import { discoverySchema } from "@/features/products/schemas";
import { getProductSourceAdapter } from "@/features/products/server/adapters";
import { toProductCreateInput, SOURCE_MAP } from "@/features/products/server/normalize";
import type { ProductSourceId } from "@/features/products/types";

export async function runProductDiscovery(input: unknown) {
  const user = await requireUser();
  const parsed = discoverySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const adapter = getProductSourceAdapter(parsed.data.sourceId);
  if (!adapter) return { success: false as const, error: "Unknown product source" };
  if (!adapter.configured) {
    return {
      success: false as const,
      error: adapter.disabledReason ?? `${adapter.label} is not configured in this environment.`,
    };
  }

  let results;
  try {
    results = await adapter.search({
      query: parsed.data.query,
      category: parsed.data.category,
      limit: parsed.data.limit,
      userId: user.id,
    });
  } catch (error) {
    console.error(`${adapter.label} product search failed`, error);
    const message = error instanceof Error ? error.message : "Search failed";
    return { success: false as const, error: `${adapter.label}: ${message}` };
  }

  if (results.length === 0) {
    return { success: true as const, count: 0 };
  }

  // Re-running the same (or an overlapping) search — including just
  // re-browsing the fixed demo catalog — used to insert every result again
  // as a brand-new row every time. Skip anything the user already has under
  // this source with the same title instead of piling up duplicates.
  const existing = await prisma.product.findMany({
    where: { userId: user.id, source: SOURCE_MAP[adapter.id as ProductSourceId], deletedAt: null },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((p) => p.title));
  const newResults = results.filter((item) => !existingTitles.has(item.title));

  if (newResults.length === 0) {
    return { success: true as const, count: 0 };
  }

  await prisma.$transaction(
    newResults.map((item) =>
      prisma.product.create({
        data: { ...toProductCreateInput(item, adapter.id as ProductSourceId), userId: user.id },
      })
    )
  );

  revalidatePath("/products");
  return { success: true as const, count: newResults.length };
}

export async function toggleSaveProduct(productId: string) {
  const user = await requireUser();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== user.id) {
    return { success: false as const, error: "Product not found" };
  }

  const nextSaved = !product.saved;
  await prisma.product.update({ where: { id: productId }, data: { saved: nextSaved } });

  if (nextSaved) {
    await logActivity({ userId: user.id, action: "product_saved", entityType: "product", entityId: productId });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true as const, saved: nextSaved };
}

export async function runProductAnalysis(productId: string) {
  const user = await requireUser();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== user.id) {
    return { success: false as const, error: "Product not found" };
  }

  const analysisInput = {
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    cost: product.cost,
    currency: product.currency,
    winningScore: product.winningScore,
    country: product.country,
  };

  const result = await runAIJob({
    userId: user.id,
    type: "PRODUCT_ANALYSIS",
    input: { productId },
    run: () => generateProductAnalysis(analysisInput),
  });

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  const output = result.output;
  await prisma.productAnalysis.create({
    data: {
      productId,
      targetAudience: output.targetAudience as Prisma.InputJsonValue,
      problemsSolved: output.problemsSolved,
      advantages: output.advantages,
      objections: output.objections,
      marketingAngles: output.marketingAngles,
      competitors: output.competitors as Prisma.InputJsonValue,
      opportunities: output.opportunities,
      risks: output.risks,
      recommendedPrice: output.recommendedPrice,
      positioning: output.positioning,
      aiVerdict: output.aiVerdict as Prisma.InputJsonValue,
      source: "AI_GENERATED",
    },
  });

  await logActivity({ userId: user.id, action: "product_analyzed", entityType: "product", entityId: productId });

  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/analysis`);
  return { success: true as const };
}
