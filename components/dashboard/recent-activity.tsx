import { History, Search, Store, Megaphone, ShoppingBag, Bookmark, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeTime } from "@/lib/utils";
import type { getRecentActivity } from "@/lib/dashboard/queries";
import type { ActivityAction } from "@/lib/activity/log";

const actionCopy: Record<ActivityAction, { label: string; icon: typeof History }> = {
  product_saved: { label: "Saved a product", icon: Bookmark },
  product_analyzed: { label: "Analyzed a product", icon: Search },
  store_created: { label: "Created a store", icon: Store },
  store_updated: { label: "Updated a store", icon: Store },
  store_published: { label: "Published a store to Shopify", icon: ShoppingBag },
  ad_generated: { label: "Generated an ad", icon: Megaphone },
  ad_saved: { label: "Saved an ad", icon: Megaphone },
  shopify_connected: { label: "Connected Shopify", icon: ShoppingBag },
  shopify_disconnected: { label: "Disconnected Shopify", icon: ShoppingBag },
  subscription_updated: { label: "Updated subscription", icon: CreditCard },
};

export function RecentActivity({ activity }: { activity: Awaited<ReturnType<typeof getRecentActivity>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Your actions across WinnerAI will show up here." />
        ) : (
          <ol className="space-y-4">
            {activity.map((item) => {
              const copy = actionCopy[item.action as ActivityAction] ?? { label: item.action, icon: History };
              const Icon = copy.icon;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm">{copy.label}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
