import { describe, expect, it } from "vitest";
import { computeAdTestMetrics } from "@/features/winning-products/server/ad-test-metrics";

describe("computeAdTestMetrics", () => {
  it("computes CTR, CPC, cost-per-add-to-cart, CPA, ROAS and net profit from raw numbers", () => {
    const metrics = computeAdTestMetrics(
      { totalSpend: 100, impressions: 10000, clicks: 200, addToCarts: 40, purchases: 10, revenue: 300 },
      { cost: 5, shippingCost: 2 }
    );

    expect(metrics.ctr).toBeCloseTo(0.02, 5);
    expect(metrics.cpc).toBeCloseTo(0.5, 5);
    expect(metrics.costPerAddToCart).toBeCloseTo(2.5, 5);
    expect(metrics.cpa).toBeCloseTo(10, 5);
    expect(metrics.roas).toBeCloseTo(3, 5);
    // revenue(300) - spend(100) - unitCost(7) * purchases(10) = 130
    expect(metrics.netProfit).toBeCloseTo(130, 5);
  });

  it("returns null instead of Infinity/NaN when a denominator is zero or missing", () => {
    const metrics = computeAdTestMetrics({ totalSpend: undefined, impressions: 0, clicks: 0, addToCarts: undefined, purchases: 0, revenue: undefined }, { cost: 5, shippingCost: 0 });

    expect(metrics.ctr).toBeNull();
    expect(metrics.cpc).toBeNull();
    expect(metrics.costPerAddToCart).toBeNull();
    expect(metrics.cpa).toBeNull();
    expect(metrics.roas).toBeNull();
  });

  it("reports a real ROAS of 0 (not null) when spend was real but revenue was genuinely zero", () => {
    const metrics = computeAdTestMetrics({ totalSpend: 100, revenue: 0 }, { cost: 5, shippingCost: 0 });
    expect(metrics.roas).toBe(0);
  });

  it("returns null net profit when revenue or spend is missing, rather than guessing", () => {
    const metrics = computeAdTestMetrics({ totalSpend: undefined, revenue: undefined }, { cost: 5, shippingCost: 0 });
    expect(metrics.netProfit).toBeNull();
  });

  it("treats a missing product cost as zero rather than throwing", () => {
    const metrics = computeAdTestMetrics({ totalSpend: 50, revenue: 200, purchases: 5 }, {});
    expect(metrics.netProfit).toBeCloseTo(150, 5);
  });
});
