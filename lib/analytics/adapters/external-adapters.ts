import type { AnalyticsAdapter, AnalyticsSourceId } from "@/lib/analytics/adapters/types";

function disabledAdapter(id: AnalyticsSourceId, label: string, disabledReason: string): AnalyticsAdapter {
  return {
    id,
    label,
    configured: false,
    disabledReason,
    async fetchSnapshots() {
      return [];
    },
  };
}

// Meta/TikTok/Google/Pinterest Ads analytics adapters — implement
// fetchSnapshots() against each platform's official reporting API once
// credentials are available. None of the required API keys exist in this
// deployment's environment yet.
export const externalAnalyticsAdapters: AnalyticsAdapter[] = [
  disabledAdapter("meta", "Meta Ads", "Requires a Meta Marketing API access token."),
  disabledAdapter("tiktok", "TikTok Ads", "Requires TikTok for Business Ads API credentials."),
  disabledAdapter("google", "Google Ads", "Requires Google Ads API OAuth credentials."),
  disabledAdapter("pinterest", "Pinterest Ads", "Requires Pinterest Ads API credentials."),
];
