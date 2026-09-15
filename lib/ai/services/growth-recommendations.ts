import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";

export const growthRecommendationSchema = z.object({
  type: z.enum(["product", "pricing", "ad", "audience", "creative", "landing"]),
  title: z.string(),
  rationale: z.string(),
  suggestedAction: z.string(),
  actionHref: z.string().optional(),
  requiresConfirmation: z.boolean(),
});
export type GrowthRecommendation = z.infer<typeof growthRecommendationSchema>;

export const growthRecommendationsSchema = z.object({ recommendations: z.array(growthRecommendationSchema).min(1) });
export type GrowthRecommendationsOutput = z.infer<typeof growthRecommendationsSchema>;

export interface GrowthAgentInput {
  products: { id: string; title: string; winningScore: number | null; estimatedMargin: number | null }[];
  stores: { id: string; name: string; status: string }[];
  campaigns: { id: string; name: string; platform: string; creativeCount: number }[];
  hasRealAnalytics: boolean;
}

registerDemoGenerator("growth_recommendations", (rawInput) => {
  const input = rawInput as GrowthAgentInput;
  const recommendations: GrowthRecommendation[] = [];

  const lowMarginProduct = input.products.find((p) => (p.estimatedMargin ?? 100) < 30);
  if (lowMarginProduct) {
    recommendations.push({
      type: "pricing",
      title: `Consider raising the price for ${lowMarginProduct.title}`,
      rationale: `Its estimated margin (${lowMarginProduct.estimatedMargin}%) is on the low side, which limits room for ad spend.`,
      suggestedAction: "Review pricing on the product page and re-run the analyzer with a higher price to see the effect on the Winning Score.",
      actionHref: `/products/${lowMarginProduct.id}`,
      requiresConfirmation: true,
    });
  }

  const highScoreProduct = [...input.products].sort((a, b) => (b.winningScore ?? 0) - (a.winningScore ?? 0))[0];
  if (highScoreProduct && !input.stores.some((s) => s.status === "READY" || s.status === "PUBLISHED")) {
    recommendations.push({
      type: "product",
      title: `Build a store for ${highScoreProduct.title}`,
      rationale: `This is your highest-scoring product (${highScoreProduct.winningScore ?? "N/A"}) and doesn't have a store yet.`,
      suggestedAction: "Use the AI Store Builder to generate a brand and homepage for it.",
      actionHref: `/store-builder?productId=${highScoreProduct.id}`,
      requiresConfirmation: false,
    });
  }

  const campaignWithFewCreatives = input.campaigns.find((c) => c.creativeCount < 2);
  if (campaignWithFewCreatives) {
    recommendations.push({
      type: "creative",
      title: `Generate more ad variants for ${campaignWithFewCreatives.name}`,
      rationale: "Campaigns with only one creative set have less data to learn from once real spend starts.",
      suggestedAction: "Generate a bulk batch of 10 ads with varied angles and hooks.",
      actionHref: `/ads/${campaignWithFewCreatives.id}`,
      requiresConfirmation: false,
    });
  }

  if (!input.hasRealAnalytics) {
    recommendations.push({
      type: "ad",
      title: "Connect a real ad or analytics source",
      rationale: "Recommendations are currently based on product and creative data alone — connecting Shopify or an ad platform unlocks performance-based suggestions like winning-hook detection.",
      suggestedAction: "Connect Shopify or an ad platform from Settings once available.",
      actionHref: "/analytics",
      requiresConfirmation: false,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "audience",
      title: "You're set up well — try a new audience angle",
      rationale: "No urgent issues detected in your current products, stores or campaigns.",
      suggestedAction: "Try generating a new audience segment (e.g. a different age range) for your best-performing product.",
      requiresConfirmation: false,
    });
  }

  return { recommendations } satisfies GrowthRecommendationsOutput;
});

function buildPrompt(input: GrowthAgentInput) {
  return `You are reviewing an ecommerce operator's WinnerAI workspace. Suggest concrete, prioritized growth actions.

Products: ${JSON.stringify(input.products)}
Stores: ${JSON.stringify(input.stores)}
Ad campaigns: ${JSON.stringify(input.campaigns)}
Has real analytics connected: ${input.hasRealAnalytics}

Return 2-5 recommendations. Each needs a type (product/pricing/ad/audience/creative/landing), a short title, a one-sentence rationale grounded in the data above (never invented numbers), a concrete suggested action, and whether it requires user confirmation before acting (true for anything that changes pricing, spend or published content). Never suggest guaranteed outcomes.`;
}

export async function generateGrowthRecommendations(input: GrowthAgentInput): Promise<GrowthRecommendationsOutput> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "growth_recommendations",
    schema: growthRecommendationsSchema,
    system:
      "You are a pragmatic ecommerce growth advisor. You only reason from the data you're given, never invent metrics, and never claim guaranteed results.",
    prompt: buildPrompt(input),
    input,
  });
}
