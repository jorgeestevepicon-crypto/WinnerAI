import type { RawProductSignals } from "@/features/products/types";

export interface WinningScoreBreakdown {
  demand?: number;
  trend?: number;
  engagement?: number;
  growth?: number;
  margin: number;
  competition?: number;
  saturation?: number;
}

export interface WinningScoreResult {
  score: number;
  breakdown: WinningScoreBreakdown;
  classification: "Exceptional" | "Excellent" | "Strong" | "Moderate" | "Weak";
  /**
   * True when one or more of the six signals weren't available from the
   * source (e.g. AliExpress's API only exposes real order-volume data, not
   * trend/competition/saturation/engagement/growth). The score is then a
   * weighted estimate over just the signals that exist, rather than a
   * fabricated guess at the missing ones.
   */
  partial: boolean;
}

// Positive factor weights sum to 1, so the positive composite itself stays
// within 0-100 before competition/saturation penalties are subtracted. When
// a factor is missing, its weight is redistributed proportionally among the
// factors that are actually available (see POSITIVE_FACTORS below).
const WEIGHTS = {
  demand: 0.25,
  trend: 0.2,
  engagement: 0.15,
  growth: 0.15,
  margin: 0.25,
} as const;

const POSITIVE_FACTORS = ["demand", "trend", "engagement", "growth", "margin"] as const;

// Penalty factors: a fully competitive market (100) subtracts up to 50
// points, a fully saturated one (100) subtracts up to 30. Missing penalty
// signals simply apply no penalty, rather than assuming the worst or best.
const PENALTIES = {
  competition: 0.5,
  saturation: 0.3,
} as const;

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/** Converts a raw margin percentage into a 0-100 score. 70%+ margin scores 100. */
export function computeMarginScore(cost: number, price: number): number {
  if (price <= 0) return 0;
  const marginPercent = ((price - cost) / price) * 100;
  return clamp((marginPercent / 70) * 100);
}

export function classifyScore(score: number): WinningScoreResult["classification"] {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 60) return "Moderate";
  return "Weak";
}

/**
 * WinnerAI's Winning Score engine.
 *
 * Winning Score = Demand + Trend + Engagement + Growth + Margin - Competition - Saturation,
 * with each factor normalized to 0-100. This is an estimation aid based on
 * available signals, never a sales guarantee.
 *
 * Not every source provides every signal (AliExpress's API, for instance,
 * only gives us real order-volume data, nothing for trend/competition/
 * saturation/engagement/growth). Rather than inventing a number for a
 * signal we don't have, missing positive factors are left out and the
 * remaining weights are redistributed proportionally; missing penalty
 * factors simply apply no penalty. `margin` is always available since it's
 * derived from cost/price, not an external signal.
 */
export function computeWinningScore(signals: RawProductSignals, cost: number, price: number): WinningScoreResult {
  const margin = Math.round(computeMarginScore(cost, price));
  const rawPositives = { demand: signals.demand, trend: signals.trend, engagement: signals.engagement, growth: signals.growth, margin };

  const availablePositives = POSITIVE_FACTORS.filter((key) => rawPositives[key] !== undefined);
  const availableWeight = availablePositives.reduce((sum, key) => sum + WEIGHTS[key], 0);

  const positiveComposite = availablePositives.reduce((sum, key) => {
    const value = clamp(rawPositives[key]!);
    return sum + value * (WEIGHTS[key] / availableWeight);
  }, 0);

  let penalty = 0;
  if (signals.competition !== undefined) penalty += clamp(signals.competition) * PENALTIES.competition;
  if (signals.saturation !== undefined) penalty += clamp(signals.saturation) * PENALTIES.saturation;

  const score = clamp(Math.round(positiveComposite - penalty));

  const breakdown: WinningScoreBreakdown = { margin };
  if (signals.demand !== undefined) breakdown.demand = clamp(signals.demand);
  if (signals.trend !== undefined) breakdown.trend = clamp(signals.trend);
  if (signals.engagement !== undefined) breakdown.engagement = clamp(signals.engagement);
  if (signals.growth !== undefined) breakdown.growth = clamp(signals.growth);
  if (signals.competition !== undefined) breakdown.competition = clamp(signals.competition);
  if (signals.saturation !== undefined) breakdown.saturation = clamp(signals.saturation);

  const partial = ["demand", "trend", "engagement", "growth", "competition", "saturation"].some(
    (key) => signals[key as keyof RawProductSignals] === undefined
  );

  return { score, breakdown, classification: classifyScore(score), partial };
}
