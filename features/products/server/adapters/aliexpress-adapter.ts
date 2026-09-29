import "server-only";
import { env } from "@/config/env";
import { signParams, timestampGMT8, callAliExpress } from "@/lib/aliexpress/sign";
import { getValidAccessToken } from "@/lib/aliexpress/connection";
import { CATEGORY_SEARCH_TERMS } from "@/features/products/categories";
import { generateProductSearchTerms } from "@/lib/ai/services/search-terms";
import type { NormalizedProductInput, ProductSearchParams, ProductSourceAdapter } from "@/features/products/types";

/**
 * AliExpress Dropshipping API (`aliexpress.ds.*`), via the AliExpress Open
 * Platform. This account only has "Drop Shipping" API access (not the
 * Affiliate API), so unlike a simple app-level key, every call here acts on
 * behalf of a specific user's OAuth-authorized AliExpress account — see
 * lib/aliexpress/oauth.ts and lib/aliexpress/connection.ts for that flow.
 *
 * Verified against a live account: `aliexpress.ds.text.search` requires
 * countryCode, currency, targetCurrency, local and targetLanguage (all
 * undocumented as "required" anywhere obvious — discovered one at a time
 * via MissingParameter errors), and its response uses camelCase field names
 * (title, targetSalePrice, itemMainPic, itemUrl, orders, itemId) rather than
 * the snake_case most TOP-style docs suggest. There's no human-readable
 * category name in the response, only numeric cateIds, so a product's
 * `category` here is whatever the user typed into the Category field when
 * searching (also folded into the actual keyword sent to AliExpress), or
 * "Uncategorized" if they only searched by keyword. If AliExpress changes
 * this API, the response envelope paths in extractProducts() are the first
 * thing to recheck (there are a few plausible ones tried in order).
 */

const METHOD = "aliexpress.ds.text.search";

/**
 * Maps real recent-order-volume onto our 0-100 demand scale via a log
 * curve, since raw order counts range from 0 to tens of thousands.
 * 10,000+ recent orders scores ~100. This is a heuristic derived from a
 * real signal, not a fabricated number.
 */
export function demandFromVolume(volume: number): number {
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

// Confirmed against a live aliexpress.ds.text.search response — this
// endpoint uses camelCase field names, not the snake_case the Affiliate
// API and most TOP-style docs use. `salePrice`/`salePriceCurrency` are in
// CNY; `targetSalePrice` is the one already converted to `targetCurrency`
// (USD here). `itemUrl` comes back protocol-relative ("//aliexpress.com/…").
// There's no human-readable category name in this response, only numeric
// `cateId`s, so category falls back to "Uncategorized".
interface DsProduct {
  itemId?: number | string;
  title?: string;
  itemMainPic?: string;
  itemUrl?: string;
  targetSalePrice?: string;
  orders?: number | string;
  evaluateRate?: string;
}

const MIN_RATING_PERCENT = 80;

function extractRating(p: DsProduct): number | undefined {
  if (p.evaluateRate === undefined) return undefined;
  const value = Number(p.evaluateRate);
  return Number.isNaN(value) ? undefined : value;
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
  return p.title;
}
function extractImage(p: DsProduct): string | undefined {
  return p.itemMainPic;
}
function extractUrl(p: DsProduct): string | undefined {
  if (!p.itemUrl) return undefined;
  return p.itemUrl.startsWith("//") ? `https:${p.itemUrl}` : p.itemUrl;
}
function extractPrice(p: DsProduct): number {
  return Number(p.targetSalePrice ?? 0);
}

/** Best-effort attempt at AliExpress's account-level recommended/best-selling feed, as a stronger "worth dropshipping" signal than pure keyword-search relevance. Unverified method name/params for this account — never throws; on any error it logs the raw response for later debugging and simply contributes zero extra products, so keyword search keeps working either way. */
const RECOMMEND_FEED_METHOD = "aliexpress.ds.recommend.feed.get";

async function fetchRecommendFeed(accessToken: string, params: ProductSearchParams): Promise<DsProduct[]> {
  try {
    const systemParams: Record<string, string> = {
      app_key: env.aliexpress.appKey!,
      method: RECOMMEND_FEED_METHOD,
      timestamp: timestampGMT8(),
      sign_method: "md5",
      format: "json",
      v: "2.0",
      session: accessToken,
      feed_name: "general",
      page_no: "1",
      page_size: String(Math.min(params.limit ?? 20, 50)),
      target_currency: params.currency?.trim() || "USD",
      target_language: "EN",
      country_code: params.country?.trim() || "US",
      local: "en_US",
    };
    systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

    const data = await callAliExpress(systemParams);
    const errorResponse = (data as Record<string, unknown>)?.error_response;
    if (errorResponse) {
      console.error(`${RECOMMEND_FEED_METHOD} unavailable on this account — falling back to keyword search only. Error:`, JSON.stringify(errorResponse));
      return [];
    }
    return extractProducts(data);
  } catch (error) {
    console.error(`${RECOMMEND_FEED_METHOD} call failed — falling back to keyword search only.`, error);
    return [];
  }
}

async function searchByKeyword(accessToken: string, keywords: string, params: ProductSearchParams): Promise<DsProduct[]> {
  const currency = params.currency?.trim() || "USD";
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
    targetCurrency: currency,
    currency,
    targetLanguage: "EN",
    local: "en_US",
    countryCode: params.country?.trim() || "US",
    // Surfaces the best-selling matches first — a much stronger "is this
    // actually worth dropshipping" signal than raw keyword relevance,
    // especially since the API seems to cap results per page regardless
    // of pageSize (only the top handful matter most). Unverified field
    // name/value — if this errors, check the sort options this account's
    // "Documentation" tab lists for aliexpress.ds.text.search.
    sort: "LAST_VOLUME_DESC",
  };
  systemParams.sign = signParams(systemParams, env.aliexpress.appSecret!);

  const data = await callAliExpress(systemParams);
  const errorResponse = (data as Record<string, unknown>)?.error_response;
  if (errorResponse) {
    throw new Error(`AliExpress ${METHOD} returned an error for "${keywords}": ${JSON.stringify(errorResponse)}`);
  }

  const products = extractProducts(data);
  if (products.length === 0) {
    // If AliExpress changes this response's envelope shape again, this
    // logs the raw body so extractProducts can be updated to match.
    console.error(`${METHOD} returned no products for "${keywords}" via known response paths. Raw response:`, JSON.stringify(data).slice(0, 4000));
  }
  return products;
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

    const category = params.category?.trim();
    const query = params.query?.trim();
    // AliExpress's search is a real product-title text search — an abstract
    // category word alone (e.g. "Technology") reliably returns zero results,
    // since sellers don't title products that way. Translate known
    // categories into an actual product-ish search phrase; the category
    // itself is still what gets saved/filtered on below.
    const categorySearchTerm = category && category in CATEGORY_SEARCH_TERMS ? CATEGORY_SEARCH_TERMS[category as keyof typeof CATEGORY_SEARCH_TERMS] : category;

    let keywordVariants: string[];
    if (categorySearchTerm) {
      // A single fixed phrase per category only ever surfaces one narrow
      // slice of AliExpress's catalog. Ask the AI provider for several
      // diverse, realistic product-title phrases for this category instead,
      // and search all of them — real winning-product candidates come from
      // covering more of the catalog, not from one lucky keyword.
      const diverseTerms = await generateProductSearchTerms(category!, categorySearchTerm);
      keywordVariants = diverseTerms.map((term) => [term, query].filter(Boolean).join(" "));
    } else if (query) {
      keywordVariants = [query];
    } else {
      return [];
    }

    const settled = await Promise.allSettled([
      ...keywordVariants.map((kw) => searchByKeyword(accessToken, kw, params)),
      // Only worth trying alongside a category search — for a bare keyword
      // query the account-level feed has no reason to relate to it.
      category ? fetchRecommendFeed(accessToken, params) : Promise.resolve([]),
    ]);

    const allProducts: DsProduct[] = [];
    let firstError: Error | null = null;
    for (const result of settled) {
      if (result.status === "fulfilled") {
        allProducts.push(...result.value);
      } else if (!firstError) {
        firstError = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
      }
    }

    if (allProducts.length === 0) {
      if (firstError) throw firstError;
      return [];
    }

    // Multiple keyword variants (and the recommend feed) commonly return the
    // same real item more than once — dedupe before scoring/normalizing.
    const seenIds = new Set<string>();
    const products = allProducts.filter((product) => {
      const key = String(product.itemId ?? product.title ?? "");
      if (!key || seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });

    const currency = params.currency?.trim() || "USD";

    const normalized = products
      .map((product): NormalizedProductInput | null => {
        const title = extractTitle(product);
        const cost = extractPrice(product);
        if (!title || !cost || Number.isNaN(cost)) return null;

        // A real buyer-rating signal, not fabricated — skip products with a
        // poor track record rather than suggest them for a store. Only
        // filters when the rating is actually present; missing data isn't
        // treated as a bad rating.
        const rating = extractRating(product);
        if (rating !== undefined && rating < MIN_RATING_PERCENT) return null;

        const volume = parseVolume(product.orders);
        // Standard 3x dropshipping markup as a starting suggestion the user
        // is expected to adjust in the product editor — not a claim about
        // real-world pricing data.
        const suggestedPrice = Math.floor(cost * 3) + 0.99;
        const image = extractImage(product);

        return {
          title,
          images: image ? [image] : [],
          // AliExpress's response has no human-readable category name, only
          // numeric cateIds — using the category the user searched for
          // (when given) instead lets the Product Finder's category filter
          // work meaningfully for these products.
          category: category || "Uncategorized",
          sourceUrl: extractUrl(product),
          supplierName: "AliExpress Seller",
          cost,
          price: suggestedPrice,
          currency,
          signals: { demand: demandFromVolume(volume) },
          // productRating (0-100, AliExpress's evaluateRate) is kept here —
          // not as its own Product column — so the Winning Products module
          // can seed a ProductSnapshot's rating without a second real-time
          // AliExpress call. See features/winning-products/server/snapshots.ts.
          metadata: { aliexpressProductId: product.itemId, recentOrders: volume, productRating: rating },
        };
      })
      .filter((product): product is NormalizedProductInput => product !== null)
      // Merged results come from several keyword variants plus the recommend
      // feed, each already sorted individually — re-sort the combined set by
      // the same real demand signal so the strongest sellers across all of
      // them surface first, then cap to what was actually requested.
      .sort((a, b) => (b.signals.demand ?? 0) - (a.signals.demand ?? 0))
      .slice(0, params.limit ?? 20);

    if (normalized.length < products.length) {
      console.error(`${METHOD}: merged ${products.length} unique raw products across ${keywordVariants.length} keyword variant(s), but only ${normalized.length} had both a title and a usable price and were kept.`);
    }

    if (products.length > 0 && normalized.length === 0) {
      console.error(`${METHOD} found raw products but all were dropped (missing title/price fields) — check the field names against DsProduct's field names.`);
    }

    return normalized;
  },
};
