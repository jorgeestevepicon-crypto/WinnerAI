import { describe, expect, it } from "vitest";
import { suggestRetailPrice } from "@/features/products/server/pricing";

describe("suggestRetailPrice", () => {
  it("uses a higher multiplier for cheaper costs than for pricier ones", () => {
    const cheap = suggestRetailPrice(4);
    const mid = suggestRetailPrice(10);
    const pricier = suggestRetailPrice(20);
    const expensive = suggestRetailPrice(40);

    expect(cheap / 4).toBeGreaterThan(mid / 10);
    expect(mid / 10).toBeGreaterThan(pricier / 20);
    expect(pricier / 20).toBeGreaterThan(expensive / 40);
  });

  it("never returns a price lower than the cost", () => {
    expect(suggestRetailPrice(1)).toBeGreaterThan(1);
    expect(suggestRetailPrice(100)).toBeGreaterThan(100);
  });

  it("ends in .99 for a psychological price point", () => {
    expect(suggestRetailPrice(10) % 1).toBeCloseTo(0.99, 5);
  });
});
