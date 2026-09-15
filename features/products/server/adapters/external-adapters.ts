import type { ProductSourceAdapter, ProductSourceId } from "@/features/products/types";

// These adapters implement the same ProductSourceAdapter contract as the
// demo catalog so the Product Finder never has to special-case a source.
// None of them are wired to a real API yet because that would require
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
  disabledAdapter(
    "aliexpress",
    "AliExpress",
    "Requires an AliExpress Open Platform (affiliate/dropshipping) API key. Not configured in this environment."
  ),
  disabledAdapter(
    "amazon",
    "Amazon",
    "Requires Amazon Product Advertising API credentials (associate tag + access keys). Not configured in this environment."
  ),
  disabledAdapter(
    "google_trends",
    "Google Trends",
    "Requires a Google Trends data provider integration. Not configured in this environment."
  ),
  disabledAdapter(
    "meta_ad_library",
    "Meta Ad Library",
    "Requires a Meta Ad Library API access token. Not configured in this environment."
  ),
  disabledAdapter(
    "tiktok",
    "TikTok",
    "Requires TikTok for Business API credentials. Not configured in this environment."
  ),
];
