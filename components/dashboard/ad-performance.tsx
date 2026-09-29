import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { getAdPerformanceSummary } from "@/lib/dashboard/queries";

export async function AdPerformance({ summary }: { summary: Awaited<ReturnType<typeof getAdPerformanceSummary>> }) {
  const t = await getTranslations("dashboard.adPerformance");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ads">{t("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {summary.campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/ads">{t("createAds")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              {summary.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/ads/${campaign.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.platform} · {t("creatives", { count: campaign._count.creatives })}
                    </p>
                  </div>
                  <Badge variant="outline">{campaign.status}</Badge>
                </Link>
              ))}
            </div>
            {!summary.hasRealData && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{t("awaitingRealData")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
