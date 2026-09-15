import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";
import { formatCurrency } from "@/lib/utils";
import type { getTopProductOpportunities } from "@/lib/dashboard/queries";

export function ProductOpportunities({
  products,
}: {
  products: Awaited<ReturnType<typeof getTopProductOpportunities>>;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Product Opportunities</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No scored products yet"
            description="Run the Product Finder to discover and score potential winning products."
            action={
              <Button size="sm" className="mt-2" asChild>
                <Link href="/products">Find products</Link>
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
                    {formatCurrency(product.price, product.currency)} · {product.category ?? "Uncategorized"}
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
