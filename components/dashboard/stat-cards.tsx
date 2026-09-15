import { Search, Bookmark, Store, Megaphone, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { getDashboardStats } from "@/lib/dashboard/queries";

export function StatCards({ stats }: { stats: Awaited<ReturnType<typeof getDashboardStats>> }) {
  const items = [
    { label: "Products discovered", value: stats.productsDiscovered, icon: Search },
    { label: "Products saved", value: stats.productsSaved, icon: Bookmark },
    { label: "Stores created", value: stats.storesCreated, icon: Store },
    { label: "Ads generated", value: stats.adsGenerated, icon: Megaphone },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <Badge variant={stats.shopifyStatus === "CONNECTED" ? "success" : "outline"}>
              {stats.shopifyStatus === "CONNECTED" ? "Connected" : "Not connected"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">Shopify</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
