import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

export async function StoreActivity({ stores }: { stores: Awaited<ReturnType<typeof getRecentStores>> }) {
  const t = await getTranslations("dashboard.storeActivity");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/stores">{t("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/store-builder">{t("buildStore")}</Link>
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
                    {store.product?.title ?? t("noLinkedProduct")} · {t("updated", { time: relativeTime(store.updatedAt) })}
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
