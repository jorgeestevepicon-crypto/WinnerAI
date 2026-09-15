import Link from "next/link";
import { Store as StoreIcon, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getUserStores } from "@/features/stores/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Stores" };

const statusVariant: Record<string, "outline" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "outline",
  GENERATING: "secondary",
  READY: "warning",
  PUBLISHED: "success",
  ERROR: "destructive",
};

export default async function StoresPage() {
  const user = await requireUser();
  const stores = await getUserStores(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
          <p className="text-sm text-muted-foreground">Stores generated with the AI Store Builder.</p>
        </div>
        <Button asChild>
          <Link href="/store-builder">
            <Sparkles className="h-4 w-4" /> New store
          </Link>
        </Button>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Generate your first AI store from a saved product."
          action={
            <Button size="sm" className="mt-2" asChild>
              <Link href="/store-builder">Build a store</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{store.name}</p>
                    <Badge variant={statusVariant[store.status] ?? "outline"}>{store.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{store.product?.title ?? "No linked product"}</p>
                  <p className="text-xs text-muted-foreground">Updated {relativeTime(store.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
