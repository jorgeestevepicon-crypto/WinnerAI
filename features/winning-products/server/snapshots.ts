import "server-only";
import { prisma } from "@/lib/db/prisma";

export interface SnapshotInput {
  price?: number | null;
  cost?: number | null;
  orders?: number | null;
  rating?: number | null;
}

/** Records one point-in-time capture of a product's real price/orders/rating, so order-growth can be computed between captures later (features/winning-products/server/scoring.ts::computeOrderGrowth). Called whenever a product is first added to the Winning Products workflow, or when its AliExpress detail is manually refreshed — never on every page view. */
export async function recordSnapshot(productId: string, data: SnapshotInput) {
  return prisma.productSnapshot.create({
    data: {
      productId,
      price: data.price ?? null,
      cost: data.cost ?? null,
      orders: data.orders ?? null,
      rating: data.rating ?? null,
    },
  });
}
