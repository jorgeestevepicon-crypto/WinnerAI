import crypto from "crypto";
import { env } from "@/config/env";

function getSigningSecret(): string {
  if (!env.auth.secret) {
    // Falling back to a hardcoded value here would make every OAuth state
    // token forgeable — fail loudly instead of silently weakening the check.
    throw new Error("AUTH_SECRET must be set to sign Shopify OAuth state tokens.");
  }
  return env.auth.secret;
}

/**
 * Signs a short-lived OAuth state token binding the flow to the initiating
 * user, without needing a database row just to survive the redirect round
 * trip to Shopify and back.
 */
export function createOAuthState(userId: string): string {
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = Buffer.from(JSON.stringify({ userId, nonce, ts: Date.now() })).toString("base64url");
  const signature = crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string): { userId: string } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Date.now() - decoded.ts > 10 * 60 * 1000) return null; // 10 minute expiry
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
