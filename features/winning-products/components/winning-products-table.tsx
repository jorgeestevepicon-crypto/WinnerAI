import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Package, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { WinningStatusBadge } from "@/features/winning-products/components/status-badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ProductWithWinningData, DropshippingScoreResult } from "@/features/winning-products/types";

export async function WinningProductsTable({
  items,
}: {
  items: { product: ProductWithWinningData; result: DropshippingScoreResult; latestOrders: number | null }[];
}) {
  const t = await getTranslations("winningProducts.page");

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        className="mt-4"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columnProduct")}</TableHead>
            <TableHead>{t("columnStatus")}</TableHead>
            <TableHead>{t("columnScore")}</TableHead>
            <TableHead>{t("columnPrice")}</TableHead>
            <TableHead>{t("columnMargin")}</TableHead>
            <TableHead>{t("columnOrders")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ product, result, latestOrders }) => (
            <TableRow key={product.id}>
              <TableCell>
                <Link href={`/winning-products/${product.id}`} className="flex items-center gap-2 font-medium hover:underline">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {product.title}
                </Link>
              </TableCell>
              <TableCell>
                <WinningStatusBadge status={product.winningStatus} />
              </TableCell>
              <TableCell className="font-semibold">{result.score}</TableCell>
              <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
              <TableCell>{formatPercent(product.estimatedMargin)}</TableCell>
              <TableCell>{latestOrders ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
