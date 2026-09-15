"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { integrations } from "@/config/env";
import { isValidShopDomain, buildAuthorizationUrl } from "@/lib/shopify/oauth";
import { createOAuthState } from "@/lib/shopify/state";

export async function getShopifyAuthUrl(shopDomain: string) {
  const user = await requireUser();

  if (!integrations.shopifyConfigured) {
    return { success: false as const, error: "Shopify is not configured in this environment. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET." };
  }
  if (!isValidShopDomain(shopDomain)) {
    return { success: false as const, error: "Enter a valid myshopify.com domain, e.g. your-store.myshopify.com" };
  }

  const state = createOAuthState(user.id);
  const url = buildAuthorizationUrl({ shop: shopDomain, state });
  return { success: true as const, url };
}

export async function disconnectShopify(connectionId: string) {
  const user = await requireUser();
  const connection = await prisma.shopifyConnection.findFirst({ where: { id: connectionId, userId: user.id } });
  if (!connection) return { success: false as const, error: "Connection not found" };

  await prisma.shopifyConnection.update({
    where: { id: connectionId },
    data: { status: "DISCONNECTED", accessTokenEncrypted: null },
  });
  await logActivity({ userId: user.id, action: "shopify_disconnected", entityType: "shopify_connection", entityId: connectionId });

  revalidatePath("/shopify");
  return { success: true as const };
}
