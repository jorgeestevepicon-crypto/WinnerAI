import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Settings } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { listWinningProducts } from "@/features/winning-products/server/queries";
import { winningProductFilterSchema } from "@/features/winning-products/schemas";
import { WinningProductsFilters } from "@/features/winning-products/components/winning-products-filters";
import { WinningProductsTable } from "@/features/winning-products/components/winning-products-table";
import { DiscoverCandidatesButton } from "@/features/winning-products/components/discover-candidates-button";
import { AddManualProductDialog } from "@/features/winning-products/components/add-manual-product-dialog";
import { getAliExpressConnectionStatus } from "@/features/aliexpress/server/actions";

export const metadata = { title: "Winning Products" };

export default async function WinningProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const t = await getTranslations("winningProducts.page");
  const tConfig = await getTranslations("winningProducts.config");

  const flat = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filters = winningProductFilterSchema.parse(flat);

  const [{ items }, isAliExpressConnected] = await Promise.all([
    listWinningProducts(user.id, filters),
    getAliExpressConnectionStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="icon" asChild title={tConfig("settingsLinkTitle")}>
            <Link href="/winning-products/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <AddManualProductDialog aliexpressConnected={isAliExpressConnected} />
          <DiscoverCandidatesButton aliexpressConnected={isAliExpressConnected} />
        </div>
      </div>

      <WinningProductsFilters />

      <WinningProductsTable items={items} />
    </div>
  );
}
