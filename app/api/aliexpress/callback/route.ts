import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { env, integrations } from "@/config/env";
import { exchangeCodeForToken } from "@/lib/aliexpress/oauth";
import { verifyOAuthState } from "@/lib/aliexpress/state";
import { encryptAliExpressToken } from "@/lib/aliexpress/crypto";
import { logActivity } from "@/lib/activity/log";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, env.appUrl));

  if (!integrations.aliexpressConfigured) {
    return redirectTo("/products?aliexpress_error=not_configured");
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { code, state } = searchParams;

  if (!code || !state) {
    return redirectTo("/products?aliexpress_error=invalid_request");
  }

  const verifiedState = verifyOAuthState(state);
  if (!verifiedState) {
    return redirectTo("/products?aliexpress_error=invalid_state");
  }

  try {
    const { access_token, refresh_token, expires_in } = await exchangeCodeForToken(code);
    const accessTokenEncrypted = encryptAliExpressToken(access_token);
    const refreshTokenEncrypted = refresh_token ? encryptAliExpressToken(refresh_token) : null;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

    await prisma.aliExpressConnection.upsert({
      where: { userId: verifiedState.userId },
      create: { userId: verifiedState.userId, accessTokenEncrypted, refreshTokenEncrypted, expiresAt, status: "CONNECTED" },
      update: { accessTokenEncrypted, refreshTokenEncrypted, expiresAt, status: "CONNECTED", lastError: null },
    });

    await logActivity({ userId: verifiedState.userId, action: "aliexpress_connected" });
    logger.info("aliexpress_connected", { userId: verifiedState.userId });

    return redirectTo("/products?aliexpress_connected=true");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.aliExpressConnection.upsert({
      where: { userId: verifiedState.userId },
      create: { userId: verifiedState.userId, status: "ERROR", lastError: message },
      update: { status: "ERROR", lastError: message },
    });
    logger.error("aliexpress_connection_failed", { userId: verifiedState.userId, error: message });
    return redirectTo("/products?aliexpress_error=connection_failed");
  }
}
