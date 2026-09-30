import "server-only";
import { env } from "@/config/env";
import { signParams, timestampGMT8, callAliExpress } from "@/lib/aliexpress/sign";

/**
 * AliExpress's category-tree method (`aliexpress.ds.category.get`), same
 * naming family as the already-verified `aliexpress.ds.text.search`. This
 * account has never called this endpoint before, so — like
 * lib/aliexpress/product-detail.ts — this tries a handful of plausible
 * field names and envelope shapes, and always logs the full raw response,
 * so it can be corrected from a real production log the same way every
 * other AliExpress endpoint in this app was. Never throws: an empty/failed
 * response just means "no real categories available yet", so the Product
 * Finder falls back to the curated category list rather than breaking.
 */
const METHOD = "aliexpress.ds.category.get";

export interface AliExpressCategory {
  id: string;
  name: string;
  parentId: string | null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function extractCategories(data: unknown): AliExpressCategory[] {
  const root = data as Record<string, unknown> & {
    aliexpress_ds_category_get_response?: { data?: unknown; result?: unknown };
    data?: unknown;
    result?: unknown;
  };
  const candidates: unknown[] = [
    root?.aliexpress_ds_category_get_response?.data,
    root?.aliexpress_ds_category_get_response?.result,
    root?.data,
    root?.result,
  ];

  for (const candidate of candidates) {
    let list: unknown;
    if (Array.isArray(candidate)) {
      list = candidate;
    } else if (candidate && typeof candidate === "object") {
      const obj = candidate as Record<string, unknown>;
      list = obj.categories ?? obj.category;
    }
    if (!Array.isArray(list)) continue;

    const categories = list
      .map((raw): AliExpressCategory | null => {
        if (!raw || typeof raw !== "object") return null;
        const item = raw as Record<string, unknown>;
        const id = pickString(item, ["categoryId", "category_id", "id"]);
        const name = pickString(item, ["categoryName", "category_name", "name"]);
        if (!id || !name) return null;
        const parentId = pickString(item, ["parentCategoryId", "parent_category_id", "parentId"]) ?? null;
        return { id, name, parentId };
      })
      .filter((c): c is AliExpressCategory => c !== null);

    if (categories.length > 0) return categories;
  }
  return [];
}

export async function getAliExpressCategories(accessToken: string): Promise<AliExpressCategory[]> {
  try {
    const systemParams: Record<string, string> = {
      app_key: env.aliexpress.appKey!,
      method: METHOD,
      timestamp: timestampGMT8(),
      sign_method: "md5",
      format: "json",
      v: "2.0",
      session: accessToken,
    };
    systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

    const data = await callAliExpress(systemParams);
    const errorResponse = (data as Record<string, unknown>)?.error_response;
    if (errorResponse) {
      console.error(`${METHOD} returned an error:`, JSON.stringify(errorResponse));
      return [];
    }

    const categories = extractCategories(data);
    if (categories.length === 0) {
      console.error(`${METHOD} returned no categories via known response paths. Raw response:`, JSON.stringify(data).slice(0, 4000));
    }
    return categories;
  } catch (error) {
    console.error(`${METHOD} call failed`, error);
    return [];
  }
}
