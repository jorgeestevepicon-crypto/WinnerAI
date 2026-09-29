import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";
import { formatCurrency } from "@/lib/utils";
import type { getTopProductOpportunities } from "@/lib/dashboard/queries";

export async function ProductOpportunities({
  products,
}: {
  products: Awaited<ReturnType<typeof getTopProductOpportunities>>;
}) {
  const t = await getTranslations("dashboard.productOpportunities");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">{t("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/products">{t("findProducts")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-1">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(product.price, product.currency)} · {product.category ?? t("uncategorized")}
                  </p>
                </div>
                <WinningScoreBadge score={product.winningScore} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
