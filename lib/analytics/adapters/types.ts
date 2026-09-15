export interface AnalyticsSnapshot {
  date: Date;
  revenue: number;
  orders: number;
  visitors?: number;
  conversionRate?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roas?: number;
  impressions?: number;
  spend?: number;
}

export type AnalyticsSourceId = "shopify" | "meta" | "tiktok" | "google" | "pinterest";

export interface AnalyticsAdapter {
  id: AnalyticsSourceId;
  label: string;
  configured: boolean;
  disabledReason?: string;
  fetchSnapshots(params: { userId: string; sinceDays: number }): Promise<AnalyticsSnapshot[]>;
}
