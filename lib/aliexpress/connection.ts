import "server-only";
import { prisma } from "@/lib/db/prisma";
import { encryptAliExpressToken, decryptAliExpressToken } from "@/lib/aliexpress/crypto";
import { refreshAccessToken } from "@/lib/aliexpress/oauth";

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * Returns a valid access token for the user's connected AliExpress account,
 * transparently refreshing it first if it's expired or close to expiring.
 * Returns null if the user hasn't connected AliExpress (never throws for
 * that case — callers treat it the same as "source not available").
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.aliExpressConnection.findUnique({ where: { userId } });
  if (!connection || connection.status !== "CONNECTED" || !connection.accessTokenEncrypted) return null;

  const needsRefresh = connection.expiresAt ? connection.expiresAt.getTime() - Date.now() < REFRESH_MARGIN_MS : false;

  if (!needsRefresh) {
    return decryptAliExpressToken(connection.accessTokenEncrypted);
  }

  if (!connection.refreshTokenEncrypted) {
    return decryptAliExpressToken(connection.accessTokenEncrypted);
  }

  try {
    const refreshToken = decryptAliExpressToken(connection.refreshTokenEncrypted);
    const { access_token, refresh_token, expires_in } = await refreshAccessToken(refreshToken);

    await prisma.aliExpressConnection.update({
      where: { userId },
      data: {
        accessTokenEncrypted: encryptAliExpressToken(access_token),
        refreshTokenEncrypted: refresh_token ? encryptAliExpressToken(refresh_token) : connection.refreshTokenEncrypted,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        lastError: null,
      },
    });

    return access_token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    await prisma.aliExpressConnection.update({ where: { userId }, data: { status: "ERROR", lastError: message } });
    return null;
  }
}
