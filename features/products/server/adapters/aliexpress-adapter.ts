import "server-only";
import { createHash } from "crypto";
import { env } from "@/config/env";
import type { NormalizedProductInput, ProductSearchParams, ProductSourceAdapter } from "@/features/products/types";

/**
 * AliExpress Affiliate API (part of the AliExpress Open Platform).
 *
 * This has not been exercised against a live AliExpress Open Platform
 * account in this environment — the endpoint, parameter names, response
 * shape and signing scheme below match their classic TOP-style affiliate
 * API as documented at https://openservice.aliexpress.com, but that API
 * (like every marketplace partner API) can change. Verify against current
 * docs before relying on this in production, especially: the response
 * envelope shape, whether `sign_method` still defaults to plain MD5 wrap-
 * signing vs HMAC, and the exact field names under `product_query_response`.
 *
 * Also note a structural limit, not a bug: AliExpress's affiliate API gives
 * real product data (title, images, price, recent order volume) but no
 * trend/competition/saturation/engagement/growth signals — those simply
 * don't exist in their data. `demand` is derived from real recent order
 * volume; the other five Winning Score signals are left undefined rather
 * than invented (see scoring.ts's partial-signal handling).
 */

const API_BASE = "https://api-sg.aliexpress.com/sync";
const METHOD = "aliexpress.affiliate.product.query";

function timestampGMT8(): string {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${gmt8.getFullYear()}-${pad(gmt8.getMonth() + 1)}-${pad(gmt8.getDate())} ${pad(gmt8.getHours())}:${pad(gmt8.getMinutes())}:${pad(gmt8.getSeconds())}`;
}

function signParams(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const base = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  return createHash("md5").update(`${secret}${base}${secret}`, "utf8").digest("hex").toUpperCase();
}

/**
 * Maps real recent-order-volume onto our 0-100 demand scale via a log
 * curve, since raw order counts range from 0 to tens of thousands.
 * 10,000+ recent orders scores ~100. This is a heuristic derived from a
 * real signal, not a fabricated number.
 */
function demandFromVolume(volume: number): number {
  if (volume <= 0) return 0;
  return Math.round(Math.min(100, (Math.log10(volume + 1) / Math.log10(10000)) * 100));
}

function parseVolume(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }
  return 0;
}

interface AliExpressProduct {
  product_id: number | string;
  product_title: string;
  product_main_image_url?: string;
  product_small_image_urls?: { string?: string[] };
  product_detail_url?: string;
  promotion_link?: string;
  shop_url?: string;
  target_sale_price?: string;
  first_level_category_name?: string;
  second_level_category_name?: string;
  lastest_volume?: number | string;
}

function extractImages(product: AliExpressProduct): string[] {
  const images: string[] = [];
  if (product.product_main_image_url) images.push(product.product_main_image_url);
  if (Array.isArray(product.product_small_image_urls?.string)) {
    images.push(...product.product_small_image_urls!.string!);
  }
  return images;
}

async function callAliExpress(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`AliExpress API request failed (${response.status})`);
  }
  return response.json();
}

export const aliexpressProductSourceAdapter: ProductSourceAdapter = {
  id: "aliexpress",
  label: "AliExpress",
  configured: true,
  async search(params: ProductSearchParams): Promise<NormalizedProductInput[]> {
    // AliExpress's category filter uses their own internal numeric taxonomy
    // (fetched separately via aliexpress.affiliate.category.get), which we
    // don't have a mapping for from plain category names. Falling back to
    // searching the category name as a keyword still returns relevant
    // results via their full-text search.
    const keywords = params.query?.trim() || params.category?.trim();
    if (!keywords) return [];

    const systemParams: Record<string, string> = {
      app_key: env.aliexpress.appKey!,
      method: METHOD,
      timestamp: timestampGMT8(),
      sign_method: "md5",
      format: "json",
      v: "2.0",
      keywords,
      tracking_id: env.aliexpress.trackingId!,
      page_no: "1",
      page_size: String(Math.min(params.limit ?? 20, 50)),
      target_currency: "USD",
      target_language: "EN",
      sort: "LAST_VOLUME_DESC",
    };
    systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

    const data = (await callAliExpress(systemParams)) as {
      aliexpress_affiliate_product_query_response?: {
        resp_result?: { result?: { products?: { product?: AliExpressProduct[] } } };
      };
    };

    const products = data.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product ?? [];

    return products
      .map((product): NormalizedProductInput | null => {
        const cost = Number(product.target_sale_price ?? 0);
        if (!cost || Number.isNaN(cost)) return null;

        const volume = parseVolume(product.lastest_volume);
        // Standard 3x dropshipping markup as a starting suggestion the user
        // is expected to adjust in the product editor — not a claim about
        // real-world pricing data.
        const suggestedPrice = Math.floor(cost * 3) + 0.99;

        return {
          title: product.product_title,
          images: extractImages(product),
          category: product.second_level_category_name || product.first_level_category_name || "Uncategorized",
          sourceUrl: product.promotion_link || product.product_detail_url,
          supplierName: "AliExpress Seller",
          supplierUrl: product.shop_url,
          cost,
          price: suggestedPrice,
          currency: "USD",
          signals: { demand: demandFromVolume(volume) },
          metadata: { aliexpressProductId: product.product_id, recentOrders: volume },
        };
      })
      .filter((product): product is NormalizedProductInput => product !== null);
  },
};
