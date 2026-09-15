import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getDashboardStats(userId: string) {
  const [productsDiscovered, productsSaved, productsAnalyzed, storesCreated, adsGenerated, shopifyConnection] =
    await Promise.all([
      prisma.product.count({ where: { userId, deletedAt: null } }),
      prisma.product.count({ where: { userId, saved: true, deletedAt: null } }),
      prisma.productAnalysis.count({ where: { product: { userId } } }),
      prisma.store.count({ where: { userId, deletedAt: null } }),
      prisma.adVariant.count({ where: { creative: { campaign: { userId } } } }),
      prisma.shopifyConnection.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    ]);

  return {
    productsDiscovered,
    productsSaved,
    productsAnalyzed,
    storesCreated,
    adsGenerated,
    shopifyStatus: shopifyConnection?.status ?? "DISCONNECTED",
  };
}

export async function getTopProductOpportunities(userId: string, limit = 5) {
  return prisma.product.findMany({
    where: { userId, deletedAt: null, winningScore: { not: null } },
    orderBy: { winningScore: "desc" },
    take: limit,
  });
}

export async function getRecentStores(userId: string, limit = 5) {
  return prisma.store.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { product: { select: { title: true } } },
  });
}

export async function getAdPerformanceSummary(userId: string) {
  const campaigns = await prisma.adCampaign.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { _count: { select: { creatives: true } } },
  });

  const analytics = await prisma.analytics.findFirst({
    where: { userId, source: { in: ["meta", "tiktok", "google", "pinterest"] } },
    orderBy: { date: "desc" },
  });

  return { campaigns, hasRealData: !!analytics };
}

export async function getRecentActivity(userId: string, limit = 8) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
