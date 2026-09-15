import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getUserStores(userId: string) {
  return prisma.store.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { product: { select: { title: true } } },
  });
}

export async function getStoreById(id: string, userId: string) {
  return prisma.store.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 20 },
      settings: true,
      product: { select: { id: true, title: true } },
    },
  });
}
