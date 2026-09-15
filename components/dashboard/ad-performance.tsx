import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { getAdPerformanceSummary } from "@/lib/dashboard/queries";

export function AdPerformance({ summary }: { summary: Awaited<ReturnType<typeof getAdPerformanceSummary>> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Ad Performance</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ads">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {summary.campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No ad campaigns yet"
            description="Generate ad copy and creatives with the AI Ad Studio."
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/ads">Create ads</Link>
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
                      {campaign.platform} · {campaign._count.creatives} creative{campaign._count.creatives === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant="outline">{campaign.status}</Badge>
                </Link>
              ))}
            </div>
            {!summary.hasRealData && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Awaiting real campaign data. Connect Meta, TikTok, Google or Pinterest to see CTR, CPC and ROAS here.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
