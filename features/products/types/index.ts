export interface RawProductSignals {
  /** 0-100, how much search/purchase interest exists for this product. */
  demand: number;
  /** 0-100, how strongly interest is trending upward. */
  trend: number;
  /** 0-100, how much ad/marketplace competition exists (higher = more competition). */
  competition: number;
  /** 0-100, how saturated the market already is (higher = more saturated). */
  saturation: number;
  /** 0-100, social engagement (likes/comments/shares) around the product. */
  engagement: number;
  /** 0-100, month-over-month growth of interest. */
  growth: number;
}

export interface NormalizedProductInput {
  title: string;
  description?: string;
  images: string[];
  category: string;
  sourceUrl?: string;
  supplierName?: string;
  supplierUrl?: string;
  cost: number;
  price: number;
  currency: string;
  shippingCost?: number;
  country?: string;
  signals: RawProductSignals;
  metadata?: Record<string, unknown>;
}

export type ProductSourceId =
  | "demo"
  | "aliexpress"
  | "amazon"
  | "google_trends"
  | "meta_ad_library"
  | "tiktok";

export interface ProductSearchParams {
  query?: string;
  category?: string;
  country?: string;
  limit?: number;
}

/**
 * Every product data source (demo, AliExpress, Amazon, Google Trends, Meta Ad
 * Library, TikTok, ...) implements this interface so the Product Finder never
 * has to know which source it's talking to. Only `demo` ships wired up to
 * real logic; the rest are registered as disabled adapters until their API
 * credentials are configured, per the .env.example variables they document.
 */
export interface ProductSourceAdapter {
  id: ProductSourceId;
  label: string;
  configured: boolean;
  disabledReason?: string;
  search(params: ProductSearchParams): Promise<NormalizedProductInput[]>;
}
