"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { runAIJob } from "@/lib/ai/job-runner";
import { generateGrowthRecommendations } from "@/lib/ai/services/growth-recommendations";
import { getAnalyticsOverview } from "@/features/analytics/server/queries";

export async function runGrowthAgent() {
  const user = await requireUser();

  const [products, stores, campaigns, overview] = await Promise.all([
    prisma.product.findMany({
      where: { userId: user.id, saved: true, deletedAt: null },
      select: { id: true, title: true, winningScore: true, estimatedMargin: true },
      take: 20,
    }),
    prisma.store.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true, status: true } }),
    prisma.adCampaign.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true, platform: true, _count: { select: { creatives: true } } },
    }),
    getAnalyticsOverview(user.id),
  ]);

  const result = await runAIJob({
    userId: user.id,
    type: "GROWTH_RECOMMENDATION",
    input: {},
    run: () =>
      generateGrowthRecommendations({
        products,
        stores,
        campaigns: campaigns.map((c) => ({ id: c.id, name: c.name, platform: c.platform, creativeCount: c._count.creatives })),
        hasRealAnalytics: overview.hasRealData,
      }),
  });

  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, recommendations: result.output.recommendations };
}
