import "server-only";
import { env } from "@/config/env";
import { signParams, timestampGMT8, callAliExpress } from "@/lib/aliexpress/sign";
import { getValidAccessToken } from "@/lib/aliexpress/connection";
import type { NormalizedProductInput, ProductSearchParams, ProductSourceAdapter } from "@/features/products/types";

/**
 * AliExpress Dropshipping API (`aliexpress.ds.*`), via the AliExpress Open
 * Platform. This account only has "Drop Shipping" API access (not the
 * Affiliate API), so unlike a simple app-level key, every call here acts on
 * behalf of a specific user's OAuth-authorized AliExpress account — see
 * lib/aliexpress/oauth.ts and lib/aliexpress/connection.ts for that flow.
 *
 * This has not been exercised against a live AliExpress Open Platform
 * account in this environment. `aliexpress.ds.text.search` is this account's
 * best-known product-search method for the Dropshipping API family, but its
 * exact parameter names and response envelope are less consistently
 * documented than the Affiliate API's — verify against the "Documentation"
 * tab in your Open Platform app console before relying on this, and adjust
 * the method name / request params / response parsing below if they differ.
 * Response parsing below tries a couple of plausible envelope shapes and
 * fails safely (empty results, surfaced error) rather than crashing if none
 * of them match — check the real response the first time this runs and fix
 * the path if needed.
 */

const METHOD = "aliexpress.ds.text.search";

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

interface DsProduct {
  product_id?: number | string;
  item_id?: number | string;
  product_title?: string;
  subject?: string;
  product_image?: string;
  image_url?: string;
  product_detail_url?: string;
  item_url?: string;
  target_sale_price?: string;
  sale_price?: string;
  category_name?: string;
  trade_volume?: number | string;
  volume?: number | string;
}

/** Digs through a couple of plausible response envelope shapes for the product list, since the exact one hasn't been confirmed against a live response yet. */
function extractProducts(data: unknown): DsProduct[] {
  const root = data as Record<string, unknown> & {
    aliexpress_ds_text_search_response?: {
      data?: { products?: { selection_search_product?: unknown }; result?: { products?: { product?: unknown } } };
      result?: { products?: { product?: unknown } };
    };
    data?: { products?: unknown };
  };
  const candidates = [
    root?.aliexpress_ds_text_search_response?.data?.products?.selection_search_product,
    root?.aliexpress_ds_text_search_response?.data?.result?.products?.product,
    root?.aliexpress_ds_text_search_response?.result?.products?.product,
    root?.data?.products,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function extractTitle(p: DsProduct): string | undefined {
  return p.product_title || p.subject;
}
function extractImage(p: DsProduct): string | undefined {
  return p.product_image || p.image_url;
}
function extractUrl(p: DsProduct): string | undefined {
  return p.product_detail_url || p.item_url;
}
function extractPrice(p: DsProduct): number {
  return Number(p.target_sale_price ?? p.sale_price ?? 0);
}

export const aliexpressProductSourceAdapter: ProductSourceAdapter = {
  id: "aliexpress",
  label: "AliExpress",
  // App-level: the Open Platform app exists. Whether *this* user has
  // authorized it is checked separately (getAliExpressConnectionStatus) so
  // the UI can prompt them to connect instead of hiding the source outright.
  configured: true,
  async search(params: ProductSearchParams): Promise<NormalizedProductInput[]> {
    if (!params.userId) return [];

    const accessToken = await getValidAccessToken(params.userId);
    if (!accessToken) {
      throw new Error("Your AliExpress account isn't connected yet. Connect it first, then search again.");
    }

    const keywords = params.query?.trim() || params.category?.trim();
    if (!keywords) return [];

    const systemParams: Record<string, string> = {
      app_key: env.aliexpress.appKey!,
      method: METHOD,
      timestamp: timestampGMT8(),
      sign_method: "md5",
      format: "json",
      v: "2.0",
      session: accessToken,
      keyWord: keywords,
      pageSize: String(Math.min(params.limit ?? 20, 50)),
      pageIndex: "1",
      targetCurrency: "USD",
      currency: "USD",
      targetLanguage: "EN",
      local: "en_US",
      countryCode: params.country?.trim() || "US",
    };
    systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

    const data = await callAliExpress(systemParams);
    const errorResponse = (data as Record<string, unknown>)?.error_response;
    if (errorResponse) {
      throw new Error(`AliExpress ${METHOD} returned an error: ${JSON.stringify(errorResponse)}`);
    }

    const products = extractProducts(data);
    if (products.length === 0) {
      // The exact response envelope for this method hasn't been confirmed
      // against a live account yet — log the raw shape so it can be fixed
      // once we see it, instead of silently returning "no results" forever.
      console.error(`${METHOD} returned no products via known response paths. Raw response:`, JSON.stringify(data).slice(0, 4000));
    } else {
      console.error(`${METHOD} found ${products.length} raw products. First one:`, JSON.stringify(products[0]).slice(0, 2000));
    }

    const normalized = products
      .map((product): NormalizedProductInput | null => {
        const title = extractTitle(product);
        const cost = extractPrice(product);
        if (!title || !cost || Number.isNaN(cost)) return null;

        const volume = parseVolume(product.trade_volume ?? product.volume);
        // Standard 3x dropshipping markup as a starting suggestion the user
        // is expected to adjust in the product editor — not a claim about
        // real-world pricing data.
        const suggestedPrice = Math.floor(cost * 3) + 0.99;
        const image = extractImage(product);

        return {
          title,
          images: image ? [image] : [],
          category: product.category_name || "Uncategorized",
          sourceUrl: extractUrl(product),
          supplierName: "AliExpress Seller",
          cost,
          price: suggestedPrice,
          currency: "USD",
          signals: { demand: demandFromVolume(volume) },
          metadata: { aliexpressProductId: product.product_id ?? product.item_id, recentOrders: volume },
        };
      })
      .filter((product): product is NormalizedProductInput => product !== null);

    if (products.length > 0 && normalized.length === 0) {
      console.error(`${METHOD} found raw products but all were dropped (missing title/price fields) — check the field names in the "found N raw products" log above against DsProduct's field names.`);
    }

    return normalized;
  },
};
