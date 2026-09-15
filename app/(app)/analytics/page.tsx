import Link from "next/link";
import { DollarSign, ShoppingCart, TrendingUp, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getAnalyticsOverview, getConfiguredAnalyticsSources, getTopProducts, getTopAdVariants } from "@/features/analytics/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";
import { GrowthAgentPanel } from "@/features/analytics/components/growth-agent-panel";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const sources = getConfiguredAnalyticsSources();
  const [overview, topProducts, topAds] = await Promise.all([
    getAnalyticsOverview(user.id),
    getTopProducts(user.id),
    getTopAdVariants(user.id),
  ]);

  const stats = [
    { label: "Revenue", value: formatCurrency(overview.totals.revenue), icon: DollarSign },
    { label: "Orders", value: formatNumber(overview.totals.orders), icon: ShoppingCart },
    { label: "Spend", value: formatCurrency(overview.totals.spend), icon: TrendingUp },
    { label: "Impressions", value: formatNumber(overview.totals.impressions), icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Real performance data from your connected integrations.</p>
      </div>

      {!overview.hasRealData && (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Awaiting real campaign data. Connect{" "}
          <Link href="/shopify" className="underline">
            Shopify
          </Link>{" "}
          or an ad platform to see revenue, CTR, CPC, CPA and ROAS here.
          <div className="mt-2 flex flex-wrap gap-2">
            {sources.map((s) => (
              <Badge key={s.id} variant={s.configured ? "secondary" : "outline"}>
                {s.label}: {s.configured ? "configured" : "not configured"}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{overview.hasRealData ? stat.value : "—"}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scored products yet.</p>
            ) : (
              topProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
                  <span className="truncate text-sm">{p.title}</span>
                  <WinningScoreBadge score={p.winningScore} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top ads</CardTitle>
          </CardHeader>
          <CardContent>
            {topAds.length === 0 ? (
              <p className="text-sm text-muted-foreground">Awaiting real campaign data. Ad performance metrics (CTR, CPC, ROAS) will appear here once a connected ad platform reports results.</p>
            ) : (
              <div className="space-y-2">
                {topAds.map((ad) => (
                  <Link key={ad.id} href={`/ads/${ad.creative.campaignId}`} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50">
                    <span className="truncate text-sm">{ad.headline}</span>
                    <Badge variant="outline">{ad.creative.campaign.platform}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GrowthAgentPanel />
    </div>
  );
}
