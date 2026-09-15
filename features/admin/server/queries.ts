import "server-only";
import { prisma } from "@/lib/db/prisma";
import { integrations, env } from "@/config/env";

export async function getAdminOverview() {
  const [userCount, activeUserCount, subscriptionsByPlan, productCount, storeCount, campaignCount, jobCounts, recentErrors] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.subscription.groupBy({ by: ["plan"], _count: true }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.store.count({ where: { deletedAt: null } }),
    prisma.adCampaign.count({ where: { deletedAt: null } }),
    prisma.aIJob.groupBy({ by: ["status"], _count: true }),
    prisma.aIJob.findMany({ where: { status: "FAILED" }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  return {
    userCount,
    activeUserCount,
    subscriptionsByPlan,
    productCount,
    storeCount,
    campaignCount,
    jobCounts,
    recentErrors,
  };
}

export async function getUsers(search?: string) {
  return prisma.user.findMany({
    where: search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { subscription: true },
  });
}

export async function getAdminProducts(search?: string) {
  // Admins see hidden (soft-deleted) products too, with a badge, so they
  // can unhide them — unlike every other product query in the app, which
  // filters deletedAt: null.
  return prisma.product.findMany({
    where: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getJobs(status?: string) {
  return prisma.aIJob.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });
}

export function getSystemStatus() {
  return {
    demoMode: env.demoMode,
    integrations: {
      ai: integrations.aiConfigured,
      aiImage: integrations.aiImageConfigured,
      shopify: integrations.shopifyConfigured,
      stripe: integrations.stripeConfigured,
      s3Storage: integrations.s3StorageConfigured,
    },
    aiProvider: env.ai.provider,
    aiModel: env.ai.model,
    aiImageProvider: env.ai.imageProvider,
  };
}
