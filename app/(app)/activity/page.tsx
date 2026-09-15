import { History } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeTime, formatDate } from "@/lib/utils";
import type { ActivityAction } from "@/lib/activity/log";

export const metadata = { title: "Activity" };

const actionLabels: Record<ActivityAction, string> = {
  product_saved: "Saved a product",
  product_analyzed: "Analyzed a product",
  store_created: "Created a store",
  store_updated: "Updated a store",
  store_published: "Published a store to Shopify",
  ad_generated: "Generated an ad",
  ad_saved: "Saved an ad",
  shopify_connected: "Connected Shopify",
  shopify_disconnected: "Disconnected Shopify",
  subscription_updated: "Updated subscription",
};

export default async function ActivityPage() {
  const user = await requireUser();

  const activity = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">A full history of what you&apos;ve done in WinnerAI.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {activity.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="Actions like analyzing products or publishing stores will appear here." />
          ) : (
            <ol className="relative space-y-6 border-l pl-6">
              {activity.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{actionLabels[item.action as ActivityAction] ?? item.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)} · {relativeTime(item.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
