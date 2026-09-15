import type { Prisma, ProductSource } from "@prisma/client";
import type { NormalizedProductInput, ProductSourceId } from "@/features/products/types";
import { computeWinningScore } from "@/features/products/server/scoring";

const SOURCE_MAP: Record<ProductSourceId, ProductSource> = {
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
  const { score, breakdown } = computeWinningScore(input.signals, input.cost, input.price);

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
    demandScore: breakdown.demand,
    trendScore: breakdown.trend,
    competitionScore: breakdown.competition,
    saturationScore: breakdown.saturation,
    engagementScore: breakdown.engagement,
    growthScore: breakdown.growth,
    winningScore: score,
    country: input.country,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
  };
}
