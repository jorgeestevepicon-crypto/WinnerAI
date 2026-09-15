import { getAdminProducts } from "@/features/admin/server/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductActions } from "@/features/admin/components/product-actions";
import { formatCurrency } from "@/lib/utils";
import { WinningScoreBadge } from "@/components/shared/winning-score-badge";

export const metadata = { title: "Admin · Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const products = await getAdminProducts(searchParams.q);

  return (
    <div className="space-y-4">
      <form>
        <Input name="q" defaultValue={searchParams.q} placeholder="Search products..." className="max-w-sm" />
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.title}</TableCell>
                <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                <TableCell>
                  <WinningScoreBadge score={product.winningScore} />
                </TableCell>
                <TableCell className="space-x-1">
                  {product.featured && <Badge>Featured</Badge>}
                  {product.deletedAt && <Badge variant="destructive">Hidden</Badge>}
                </TableCell>
                <TableCell>
                  <ProductActions productId={product.id} featured={product.featured} hidden={!!product.deletedAt} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
