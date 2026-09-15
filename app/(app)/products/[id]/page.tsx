import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getProductById } from "@/features/products/server/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SaveButton } from "@/features/products/components/save-button";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const product = await getProductById(params.id);

  if (!product || product.userId !== user.id) notFound();

  const factors: { label: string; value: number | null; invert?: boolean }[] = [
    { label: "Demand", value: product.demandScore },
    { label: "Trend", value: product.trendScore },
    { label: "Engagement", value: product.engagementScore },
    { label: "Growth", value: product.growthScore },
    { label: "Margin", value: product.estimatedMargin ? Math.min(100, product.estimatedMargin) : null },
    { label: "Competition", value: product.competitionScore, invert: true },
    { label: "Saturation", value: product.saturationScore, invert: true },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4" /> Back to Product Finder
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl font-semibold">{product.title}</h1>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}/analysis`}>
                        <Sparkles className="h-4 w-4" /> Analyze
                      </Link>
                    </Button>
                    <SaveButton productId={product.id} saved={product.saved} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <div className="flex flex-wrap gap-3 pt-2 text-sm">
                  <span className="font-medium">{formatCurrency(product.price, product.currency)}</span>
                  <span className="text-muted-foreground">Cost {formatCurrency(product.cost, product.currency)}</span>
                  <span className="text-muted-foreground">Margin {formatPercent(product.estimatedMargin)}</span>
                  {product.country && <span className="text-muted-foreground">{product.country}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {factors.map((factor) => (
                <div key={factor.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{factor.label}</span>
                    <span className="text-muted-foreground">{factor.value !== null ? Math.round(factor.value) : "—"}</span>
                  </div>
                  <Progress value={factor.value ?? 0} />
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Winning Score is an estimate based on available signals. It is not a guarantee of sales or profit.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Winning Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 py-4">
                <span className="text-5xl font-bold">{product.winningScore !== null ? Math.round(product.winningScore) : "—"}</span>
                <WinningScoreBadge score={product.winningScore} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Source: {product.source === "DEMO" ? "Demo catalog" : product.source}</p>
              {product.supplierUrl && <p>Supplier: {product.supplierUrl}</p>}
              <p>Category: {product.category ?? "Uncategorized"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
