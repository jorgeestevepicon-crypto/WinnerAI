import { requireUser } from "@/lib/auth/session";
import { searchProducts, getProductCategories, getProductCountries } from "@/features/products/server/queries";
import { productFilterSchema } from "@/features/products/schemas";
import { ProductFilters } from "@/features/products/components/product-filters";
import { ProductResults } from "@/features/products/components/product-results";
import { DiscoverButton } from "@/features/products/components/discover-button";

export const metadata = { title: "Product Finder" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();

  const flat = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filters = productFilterSchema.parse(flat);

  const [products, categories, countries] = await Promise.all([
    searchProducts(filters, user.id),
    getProductCategories(user.id),
    getProductCountries(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Finder</h1>
          <p className="text-sm text-muted-foreground">Discover and score potentially winning products.</p>
        </div>
        <DiscoverButton />
      </div>

      <ProductFilters categories={categories} countries={countries} />

      <ProductResults products={products} />
    </div>
  );
}
