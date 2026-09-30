import { CheckCircle2, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { searchProducts, getProductCategories, getProductCountries } from "@/features/products/server/queries";
import { productFilterSchema } from "@/features/products/schemas";
import { ProductFilters } from "@/features/products/components/product-filters";
import { ProductResults } from "@/features/products/components/product-results";
import { DiscoverButton } from "@/features/products/components/discover-button";
import { productSourceAdapters } from "@/features/products/server/adapters";
import { getAliExpressConnectionStatus } from "@/features/aliexpress/server/actions";
import { getValidAccessToken } from "@/lib/aliexpress/connection";
import { getCachedAliExpressCategories } from "@/features/products/server/aliexpress-categories";

export const metadata = { title: "Product Finder" };

const ALIEXPRESS_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "AliExpress isn't configured in this environment.",
  invalid_request: "The request from AliExpress was missing required parameters.",
  invalid_state: "This connection attempt expired or could not be verified. Please try again.",
  connection_failed: "AliExpress connection failed while exchanging the authorization code.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();

  const flat = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filters = productFilterSchema.parse(flat);
  const aliexpressConnected = flat.aliexpress_connected;
  const aliexpressError = flat.aliexpress_error;

  const [products, categories, countries, isAliExpressConnected] = await Promise.all([
    searchProducts(filters, user.id),
    getProductCategories(user.id),
    getProductCountries(user.id),
    getAliExpressConnectionStatus(),
  ]);

  // AliExpress's own real category tree, when available, replaces the
  // curated fallback list for this source — fetched only when connected,
  // and never blocks the page if the (unverified-until-tested)
  // aliexpress.ds.category.get endpoint errors or is slow.
  const aliexpressCategoryNames = isAliExpressConnected
    ? await (async () => {
        const token = await getValidAccessToken(user.id);
        if (!token) return [];
        const categories = await getCachedAliExpressCategories(token);
        return categories.map((c) => c.name);
      })()
    : [];

  const sources = productSourceAdapters.map((a) => ({
    id: a.id,
    label: a.label,
    configured: a.configured,
    disabledReason: a.disabledReason,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Finder</h1>
          <p className="text-sm text-muted-foreground">Discover and score potentially winning products.</p>
        </div>
        <DiscoverButton sources={sources} aliexpressConnected={isAliExpressConnected} aliexpressCategories={aliexpressCategoryNames} />
      </div>

      {aliexpressConnected && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> AliExpress connected successfully.
        </div>
      )}
      {aliexpressError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {ALIEXPRESS_ERROR_MESSAGES[aliexpressError] ?? "Something went wrong connecting AliExpress."}
        </div>
      )}

      <ProductFilters
        categories={categories}
        countries={countries}
        sources={sources}
        aliexpressConnected={isAliExpressConnected}
        aliexpressCategories={aliexpressCategoryNames}
      />

      <ProductResults products={products} />
    </div>
  );
}
