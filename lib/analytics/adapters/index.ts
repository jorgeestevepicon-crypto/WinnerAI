import type { AnalyticsAdapter } from "@/lib/analytics/adapters/types";
import { shopifyAnalyticsAdapter } from "@/lib/analytics/adapters/shopify-adapter";
import { externalAnalyticsAdapters } from "@/lib/analytics/adapters/external-adapters";

export const analyticsAdapters: AnalyticsAdapter[] = [shopifyAnalyticsAdapter, ...externalAnalyticsAdapters];

export async function fetchAllAnalyticsSnapshots(userId: string, sinceDays = 30) {
  const results = await Promise.all(
    analyticsAdapters
      .filter((adapter) => adapter.configured)
      .map(async (adapter) => ({ source: adapter.id, snapshots: await adapter.fetchSnapshots({ userId, sinceDays }) }))
  );
  return results.filter((r) => r.snapshots.length > 0);
}
