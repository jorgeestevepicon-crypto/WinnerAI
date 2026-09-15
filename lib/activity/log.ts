import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type ActivityAction =
  | "product_saved"
  | "product_analyzed"
  | "store_created"
  | "store_updated"
  | "store_published"
  | "ad_generated"
  | "ad_saved"
  | "shopify_connected"
  | "shopify_disconnected"
  | "subscription_updated";

export async function logActivity(params: {
  userId: string;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
