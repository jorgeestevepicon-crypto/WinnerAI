import { describe, expect, it } from "vitest";
import { computeWinningScore, computeMarginScore, classifyScore, clamp } from "@/features/products/server/scoring";

describe("clamp", () => {
  it("clamps values within 0-100 by default", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(42)).toBe(42);
  });
});

describe("computeMarginScore", () => {
  it("returns 0 when price is zero or negative", () => {
    expect(computeMarginScore(10, 0)).toBe(0);
    expect(computeMarginScore(10, -5)).toBe(0);
  });

  it("scores a 70%+ margin as 100", () => {
    expect(computeMarginScore(3, 10)).toBe(100); // 70% margin exactly
    expect(computeMarginScore(1, 10)).toBe(100); // 90% margin
  });

  it("scores a 0% margin as 0", () => {
    expect(computeMarginScore(10, 10)).toBe(0);
  });

  it("scales linearly between 0 and 70% margin", () => {
    // 35% margin should land roughly at half of the 0-100 scale
    expect(computeMarginScore(6.5, 10)).toBeCloseTo(50, 0);
  });
});

describe("classifyScore", () => {
  it.each([
    [95, "Exceptional"],
    [85, "Excellent"],
    [75, "Strong"],
    [65, "Moderate"],
    [40, "Weak"],
  ] as const)("classifies %i as %s", (score, expected) => {
    expect(classifyScore(score)).toBe(expected);
  });
});

describe("computeWinningScore", () => {
  it("produces a perfect score for maximal positive signals, zero competition/saturation and a high margin", () => {
    const result = computeWinningScore(
      { demand: 100, trend: 100, competition: 0, saturation: 0, engagement: 100, growth: 100 },
      2,
      10 // 80% margin -> capped at 100
    );
    expect(result.score).toBe(100);
    expect(result.classification).toBe("Exceptional");
  });

  it("produces a low score for weak demand, high competition and high saturation", () => {
    const result = computeWinningScore(
      { demand: 10, trend: 10, competition: 100, saturation: 100, engagement: 10, growth: 10 },
      9,
      10 // 10% margin
    );
    expect(result.score).toBeLessThan(20);
    expect(result.classification).toBe("Weak");
  });

  it("clamps the final score to the 0-100 range even under extreme penalties", () => {
    const result = computeWinningScore(
      { demand: 0, trend: 0, competition: 100, saturation: 100, engagement: 0, growth: 0 },
      10,
      10
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns a full breakdown of every factor", () => {
    const result = computeWinningScore(
      { demand: 50, trend: 50, competition: 50, saturation: 50, engagement: 50, growth: 50 },
      5,
      10
    );
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        demand: 50,
        trend: 50,
        engagement: 50,
        growth: 50,
        competition: 50,
        saturation: 50,
      })
    );
    expect(result.breakdown.margin).toBeGreaterThan(0);
  });

  it("rewards a higher margin with a higher score, all else equal", () => {
    const signals = { demand: 60, trend: 60, competition: 40, saturation: 40, engagement: 60, growth: 60 };
    const lowMargin = computeWinningScore(signals, 9, 10);
    const highMargin = computeWinningScore(signals, 2, 10);
    expect(highMargin.score).toBeGreaterThan(lowMargin.score);
  });
});
