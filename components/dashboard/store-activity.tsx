import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeTime } from "@/lib/utils";
import type { getRecentStores } from "@/lib/dashboard/queries";

const statusVariant: Record<string, "outline" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "outline",
  GENERATING: "secondary",
  READY: "warning",
  PUBLISHED: "success",
  ERROR: "destructive",
};

export function StoreActivity({ stores }: { stores: Awaited<ReturnType<typeof getRecentStores>> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Store Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/stores">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="No stores yet"
            description="Build your first AI-generated store from a product you've analyzed."
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/store-builder">Build a store</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-1">
            {stores.map((store) => (
              <Link key={store.id} href={`/stores/${store.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{store.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {store.product?.title ?? "No linked product"} · updated {relativeTime(store.updatedAt)}
                  </p>
                </div>
                <Badge variant={statusVariant[store.status] ?? "outline"}>{store.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
