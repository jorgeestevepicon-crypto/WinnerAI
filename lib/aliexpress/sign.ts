import "server-only";
import { createHash } from "crypto";

/**
 * Shared request-signing helpers for AliExpress's TOP-style Open Platform
 * gateway (`https://api-sg.aliexpress.com/sync` and `/rest`). Every request —
 * business API calls and the OAuth token endpoints alike — gets signed the
 * same way: sort all params alphabetically, concatenate key+value pairs,
 * wrap with the app secret, MD5 hash, uppercase.
 */

export const API_BASE = "https://api-sg.aliexpress.com/sync";

export function timestampGMT8(): string {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${gmt8.getFullYear()}-${pad(gmt8.getMonth() + 1)}-${pad(gmt8.getDate())} ${pad(gmt8.getHours())}:${pad(gmt8.getMinutes())}:${pad(gmt8.getSeconds())}`;
}

export function signParams(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const base = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  return createHash("md5").update(`${secret}${base}${secret}`, "utf8").digest("hex").toUpperCase();
}

export async function callAliExpress(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`AliExpress API request failed (${response.status})`);
  }
  return response.json();
}
