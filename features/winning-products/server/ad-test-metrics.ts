import type { AdTestMetrics } from "@/features/winning-products/types";

export interface AdTestRawMetrics {
  totalSpend?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  addToCarts?: number | null;
  purchases?: number | null;
  revenue?: number | null;
}

export interface ProductCostInputs {
  cost?: number | null;
  shippingCost?: number | null;
}

function divide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator === null || numerator === undefined) return null;
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

/**
 * CTR/CPC/cost-per-add-to-cart/CPA/ROAS/net profit from a manually-entered
 * ad test, computed here rather than stored so editing a raw field can never
 * leave a stale derived number behind. Every ratio is protected against a
 * zero or missing denominator (returns null, never Infinity/NaN) — an
 * incomplete test just shows fewer metrics rather than a broken one.
 */
export function computeAdTestMetrics(test: AdTestRawMetrics, product: ProductCostInputs): AdTestMetrics {
  const ctr = divide(test.clicks, test.impressions);
  const cpc = divide(test.totalSpend, test.clicks);
  const costPerAddToCart = divide(test.totalSpend, test.addToCarts);
  const cpa = divide(test.totalSpend, test.purchases);
  const roas = divide(test.revenue, test.totalSpend);

  let netProfit: number | null = null;
  if (test.revenue !== null && test.revenue !== undefined && test.totalSpend !== null && test.totalSpend !== undefined) {
    const unitCost = (product.cost ?? 0) + (product.shippingCost ?? 0);
    const purchases = test.purchases ?? 0;
    netProfit = test.revenue - test.totalSpend - unitCost * purchases;
  }

  return { ctr, cpc, costPerAddToCart, cpa, roas, netProfit };
}
