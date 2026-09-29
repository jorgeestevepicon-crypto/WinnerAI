import type { Product, ProductManualSignal, ProductSnapshot, WinningScoreConfig } from "@prisma/client";
import type { DropshippingScoreBreakdown, DropshippingScoreResult } from "@/features/winning-products/types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/** % change in orders between the two most recent snapshots, clamped 0-100 (flat/declining scores 0, a doubling scores 100) — same convention as the Google Trends growth signal. Needs at least two snapshots with a real order count; returns undefined otherwise (never a fabricated guess). */
export function computeOrderGrowth(snapshots: ProductSnapshot[]): number | undefined {
  const withOrders = snapshots.filter((s) => s.orders !== null && s.orders !== undefined).sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  if (withOrders.length < 2) return undefined;

  const previous = withOrders[withOrders.length - 2].orders!;
  const latest = withOrders[withOrders.length - 1].orders!;
  if (previous <= 0) return latest > 0 ? 100 : 0;

  const percentChange = ((latest - previous) / previous) * 100;
  return Math.round(clamp(percentChange));
}

function scoreMargin(product: Pick<Product, "cost" | "shippingCost" | "price">, config: WinningScoreConfig): number | undefined {
  if (!product.cost || !product.price || product.price <= 0) return undefined;
  const totalCost = product.cost + (product.shippingCost ?? 0);
  if (totalCost <= 0) return undefined;
  const actualMultiplier = product.price / totalCost;
  return Math.round(clamp((actualMultiplier / config.marginTargetMultiplier) * 100));
}

/** 100 inside [idealPriceMin, idealPriceMax], decaying linearly to 0 the further outside it the price is. */
function scorePriceRangeFit(product: Pick<Product, "price">, config: WinningScoreConfig): number | undefined {
  if (!product.price) return undefined;
  const { price } = product;
  const { idealPriceMin: min, idealPriceMax: max } = config;
  if (price >= min && price <= max) return 100;
  if (price < min) return Math.round(clamp(100 - ((min - price) / min) * 100));
  return Math.round(clamp(100 - ((price - max) / max) * 100));
}

/** Average of whichever real quality signals are available (buyer rating from the latest snapshot, store rating, review count) — never fabricates the ones that aren't. */
function scoreProviderQuality(snapshots: ProductSnapshot[], product: Pick<Product, "storeRating" | "reviewCount">): number | undefined {
  const latestRating = [...snapshots].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime()).find((s) => s.rating !== null && s.rating !== undefined)?.rating;

  const parts: number[] = [];
  if (latestRating !== undefined && latestRating !== null) parts.push(clamp(latestRating));
  if (product.storeRating !== null && product.storeRating !== undefined) parts.push(clamp(product.storeRating));
  if (product.reviewCount !== null && product.reviewCount !== undefined) {
    parts.push(Math.round(clamp((Math.log10(product.reviewCount + 1) / Math.log10(1000)) * 100)));
  }
  if (parts.length === 0) return undefined;
  return Math.round(parts.reduce((sum, v) => sum + v, 0) / parts.length);
}

/** Average of whichever real logistics signals are available (lighter, faster, cheaper-to-ship scores higher) — never fabricates the ones that aren't confirmed for this account yet. */
function scoreLogistics(product: Pick<Product, "weightGrams" | "shippingDays" | "shippingCost" | "price">, config: WinningScoreConfig): number | undefined {
  const parts: number[] = [];
  if (product.weightGrams !== null && product.weightGrams !== undefined) {
    parts.push(clamp(100 - (product.weightGrams / config.maxIdealWeightGrams) * 100));
  }
  if (product.shippingDays !== null && product.shippingDays !== undefined) {
    parts.push(clamp(100 - (product.shippingDays - 3) * 10));
  }
  // > 0, not just non-null: features/products/server/normalize.ts defaults
  // every product's shippingCost to 0 when a source doesn't supply a real
  // one, so a stored 0 can't be trusted as "confirmed free shipping" — only
  // a genuinely positive value means someone actually knows this number.
  if (product.shippingCost && product.shippingCost > 0 && product.price) {
    parts.push(clamp(100 - (product.shippingCost / product.price) * 200));
  }
  if (parts.length === 0) return undefined;
  return Math.round(parts.reduce((sum, v) => sum + v, 0) / parts.length);
}

function scoreWowEffect(manual: ProductManualSignal | null): number | undefined {
  if (!manual?.wowEffect) return undefined;
  return Math.round((manual.wowEffect / 5) * 100);
}

// Being findable in ordinary physical stores works against a dropshipping
// "impulse buy, can't get this locally" pitch — so "yes" scores low, "no"
// (or not yet checked) is neutral-to-good rather than penalized for missing data.
function scorePhysicalStores(manual: ProductManualSignal | null): number | undefined {
  if (manual?.foundInPhysicalStores === undefined || manual?.foundInPhysicalStores === null) return undefined;
  return manual.foundInPhysicalStores ? 30 : 100;
}

const COMPETITION_SCORES = { LOW: 100, MEDIUM: 50, HIGH: 0 } as const;
function scoreCompetitionLevel(manual: ProductManualSignal | null): number | undefined {
  if (!manual?.competitionLevel) return undefined;
  return COMPETITION_SCORES[manual.competitionLevel];
}

const TREND_SCORES = { RISING: 100, STABLE: 50, FALLING: 0 } as const;
function scoreGoogleTrends(manual: ProductManualSignal | null): number | undefined {
  if (!manual?.googleTrendsManual) return undefined;
  return TREND_SCORES[manual.googleTrendsManual];
}

const FACTOR_LABELS: Record<keyof DropshippingScoreBreakdown, string> = {
  margin: "Margin",
  priceRangeFit: "Ideal price range",
  demand: "Demand",
  demandGrowth: "Demand growth",
  providerQuality: "Provider quality",
  logistics: "Logistics",
  wowEffect: "Wow effect",
  physicalStores: "Physical store availability",
  competitionLevel: "Competition level",
  googleTrends: "Google Trends",
};

type WeightKey =
  | "weightMargin"
  | "weightPriceRangeFit"
  | "weightDemand"
  | "weightDemandGrowth"
  | "weightProviderQuality"
  | "weightLogistics"
  | "weightWowEffect"
  | "weightPhysicalStores"
  | "weightCompetitionLevel"
  | "weightGoogleTrends";

const WEIGHT_KEYS: Record<keyof DropshippingScoreBreakdown, WeightKey> = {
  margin: "weightMargin",
  priceRangeFit: "weightPriceRangeFit",
  demand: "weightDemand",
  demandGrowth: "weightDemandGrowth",
  providerQuality: "weightProviderQuality",
  logistics: "weightLogistics",
  wowEffect: "weightWowEffect",
  physicalStores: "weightPhysicalStores",
  competitionLevel: "weightCompetitionLevel",
  googleTrends: "weightGoogleTrends",
};

/**
 * WinnerAI's dropshipping validation score — separate from the generic
 * multi-source Winning Score in features/products/server/scoring.ts, whose
 * factors (demand/trend/margin/…) serve every product source, not just this
 * validation workflow's own criteria (ideal price range, provider quality
 * from real ratings, logistics, and the user's manual signals).
 *
 * Every factor is computed only from real data (AliExpress fields, real
 * snapshots, or the user's own manual entries) — a factor with no data
 * available is left out of the composite entirely and its configured
 * weight is redistributed proportionally among the factors that are
 * available, exactly like the generic Winning Score engine.
 */
export function computeDropshippingScore(
  product: Pick<Product, "cost" | "shippingCost" | "price" | "demandScore" | "storeRating" | "reviewCount" | "weightGrams" | "shippingDays">,
  config: WinningScoreConfig,
  manualSignal: ProductManualSignal | null,
  snapshots: ProductSnapshot[]
): DropshippingScoreResult {
  const raw: DropshippingScoreBreakdown = {
    margin: scoreMargin(product, config),
    priceRangeFit: scorePriceRangeFit(product, config),
    demand: product.demandScore !== null && product.demandScore !== undefined ? clamp(product.demandScore) : undefined,
    demandGrowth: computeOrderGrowth(snapshots),
    providerQuality: scoreProviderQuality(snapshots, product),
    logistics: scoreLogistics(product, config),
    wowEffect: scoreWowEffect(manualSignal),
    physicalStores: scorePhysicalStores(manualSignal),
    competitionLevel: scoreCompetitionLevel(manualSignal),
    googleTrends: scoreGoogleTrends(manualSignal),
  };

  const factorKeys = Object.keys(raw) as (keyof DropshippingScoreBreakdown)[];
  const availableKeys = factorKeys.filter((key) => raw[key] !== undefined);
  const availableWeight = availableKeys.reduce((sum, key) => sum + config[WEIGHT_KEYS[key]], 0);

  const score =
    availableWeight > 0
      ? Math.round(availableKeys.reduce((sum, key) => sum + raw[key]! * (config[WEIGHT_KEYS[key]] / availableWeight), 0))
      : 0;

  const missingFactors = factorKeys.filter((key) => raw[key] === undefined).map((key) => FACTOR_LABELS[key]);

  return {
    score: clamp(score),
    breakdown: raw,
    missingFactors,
    partial: missingFactors.length > 0,
  };
}
