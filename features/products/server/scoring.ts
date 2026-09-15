import type { RawProductSignals } from "@/features/products/types";

export interface WinningScoreBreakdown {
  demand: number;
  trend: number;
  engagement: number;
  growth: number;
  margin: number;
  competition: number;
  saturation: number;
}

export interface WinningScoreResult {
  score: number;
  breakdown: WinningScoreBreakdown;
  classification: "Exceptional" | "Excellent" | "Strong" | "Moderate" | "Weak";
}

// Positive factor weights sum to 1, so the positive composite itself stays
// within 0-100 before competition/saturation penalties are subtracted.
const WEIGHTS = {
  demand: 0.25,
  trend: 0.2,
  engagement: 0.15,
  growth: 0.15,
  margin: 0.25,
} as const;

// Penalty factors: a fully competitive market (100) subtracts up to 50
// points, a fully saturated one (100) subtracts up to 30.
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
 */
export function computeWinningScore(signals: RawProductSignals, cost: number, price: number): WinningScoreResult {
  const demand = clamp(signals.demand);
  const trend = clamp(signals.trend);
  const engagement = clamp(signals.engagement);
  const growth = clamp(signals.growth);
  const competition = clamp(signals.competition);
  const saturation = clamp(signals.saturation);
  const margin = Math.round(computeMarginScore(cost, price));

  const positiveComposite =
    demand * WEIGHTS.demand +
    trend * WEIGHTS.trend +
    engagement * WEIGHTS.engagement +
    growth * WEIGHTS.growth +
    margin * WEIGHTS.margin;

  const competitionPenalty = competition * PENALTIES.competition;
  const saturationPenalty = saturation * PENALTIES.saturation;

  const score = clamp(Math.round(positiveComposite - competitionPenalty - saturationPenalty));

  return {
    score,
    breakdown: { demand, trend, engagement, growth, margin, competition, saturation },
    classification: classifyScore(score),
  };
}
