import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeDropshippingScore } from "@/features/winning-products/server/scoring";
import { getOrCreateScoreConfig } from "@/features/winning-products/server/config";
import type { WinningProductFilterInput } from "@/features/winning-products/schemas";
import type { ProductWithWinningData } from "@/features/winning-products/types";

const winningProductInclude = {
  snapshots: { orderBy: { capturedAt: "asc" as const } },
  manualSignal: true,
  adTests: { orderBy: { createdAt: "desc" as const } },
  supplierChecklist: true,
};

/**
 * Every row that has entered the Winning Products validation workflow, i.e.
 * has a winningStatus set — the generic Product Finder can hold many other
 * rows (other sources, other users' saved items) that never entered this
 * workflow and shouldn't show up here.
 *
 * The score depends on per-user config plus related rows that don't reduce
 * to a single SQL ORDER BY, so this fetches a bounded set and sorts/filters
 * in application code — the same bound (`take`) the generic Product Finder
 * already uses for its own list query.
 */
export async function listWinningProducts(userId: string, filters: WinningProductFilterInput) {
  const config = await getOrCreateScoreConfig(userId);

  const where: Prisma.ProductWhereInput = { userId, deletedAt: null, winningStatus: { not: null } };
  if (filters.status) where.winningStatus = filters.status;
  if (filters.minMargin !== undefined) where.estimatedMargin = { gte: filters.minMargin };

  const products = (await prisma.product.findMany({
    where,
    include: winningProductInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  })) as ProductWithWinningData[];

  let scored = products.map((product) => ({
    product,
    result: computeDropshippingScore(product, config, product.manualSignal, product.snapshots),
    latestOrders: [...product.snapshots].reverse().find((s) => s.orders !== null && s.orders !== undefined)?.orders ?? null,
  }));

  if (filters.minScore !== undefined) scored = scored.filter((s) => s.result.score >= filters.minScore!);
  if (filters.minOrders !== undefined) scored = scored.filter((s) => (s.latestOrders ?? 0) >= filters.minOrders!);

  const sorters: Record<WinningProductFilterInput["sortBy"], (a: (typeof scored)[number], b: (typeof scored)[number]) => number> = {
    score: (a, b) => b.result.score - a.result.score,
    status: (a, b) => (a.product.winningStatus ?? "").localeCompare(b.product.winningStatus ?? ""),
    margin: (a, b) => (b.product.estimatedMargin ?? 0) - (a.product.estimatedMargin ?? 0),
    orders: (a, b) => (b.latestOrders ?? 0) - (a.latestOrders ?? 0),
    createdAt: (a, b) => b.product.createdAt.getTime() - a.product.createdAt.getTime(),
  };
  scored.sort(sorters[filters.sortBy]);

  return { items: scored, config };
}

export async function getWinningProductById(id: string, userId: string) {
  const product = (await prisma.product.findUnique({ where: { id }, include: winningProductInclude })) as ProductWithWinningData | null;
  if (!product || product.userId !== userId) return null;

  const config = await getOrCreateScoreConfig(userId);
  const result = computeDropshippingScore(product, config, product.manualSignal, product.snapshots);

  return { product, result, config };
}
