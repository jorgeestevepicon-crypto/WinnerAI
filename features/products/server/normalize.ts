import type { Prisma, ProductSource } from "@prisma/client";
import type { NormalizedProductInput, ProductSourceId } from "@/features/products/types";
import { computeWinningScore } from "@/features/products/server/scoring";

export const SOURCE_MAP: Record<ProductSourceId, ProductSource> = {
  demo: "DEMO",
  aliexpress: "ALIEXPRESS",
  amazon: "AMAZON",
  google_trends: "GOOGLE_TRENDS",
  meta_ad_library: "META_AD_LIBRARY",
  tiktok: "TIKTOK",
};

/** Converts adapter output + Winning Score results into a Prisma create payload. */
export function toProductCreateInput(
  input: NormalizedProductInput,
  sourceId: ProductSourceId
): Prisma.ProductUncheckedCreateInput {
  const { score, breakdown, partial } = computeWinningScore(input.signals, input.cost, input.price);

  return {
    title: input.title,
    description: input.description,
    images: input.images,
    category: input.category,
    source: SOURCE_MAP[sourceId],
    sourceUrl: input.sourceUrl,
    supplierUrl: input.supplierUrl,
    cost: input.cost,
    price: input.price,
    currency: input.currency,
    shippingCost: input.shippingCost ?? 0,
    estimatedMargin: Math.round(((input.price - input.cost) / input.price) * 1000) / 10,
    demandScore: breakdown.demand ?? null,
    trendScore: breakdown.trend ?? null,
    competitionScore: breakdown.competition ?? null,
    saturationScore: breakdown.saturation ?? null,
    engagementScore: breakdown.engagement ?? null,
    growthScore: breakdown.growth ?? null,
    winningScore: score,
    country: input.country,
    metadata: { ...(input.metadata ?? {}), partialSignals: partial } as Prisma.InputJsonValue,
  };
}
