import "server-only";
import { prisma } from "@/lib/db/prisma";
import { fetchAllAnalyticsSnapshots } from "@/lib/analytics/adapters";
import { analyticsAdapters } from "@/lib/analytics/adapters";

export async function getAnalyticsOverview(userId: string) {
  const results = await fetchAllAnalyticsSnapshots(userId, 30);
  const allSnapshots = results.flatMap((r) => r.snapshots);

  const totals = allSnapshots.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      orders: acc.orders + s.orders,
      spend: acc.spend + (s.spend ?? 0),
      impressions: acc.impressions + (s.impressions ?? 0),
    }),
    { revenue: 0, orders: 0, spend: 0, impressions: 0 }
  );

  return {
    hasRealData: allSnapshots.length > 0,
    sources: results.map((r) => r.source),
    totals,
    snapshots: allSnapshots.sort((a, b) => a.date.getTime() - b.date.getTime()),
  };
}

export function getConfiguredAnalyticsSources() {
  return analyticsAdapters.map((a) => ({ id: a.id, label: a.label, configured: a.configured, disabledReason: a.disabledReason }));
}

export async function getTopProducts(userId: string, limit = 5) {
  return prisma.product.findMany({
    where: { userId, deletedAt: null, winningScore: { not: null } },
    orderBy: { winningScore: "desc" },
    take: limit,
  });
}

export async function getTopAdVariants(userId: string, limit = 5) {
  return prisma.adVariant.findMany({
    where: { creative: { campaign: { userId }, deletedAt: null }, metrics: { not: undefined } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { creative: { include: { campaign: { select: { name: true, platform: true } } } } },
  });
}
