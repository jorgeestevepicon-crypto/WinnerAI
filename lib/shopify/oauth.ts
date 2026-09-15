import crypto from "crypto";
import { env } from "@/config/env";

const REQUIRED_SCOPES = ["read_products", "write_products", "read_orders"];

export function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop);
}

export function buildAuthorizationUrl(params: { shop: string; state: string }): string {
  const url = new URL(`https://${params.shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", env.shopify.clientId ?? "");
  url.searchParams.set("scope", REQUIRED_SCOPES.join(","));
  url.searchParams.set("redirect_uri", `${env.shopify.appUrl}/api/shopify/callback`);
  url.searchParams.set("state", params.state);
  return url.toString();
}

/**
 * Verifies the HMAC signature Shopify attaches to every OAuth callback and
 * webhook request, per https://shopify.dev/docs/apps/auth/oauth#verification.
 */
export function verifyShopifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac || !env.shopify.clientSecret) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const digest = crypto.createHmac("sha256", env.shopify.clientSecret).update(message).digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmac, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function exchangeCodeForToken(shop: string, code: string): Promise<{ accessToken: string; scope: string }> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.shopify.clientId,
      client_secret: env.shopify.clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Shopify token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, scope: data.scope };
}
