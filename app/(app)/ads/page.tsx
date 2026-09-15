import Link from "next/link";
import { Megaphone, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserCampaigns } from "@/features/ads/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Ad Studio" };

export default async function AdsPage() {
  const user = await requireUser();
  const campaigns = await getUserCampaigns(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Ad Studio</h1>
          <p className="text-sm text-muted-foreground">Generate ad copy and creatives for your products.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/ads/library">Ad Library</Link>
          </Button>
          <Button asChild>
            <Link href="/ads/new">
              <Sparkles className="h-4 w-4" /> New campaign
            </Link>
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create a campaign to start generating ad copy and creatives."
          action={
            <Button size="sm" className="mt-2" asChild>
              <Link href="/ads/new">New campaign</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/ads/${campaign.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{campaign.name}</p>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.platform} · {campaign.product?.title ?? "No product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.creatives.length} creative{campaign.creatives.length === 1 ? "" : "s"} · updated {relativeTime(campaign.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
