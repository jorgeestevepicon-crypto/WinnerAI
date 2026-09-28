import "server-only";
import { env } from "@/config/env";
import { API_BASE, signParams, timestampMillis } from "@/lib/aliexpress/sign";

/**
 * AliExpress Open Platform OAuth2 flow for the Dropshipping API (distinct
 * from the Affiliate API's simple app-level key — Dropshipping calls act on
 * behalf of a specific authorized account, so each user connects their own).
 *
 * This has not been exercised against a live AliExpress Open Platform
 * account in this environment. The authorize endpoint and the system
 * `auth/token/create` / `auth/token/refresh` methods below match AliExpress's
 * documented OAuth flow at the time this was written, but this is one of the
 * less consistently documented parts of their platform — verify against
 * https://open.aliexpress.com's current docs (check the app's own "Auth
 * Management" page for the exact authorize URL it expects) before relying on
 * this, and adjust the endpoint/param/response field names if they've moved.
 */

const AUTHORIZE_BASE = "https://api-sg.aliexpress.com/oauth/authorize";

export function getCallbackUrl(): string {
  return `${env.appUrl}/api/aliexpress/callback`;
}

export function buildAuthorizationUrl(state: string): string {
  const url = new URL(AUTHORIZE_BASE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("force_auth", "true");
  url.searchParams.set("client_id", env.aliexpress.appKey ?? "");
  url.searchParams.set("redirect_uri", getCallbackUrl());
  url.searchParams.set("state", state);
  url.searchParams.set("sp", "ae");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function callAuthMethod(method: string, extraParams: Record<string, string>): Promise<TokenResponse> {
  const appKey = env.aliexpress.appKey!;
  const appSecret = env.aliexpress.appSecret!;

  const params: Record<string, string> = {
    app_key: appKey,
    method,
    timestamp: timestampMillis(),
    sign_method: "md5",
    format: "json",
    v: "2.0",
    ...extraParams,
  };
  params.sign = signParams(params, appSecret);

  const url = new URL(API_BASE.replace("/sync", "/rest"));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), { method: "POST" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AliExpress ${method} failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.access_token !== "string") {
    throw new Error(`AliExpress ${method} did not return an access_token: ${JSON.stringify(data)}`);
  }
  return data as unknown as TokenResponse;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  return callAuthMethod("auth/token/create", { code });
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return callAuthMethod("auth/token/refresh", { refresh_token: refreshToken });
}
