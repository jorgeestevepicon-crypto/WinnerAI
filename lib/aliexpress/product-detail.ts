import "server-only";
import { env } from "@/config/env";
import { signParams, timestampGMT8, callAliExpress } from "@/lib/aliexpress/sign";

/**
 * AliExpress's single-item detail method (`aliexpress.ds.product.get`),
 * same naming family as the already-verified `aliexpress.ds.text.search`.
 * Unlike that search method, this account has never called this one before,
 * so none of its field names are confirmed yet. This picks from a handful of
 * plausible field names per value and always logs the full raw response, so
 * it can be corrected from a real production log the same way every other
 * AliExpress endpoint in this app was — never invents a field that isn't in
 * the response. Never throws: a failed or unrecognized response just means
 * "no extra detail available", so the Winning Products module still works
 * (with the fields it already had from search) if this endpoint isn't
 * granted for this account or returns something unexpected.
 */
const METHOD = "aliexpress.ds.product.get";

export interface AliExpressProductDetail {
  itemId: string;
  title?: string;
  image?: string;
  price?: number;
  currency: string;
  orders?: number;
  rating?: number;
  /** Unverified field name — see the module doc comment. */
  storeRating?: number;
  /** Unverified field name — see the module doc comment. */
  reviewCount?: number;
  /** Unverified field name — see the module doc comment. */
  weightGrams?: number;
  /** Unverified field name — see the module doc comment. */
  shippingDays?: number;
  /** Unverified field name — see the module doc comment. */
  shippingCost?: number;
}

function extractItem(data: unknown): Record<string, unknown> | null {
  const root = data as Record<string, unknown> & {
    aliexpress_ds_product_get_response?: { result?: Record<string, unknown>; data?: Record<string, unknown> };
    result?: Record<string, unknown>;
  };
  const candidates = [root?.aliexpress_ds_product_get_response?.result, root?.aliexpress_ds_product_get_response?.data, root?.result];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") return candidate;
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const num = Number(value.replace(/[^\d.-]/g, ""));
      if (!Number.isNaN(num)) return num;
    }
  }
  return undefined;
}

export async function getAliExpressProductDetail(
  itemId: string,
  accessToken: string,
  options?: { currency?: string; shipToCountry?: string }
): Promise<AliExpressProductDetail | null> {
  const currency = options?.currency?.trim() || "USD";
  const shipToCountry = options?.shipToCountry?.trim() || "US";

  try {
    const systemParams: Record<string, string> = {
      app_key: env.aliexpress.appKey!,
      method: METHOD,
      timestamp: timestampGMT8(),
      sign_method: "md5",
      format: "json",
      v: "2.0",
      session: accessToken,
      product_id: itemId,
      target_currency: currency,
      target_language: "EN",
      ship_to_country: shipToCountry,
    };
    systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

    const data = await callAliExpress(systemParams);
    const errorResponse = (data as Record<string, unknown>)?.error_response;
    if (errorResponse) {
      console.error(`${METHOD} returned an error for item ${itemId}:`, JSON.stringify(errorResponse));
      return null;
    }

    const item = extractItem(data);
    if (!item) {
      console.error(`${METHOD} response didn't match any known envelope shape for item ${itemId}. Raw response:`, JSON.stringify(data).slice(0, 4000));
      return null;
    }

    return {
      itemId,
      title: pickString(item, ["title", "subject"]),
      image: pickString(item, ["itemMainPic", "mainImageUrl"]),
      price: pickNumber(item, ["targetSalePrice", "salePrice"]),
      currency,
      orders: pickNumber(item, ["orders", "lastVolume", "sales30Days"]),
      rating: pickNumber(item, ["evaluateRate", "avgEvaluationRating"]),
      storeRating: pickNumber(item, ["storeRating", "sellerPositiveRate", "shopRating"]),
      reviewCount: pickNumber(item, ["evaluationCount", "reviewCount", "totalEvaluations"]),
      weightGrams: pickNumber(item, ["packageWeight", "grossWeight", "productWeight"]),
      shippingDays: pickNumber(item, ["estimatedDeliveryDays", "shippingTime", "deliveryDays"]),
      shippingCost: pickNumber(item, ["freight", "shippingCost", "logisticsCost"]),
    };
  } catch (error) {
    console.error(`${METHOD} call failed for item ${itemId}`, error);
    return null;
  }
}

/** Extracts a numeric AliExpress item id from a raw id or a product page URL like https://www.aliexpress.com/item/1005006123456789.html. */
export function parseAliExpressItemId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/item\/(\d+)\.html/);
  return match ? match[1] : null;
}
