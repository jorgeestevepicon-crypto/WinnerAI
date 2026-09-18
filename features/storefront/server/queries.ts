import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Public read — no userId filter. Only exposes stores that finished
 * generating and haven't been soft-deleted; a visitor never sees a store
 * that's still generating, failed, or was removed by its owner.
 */
export async function getPublicStore(storeId: string) {
  return prisma.store.findFirst({
    where: { id: storeId, deletedAt: null, status: { in: ["READY", "PUBLISHED"] } },
    include: { product: true },
  });
}
