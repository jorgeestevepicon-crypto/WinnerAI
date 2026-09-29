import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getWinningProductById } from "@/features/winning-products/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { WinningStatusBadge } from "@/features/winning-products/components/status-badge";
import { StatusControl } from "@/features/winning-products/components/status-control";
import { ScoreBreakdown } from "@/features/winning-products/components/score-breakdown";
import { ManualSignalForm } from "@/features/winning-products/components/manual-signal-form";
import { AdTestTable } from "@/features/winning-products/components/ad-test-table";
import { AdTestDialog } from "@/features/winning-products/components/ad-test-dialog";
import { ChecklistCard } from "@/features/winning-products/components/checklist-card";
import { RefreshDetailButton } from "@/features/winning-products/components/refresh-detail-button";

const ORIGIN_KEYS: Record<string, string> = {
  TIKTOK: "origins.tiktok",
  INSTAGRAM: "origins.instagram",
  META_ADS: "origins.metaAds",
  OTHER: "origins.other",
};

export default async function WinningProductDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const data = await getWinningProductById(params.id, user.id);
  if (!data) notFound();

  const { product, result } = data;
  const t = await getTranslations("winningProducts.detail");
  const tOrigin = await getTranslations("winningProducts.addManualDialog");
  const tScore = await getTranslations("winningProducts.scoreBreakdown");
  const tManual = await getTranslations("winningProducts.manualSignalForm");
  const tAdTest = await getTranslations("winningProducts.adTest");
  const tChecklist = await getTranslations("winningProducts.checklist");

  return (
    <div className="space-y-6">
      <Link href="/winning-products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backLink")}
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {product.images[0] ? (
              <Image src={product.images[0]} alt="" fill className="object-cover" unoptimized />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-semibold">{product.title}</h1>
              <div className="flex items-center gap-2">
                <WinningStatusBadge status={product.winningStatus} />
                <StatusControl productId={product.id} status={product.winningStatus} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium">{formatCurrency(product.price, product.currency)}</span>
              <span className="text-muted-foreground">{t("cost", { amount: formatCurrency(product.cost, product.currency) })}</span>
              <span className="text-muted-foreground">{t("margin", { percent: formatPercent(product.estimatedMargin) })}</span>
              {product.discoveryOrigin && (
                <span className="text-muted-foreground">
                  {t("spottedOn", { origin: tOrigin(ORIGIN_KEYS[product.discoveryOrigin] ?? "origins.other") })}
                  {product.discoveryUrl ? (
                    <>
                      {" "}
                      (
                      <a href={product.discoveryUrl} target="_blank" rel="noreferrer" className="underline">
                        {t("link")}
                      </a>
                      )
                    </>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {product.sourceUrl && (
                <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  {t("viewOnAliExpress")}
                </a>
              )}
              <RefreshDetailButton productId={product.id} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>{tScore("title")}</span>
              <span className="text-2xl font-semibold">{result.score}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown result={result} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tManual("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualSignalForm productId={product.id} signal={product.manualSignal} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{tAdTest("sectionTitle")}</CardTitle>
          <AdTestDialog productId={product.id} currency={product.currency} />
        </CardHeader>
        <CardContent>
          <AdTestTable tests={product.adTests} productCost={{ cost: product.cost, shippingCost: product.shippingCost }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tChecklist("sectionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistCard productId={product.id} checklist={product.supplierChecklist} />
        </CardContent>
      </Card>
    </div>
  );
}
