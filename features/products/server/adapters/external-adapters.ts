import { integrations } from "@/config/env";
import type { ProductSourceAdapter, ProductSourceId } from "@/features/products/types";
import { aliexpressProductSourceAdapter } from "@/features/products/server/adapters/aliexpress-adapter";

// These adapters implement the same ProductSourceAdapter contract as the
// demo catalog so the Product Finder never has to special-case a source.
// Most of them aren't wired to a real API yet because that would require
// credentials this deployment doesn't have (and, for several of these
// platforms, official partner/API access that has to be requested).
// Once credentials exist, replace `search()` with a real implementation
// against the provider's official API — never undocumented scraping.

function disabledAdapter(id: ProductSourceId, label: string, disabledReason: string): ProductSourceAdapter {
  return {
    id,
    label,
    configured: false,
    disabledReason,
    async search() {
      return [];
    },
  };
}

export const externalProductSourceAdapters: ProductSourceAdapter[] = [
  integrations.aliexpressConfigured
    ? aliexpressProductSourceAdapter
    : disabledAdapter(
        "aliexpress",
        "AliExpress",
        "Requires an AliExpress Open Platform app key and secret. Not configured in this environment."
      ),
  disabledAdapter(
    "amazon",
    "Amazon",
    "Requires Amazon Product Advertising API credentials (associate tag + access keys). Not configured in this environment."
  ),
  disabledAdapter(
    "tiktok",
    "TikTok",
    "Requires TikTok for Business API credentials. Not configured in this environment."
  ),
  // Google Trends and Meta Ad Library are deliberately NOT listed here.
  // Neither is a product catalog — there's nothing to "search" for a
  // product on either of them, only search-interest and ad-market data.
  // Both are wired in as real signals that enrich AliExpress-sourced
  // products instead (lib/trends/google-trends.ts, lib/meta-ads/client.ts,
  // used from features/products/server/actions.ts and Winning Products'
  // scoring) — listing them here as if they were alternative sources to
  // pick instead of AliExpress was a leftover from this screen's original
  // design, before that distinction was made.
];
