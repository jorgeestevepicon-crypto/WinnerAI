/**
 * Suggests a starting retail price from a real sourcing cost — a starting
 * point the user is expected to adjust, never a claim about real-world
 * pricing data.
 *
 * Cheaper items get a higher relative markup, mirroring common dropshipping
 * practice (the absolute profit per unit still needs to clear ad-spend
 * breakeven, so a $4 item needs a steeper multiple than a $30 one). This
 * also matters for scoring: if every product were priced at a single fixed
 * multiplier of its cost (the previous behavior), every product's margin
 * score would be identical by construction — price/cost ratio is scale
 * invariant, so a flat multiplier can never produce real variation to rank
 * products by. A tiered multiplier, driven by the product's real cost,
 * does.
 */
export function suggestRetailPrice(cost: number): number {
  const multiplier = cost < 5 ? 5 : cost < 15 ? 3.5 : cost < 30 ? 2.5 : 2;
  return Math.floor(cost * multiplier) + 0.99;
}
