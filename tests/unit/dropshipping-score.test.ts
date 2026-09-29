import { describe, expect, it } from "vitest";
import type { Product, ProductManualSignal, ProductSnapshot, WinningScoreConfig } from "@prisma/client";
import { computeDropshippingScore, computeOrderGrowth, clamp } from "@/features/winning-products/server/scoring";

const baseConfig: WinningScoreConfig = {
  id: "config-1",
  userId: "user-1",
  weightMargin: 0.2,
  weightPriceRangeFit: 0.1,
  weightDemand: 0.15,
  weightDemandGrowth: 0.1,
  weightProviderQuality: 0.1,
  weightLogistics: 0.1,
  weightWowEffect: 0.1,
  weightPhysicalStores: 0.05,
  weightCompetitionLevel: 0.05,
  weightGoogleTrends: 0.05,
  marginTargetMultiplier: 3,
  idealPriceMin: 20,
  idealPriceMax: 60,
  priceCurrency: "EUR",
  targetCountry: "ES",
  maxIdealWeightGrams: 1000,
  minRoasForWinner: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function snapshot(overrides: Partial<ProductSnapshot>): ProductSnapshot {
  return {
    id: "snap",
    productId: "product-1",
    price: null,
    cost: null,
    orders: null,
    rating: null,
    capturedAt: new Date(),
    ...overrides,
  };
}

type ProductInput = Pick<Product, "cost" | "shippingCost" | "price" | "demandScore" | "storeRating" | "reviewCount" | "weightGrams" | "shippingDays">;

const baseProduct: ProductInput = {
  cost: 10,
  shippingCost: 0,
  price: 40,
  demandScore: null,
  storeRating: null,
  reviewCount: null,
  weightGrams: null,
  shippingDays: null,
};

describe("computeOrderGrowth", () => {
  it("returns undefined with fewer than two order data points", () => {
    expect(computeOrderGrowth([snapshot({ orders: 10 })])).toBeUndefined();
    expect(computeOrderGrowth([])).toBeUndefined();
  });

  it("computes clamped percent growth between the two most recent snapshots", () => {
    const snapshots = [
      snapshot({ orders: 100, capturedAt: new Date("2024-01-01") }),
      snapshot({ orders: 150, capturedAt: new Date("2024-01-10") }),
    ];
    expect(computeOrderGrowth(snapshots)).toBe(50);
  });

  it("clamps growth at 100 and floors at 0 for a decline", () => {
    const growing = [snapshot({ orders: 10, capturedAt: new Date("2024-01-01") }), snapshot({ orders: 100, capturedAt: new Date("2024-01-10") })];
    expect(computeOrderGrowth(growing)).toBe(100);

    const declining = [snapshot({ orders: 100, capturedAt: new Date("2024-01-01") }), snapshot({ orders: 50, capturedAt: new Date("2024-01-10") })];
    expect(computeOrderGrowth(declining)).toBe(0);
  });
});

describe("clamp", () => {
  it("clamps to 0-100 by default", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-20)).toBe(0);
  });
});

describe("computeDropshippingScore", () => {
  it("only includes margin and price-range-fit when nothing else is available, and marks the result partial", () => {
    const result = computeDropshippingScore(baseProduct, baseConfig, null, []);

    expect(result.breakdown.margin).toBeDefined();
    expect(result.breakdown.priceRangeFit).toBe(100); // price 40 is within [20, 60]
    expect(result.breakdown.demand).toBeUndefined();
    expect(result.breakdown.demandGrowth).toBeUndefined();
    expect(result.breakdown.providerQuality).toBeUndefined();
    expect(result.breakdown.logistics).toBeUndefined();
    expect(result.partial).toBe(true);
    expect(result.missingFactors.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores margin at 100 when the actual multiplier meets or exceeds the target", () => {
    const result = computeDropshippingScore({ ...baseProduct, cost: 10, price: 30 }, baseConfig, null, []);
    expect(result.breakdown.margin).toBe(100); // 30 / 10 = 3x target multiplier exactly
  });

  it("uses the real demandScore already on the product, never recomputing it", () => {
    const result = computeDropshippingScore({ ...baseProduct, demandScore: 72 }, baseConfig, null, []);
    expect(result.breakdown.demand).toBe(72);
  });

  it("includes demand growth once two snapshots with real order counts exist", () => {
    const snapshots = [
      snapshot({ orders: 50, capturedAt: new Date("2024-01-01") }),
      snapshot({ orders: 100, capturedAt: new Date("2024-02-01") }),
    ];
    const result = computeDropshippingScore(baseProduct, baseConfig, null, snapshots);
    expect(result.breakdown.demandGrowth).toBe(100);
  });

  it("maps manual signals to their configured direction (low competition scores high, found-in-stores scores low)", () => {
    const manual: ProductManualSignal = {
      id: "signal-1",
      productId: "product-1",
      wowEffect: 5,
      foundInPhysicalStores: true,
      competitionLevel: "LOW",
      googleTrendsManual: "RISING",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = computeDropshippingScore(baseProduct, baseConfig, manual, []);

    expect(result.breakdown.wowEffect).toBe(100);
    expect(result.breakdown.physicalStores).toBe(30); // found in stores hurts the "impulse buy" pitch
    expect(result.breakdown.competitionLevel).toBe(100);
    expect(result.breakdown.googleTrends).toBe(100);
  });

  it("never produces a score outside 0-100 even with every factor available and maxed out", () => {
    const manual: ProductManualSignal = {
      id: "signal-1",
      productId: "product-1",
      wowEffect: 5,
      foundInPhysicalStores: false,
      competitionLevel: "LOW",
      googleTrendsManual: "RISING",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const snapshots = [
      snapshot({ orders: 10, rating: 95, capturedAt: new Date("2024-01-01") }),
      snapshot({ orders: 1000, rating: 98, capturedAt: new Date("2024-02-01") }),
    ];
    const product: ProductInput = { cost: 5, shippingCost: 0, price: 30, demandScore: 100, storeRating: 100, reviewCount: 5000, weightGrams: 50, shippingDays: 2 };
    const result = computeDropshippingScore(product, baseConfig, manual, snapshots);

    expect(result.partial).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
