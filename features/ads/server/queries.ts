import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getUserCampaigns(userId: string) {
  return prisma.adCampaign.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { product: { select: { title: true } }, creatives: { select: { id: true } } },
  });
}

export async function getCampaignById(id: string, userId: string) {
  return prisma.adCampaign.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      product: true,
      creatives: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { variants: true },
      },
    },
  });
}

export async function getUserAdCreatives(userId: string) {
  return prisma.adCreative.findMany({
    where: { campaign: { userId }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { campaign: { include: { product: { select: { title: true } } } }, variants: true },
  });
}
