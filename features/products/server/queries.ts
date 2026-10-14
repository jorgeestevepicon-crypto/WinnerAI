import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ProductFilterInput } from "@/features/products/schemas";
import { getOrCreateScoreConfig } from "@/features/winning-products/server/config";
import { computeDropshippingScore } from "@/features/winning-products/server/scoring";
import type { DropshippingScoreResult } from "@/features/winning-products/types";

const scoringInclude = { manualSignal: true, snapshots: true } as const;

/**
 * Winning Score shown everywhere in the Product Finder (list, detail,
 * dashboard preview) is the same dropshipping-oriented model Winning
 * Products uses (features/winning-products/server/scoring.ts) — one
 * scoring model for the whole app, using each user's own configured
 * weights/thresholds (features/winning-products/server/config.ts),
 * rather than the two separate scores this app used to keep. Real manual
 * signals/snapshots are picked up here too when a product has already gone
 * through the Winning Products workflow (same underlying Product row).
 */
function withDropshippingScore<T extends Prisma.ProductGetPayload<{ include: typeof scoringInclude }>>(
  product: T,
  config: Awaited<ReturnType<typeof getOrCreateScoreConfig>>
): T & { winningScore: number; dropshippingResult: DropshippingScoreResult } {
  const result = computeDropshippingScore(product, config, product.manualSignal, product.snapshots);
  return { ...product, winningScore: result.score, dropshippingResult: result };
}

export async function searchProducts(filters: ProductFilterInput, userId: string) {
  // Product Finder results are scoped to the user who discovered them (each
  // discovery run creates rows owned by that user), so two users running the
  // same demo search each get their own copy rather than sharing one row.
  const where: Prisma.ProductWhereInput = { deletedAt: null, userId };

  if (filters.query) {
    where.title = { contains: filters.query, mode: "insensitive" };
  }
  if (filters.category) where.category = filters.category;
  if (filters.country) where.country = filters.country;
  if (filters.minPrice !== undefined) where.price = { ...(where.price as object), gte: filters.minPrice };
  if (filters.maxPrice !== undefined) where.price = { ...(where.price as object), lte: filters.maxPrice };
  if (filters.minMargin !== undefined) where.estimatedMargin = { gte: filters.minMargin };
  if (filters.minTrend !== undefined) where.trendScore = { gte: filters.minTrend };
  if (filters.maxCompetition !== undefined) where.competitionScore = { lte: filters.maxCompetition };
  if (filters.maxSaturation !== undefined) where.saturationScore = { lte: filters.maxSaturation };
  if (filters.savedOnly) where.saved = true;

  const config = await getOrCreateScoreConfig(userId);

  // The composite score isn't a stored column (it depends on per-user
  // config + related rows), so sorting by it means fetching a bounded set
  // and sorting/capping in application code — same approach Winning
  // Products' own list query uses — rather than a single SQL ORDER BY.
  if (filters.sortBy === "winningScore") {
    const products = await prisma.product.findMany({
      where,
      include: scoringInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return products
      .map((p) => withDropshippingScore(p, config))
      .sort((a, b) => b.winningScore - a.winningScore)
      .slice(0, 60);
  }

  const orderByMap: Record<Exclude<ProductFilterInput["sortBy"], "winningScore">, Prisma.ProductOrderByWithRelationInput> = {
    price: { price: "asc" },
    margin: { estimatedMargin: "desc" },
    trend: { trendScore: "desc" },
    createdAt: { createdAt: "desc" },
  };

  const products = await prisma.product.findMany({
    where,
    include: scoringInclude,
    orderBy: orderByMap[filters.sortBy],
    take: 60,
  });
  return products.map((p) => withDropshippingScore(p, config));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 }, ...scoringInclude },
  });
  if (!product) return product;
  // userId is only ever null if the owning account was deleted (onDelete:
  // SetNull) — there's no one to own a WinningScoreConfig for, so this
  // falls back to the stored (stale) score rather than computing a fresh one.
  if (!product.userId) return { ...product, dropshippingResult: null };

  const config = await getOrCreateScoreConfig(product.userId);
  return withDropshippingScore(product, config);
}

export async function getProductCategories(userId: string) {
  const rows = await prisma.product.findMany({
    where: { userId, deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category!).filter(Boolean).sort();
}

export async function getProductCountries(userId: string) {
  const rows = await prisma.product.findMany({
    where: { userId, deletedAt: null, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
  });
  return rows.map((r) => r.country!).filter(Boolean).sort();
}

export async function isProductSavedByUser(productId: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true, saved: true } });
  return !!product && product.userId === userId && product.saved;
}
