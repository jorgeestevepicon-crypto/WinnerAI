import "server-only";
import { prisma } from "@/lib/db/prisma";

export interface AIContext {
  product?: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    price: number | null;
    cost: number | null;
    currency: string;
    estimatedMargin: number | null;
    winningScore: number | null;
    country: string | null;
  };
  analysis?: {
    targetAudience: unknown;
    problemsSolved: string[];
    advantages: string[];
    objections: string[];
    marketingAngles: string[];
    competitors: unknown;
    recommendedPrice: number | null;
    positioning: string | null;
  };
  brand?: { name: string; slogan: string; description: string } | null;
  store?: { id: string; name: string; locale: string; country: string | null } | null;
  existingAds?: { platform: string; angle: string | null }[];
}

/**
 * Composes the shared context object every AI service builds its prompt
 * from, so the product a user is looking at "follows" them into the Store
 * Builder, Ad Studio and Growth Agent without re-entering information.
 */
export async function buildAIContext(params: { userId: string; productId?: string; storeId?: string }): Promise<AIContext> {
  const context: AIContext = {};

  if (params.productId) {
    const product = await prisma.product.findFirst({
      where: { id: params.productId, userId: params.userId },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (product) {
      context.product = {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.cost,
        currency: product.currency,
        estimatedMargin: product.estimatedMargin,
        winningScore: product.winningScore,
        country: product.country,
      };

      const analysis = product.analyses[0];
      if (analysis) {
        context.analysis = {
          targetAudience: analysis.targetAudience,
          problemsSolved: analysis.problemsSolved,
          advantages: analysis.advantages,
          objections: analysis.objections,
          marketingAngles: analysis.marketingAngles,
          competitors: analysis.competitors,
          recommendedPrice: analysis.recommendedPrice,
          positioning: analysis.positioning,
        };
      }
    }
  }

  if (params.storeId) {
    const store = await prisma.store.findFirst({ where: { id: params.storeId, userId: params.userId } });
    if (store) {
      context.store = { id: store.id, name: store.name, locale: store.locale, country: store.country };
      const brand = store.brand as { name?: string; slogan?: string; description?: string } | null;
      if (brand?.name) {
        context.brand = { name: brand.name, slogan: brand.slogan ?? "", description: brand.description ?? "" };
      }
    }
  }

  if (params.productId) {
    const ads = await prisma.adCampaign.findMany({
      where: { userId: params.userId, productId: params.productId },
      select: { platform: true, creatives: { select: { style: true }, take: 1 } },
      take: 5,
    });
    context.existingAds = ads.map((ad) => ({ platform: ad.platform, angle: ad.creatives[0]?.style ?? null }));
  }

  return context;
}
