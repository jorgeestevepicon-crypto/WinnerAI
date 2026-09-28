"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { integrations } from "@/config/env";
import { logActivity } from "@/lib/activity/log";
import { buildAuthorizationUrl } from "@/lib/aliexpress/oauth";
import { createOAuthState } from "@/lib/aliexpress/state";

export async function getAliExpressAuthUrl() {
  const user = await requireUser();

  if (!integrations.aliexpressConfigured) {
    return {
      success: false as const,
      error: "AliExpress isn't configured in this environment. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET.",
    };
  }

  const state = createOAuthState(user.id);
  return { success: true as const, url: buildAuthorizationUrl(state) };
}

export async function getAliExpressConnectionStatus() {
  const user = await requireUser();
  const connection = await prisma.aliExpressConnection.findUnique({ where: { userId: user.id } });
  return connection?.status === "CONNECTED";
}

export async function disconnectAliExpress() {
  const user = await requireUser();
  const connection = await prisma.aliExpressConnection.findUnique({ where: { userId: user.id } });
  if (!connection) return { success: false as const, error: "Not connected" };

  await prisma.aliExpressConnection.update({
    where: { userId: user.id },
    data: { status: "DISCONNECTED", accessTokenEncrypted: null, refreshTokenEncrypted: null },
  });
  await logActivity({ userId: user.id, action: "aliexpress_disconnected" });

  revalidatePath("/products");
  return { success: true as const };
}
