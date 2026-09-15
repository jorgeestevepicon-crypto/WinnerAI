import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { env, integrations } from "@/config/env";
import { verifyShopifyHmac, isValidShopDomain, exchangeCodeForToken } from "@/lib/shopify/oauth";
import { verifyOAuthState } from "@/lib/shopify/state";
import { encryptShopifyToken } from "@/lib/shopify/crypto";
import { logActivity } from "@/lib/activity/log";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, env.appUrl));

  if (!integrations.shopifyConfigured) {
    return redirectTo("/shopify?error=not_configured");
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { shop, code, state } = searchParams;

  if (!shop || !code || !state || !isValidShopDomain(shop)) {
    return redirectTo("/shopify?error=invalid_request");
  }

  if (!verifyShopifyHmac(searchParams)) {
    return redirectTo("/shopify?error=invalid_signature");
  }

  const verifiedState = verifyOAuthState(state);
  if (!verifiedState) {
    return redirectTo("/shopify?error=invalid_state");
  }

  try {
    const { accessToken, scope } = await exchangeCodeForToken(shop, code);
    const accessTokenEncrypted = encryptShopifyToken(accessToken);

    await prisma.shopifyConnection.upsert({
      where: { userId_shopDomain: { userId: verifiedState.userId, shopDomain: shop } },
      create: {
        userId: verifiedState.userId,
        shopDomain: shop,
        accessTokenEncrypted,
        scope,
        status: "CONNECTED",
      },
      update: { accessTokenEncrypted, scope, status: "CONNECTED", lastError: null },
    });

    await logActivity({ userId: verifiedState.userId, action: "shopify_connected", entityType: "shopify_connection", entityId: shop });
    logger.info("shopify_connected", { userId: verifiedState.userId, shop });

    return redirectTo("/shopify?connected=true");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.shopifyConnection.upsert({
      where: { userId_shopDomain: { userId: verifiedState.userId, shopDomain: shop } },
      create: { userId: verifiedState.userId, shopDomain: shop, status: "ERROR", lastError: message },
      update: { status: "ERROR", lastError: message },
    });
    logger.error("shopify_connection_failed", { userId: verifiedState.userId, shop, error: message });
    return redirectTo("/shopify?error=connection_failed");
  }
}
