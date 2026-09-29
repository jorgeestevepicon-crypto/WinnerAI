"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductAdTest } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { computeAdTestMetrics } from "@/features/winning-products/server/ad-test-metrics";
import { deleteAdTest } from "@/features/winning-products/server/actions";
import { formatCurrency } from "@/lib/utils";

function pct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}
function money(value: number | null, currency: string) {
  return value === null ? "—" : formatCurrency(value, currency);
}
function multiple(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)}x`;
}

export function AdTestTable({
  tests,
  productCost,
}: {
  tests: ProductAdTest[];
  productCost: { cost: number | null; shippingCost: number | null };
}) {
  const router = useRouter();

  if (tests.length === 0) {
    return <p className="text-sm text-muted-foreground">No ad tests yet. Add one to start validating this product with real numbers.</p>;
  }

  async function handleDelete(id: string) {
    const result = await deleteAdTest(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>CTR</TableHead>
            <TableHead>CPC</TableHead>
            <TableHead>Cost/ATC</TableHead>
            <TableHead>CPA</TableHead>
            <TableHead>ROAS</TableHead>
            <TableHead>Net profit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => {
            const metrics = computeAdTestMetrics(test, productCost);
            return (
              <TableRow key={test.id}>
                <TableCell>
                  <div className="font-medium">{test.name || test.platform || "Test"}</div>
                  {test.platform && test.name && <div className="text-xs text-muted-foreground">{test.platform}</div>}
                </TableCell>
                <TableCell>{money(test.totalSpend, test.currency)}</TableCell>
                <TableCell>{pct(metrics.ctr)}</TableCell>
                <TableCell>{money(metrics.cpc, test.currency)}</TableCell>
                <TableCell>{money(metrics.costPerAddToCart, test.currency)}</TableCell>
                <TableCell>{money(metrics.cpa, test.currency)}</TableCell>
                <TableCell>{multiple(metrics.roas)}</TableCell>
                <TableCell className={metrics.netProfit !== null && metrics.netProfit < 0 ? "text-destructive" : ""}>
                  {money(metrics.netProfit, test.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(test.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
