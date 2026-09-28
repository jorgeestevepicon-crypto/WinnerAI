import "server-only";
import { env } from "@/config/env";
import { API_BASE, signParamsWithPath, timestampMillis } from "@/lib/aliexpress/sign";

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

// AliExpress's system-level auth endpoints are namespaced REST paths (the
// path segment itself is the method, e.g. POST /rest/auth/token/create),
// unlike business methods which pass `method=aliexpress.xxx.yyy` as a query
// param to a single generic gateway path. Passing "auth/token/create" as a
// `method` query param (the first attempt here) got "InvalidApiPath" back;
// putting it in the URL path fixed that but then got "IncompleteSignature",
// since this path style folds the API path itself into the signed string
// (see signParamsWithPath) rather than just the query params.
async function callAuthMethod(methodPath: string, extraParams: Record<string, string>): Promise<TokenResponse> {
  const appKey = env.aliexpress.appKey!;
  const appSecret = env.aliexpress.appSecret!;

  const params: Record<string, string> = {
    app_key: appKey,
    timestamp: timestampMillis(),
    sign_method: "md5",
    format: "json",
    v: "2.0",
    ...extraParams,
  };
  params.sign = signParamsWithPath(`/${methodPath}`, params, appSecret);

  const url = new URL(`${API_BASE.replace("/sync", "/rest")}/${methodPath}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), { method: "POST" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AliExpress ${methodPath} failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.access_token !== "string") {
    throw new Error(`AliExpress ${methodPath} did not return an access_token: ${JSON.stringify(data)}`);
  }
  return data as unknown as TokenResponse;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  return callAuthMethod("auth/token/create", { code });
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return callAuthMethod("auth/token/refresh", { refresh_token: refreshToken });
}
