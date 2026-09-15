import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";

export const productAnalysisSchema = z.object({
  targetAudience: z.object({
    description: z.string(),
    ageRange: z.string(),
    interests: z.array(z.string()),
  }),
  problemsSolved: z.array(z.string()).min(1),
  advantages: z.array(z.string()).min(1),
  objections: z.array(z.string()).min(1),
  marketingAngles: z.array(z.string()).min(1),
  competitors: z.array(z.object({ name: z.string(), notes: z.string() })),
  opportunities: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  recommendedPrice: z.number().positive(),
  positioning: z.string(),
  aiVerdict: z.object({
    opportunity: z.string(),
    risks: z.string(),
    strategy: z.string(),
    audience: z.string(),
    recommendedPrice: z.string(),
    positioning: z.string(),
  }),
});
export type ProductAnalysisOutput = z.infer<typeof productAnalysisSchema>;

export interface ProductAnalysisInput {
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  cost: number | null;
  currency: string;
  winningScore: number | null;
  country: string | null;
}

registerDemoGenerator("product_analysis", (rawInput) => {
  const input = rawInput as ProductAnalysisInput;
  const price = input.price ?? 0;
  const category = input.category ?? "general";
  const recommendedPrice = Math.round(price * 1.08 * 100) / 100 || 24.99;

  return {
    targetAudience: {
      description: `Value-conscious online shoppers interested in ${category.toLowerCase()} products who discover new items through social media.`,
      ageRange: "25-45",
      interests: [category, "online shopping", "product discovery", "social media trends"],
    },
    problemsSolved: [
      `Makes ${category.toLowerCase()} more convenient in daily life`,
      "Saves time compared to existing alternatives",
      "Addresses a need not well served by mainstream retailers",
    ],
    advantages: [
      "Differentiated positioning versus generic marketplace listings",
      "Attractive unit economics at the current price point",
      "Easy to demonstrate visually in short-form video",
    ],
    objections: [
      "Shoppers may be unsure of product quality without reviews",
      "Shipping time expectations need to be set clearly",
      "Price may seem high compared to unbranded alternatives",
    ],
    marketingAngles: [
      "Problem/solution: highlight the everyday frustration this removes",
      "Before/after transformation",
      "UGC-style demonstration of first-time use",
    ],
    competitors: [
      { name: `Generic ${category} listings on marketplaces`, notes: "Lower price, no branding, weak trust signals" },
      { name: "Established niche brands", notes: "Higher price, stronger trust, slower to iterate on creative" },
    ],
    opportunities: [
      "Trend signals suggest room to build a dedicated brand around this product",
      "Low existing brand competition in paid social for this angle",
    ],
    risks: [
      "Demand may be seasonal or trend-driven rather than evergreen",
      "Competition could increase quickly if the trend gets popular",
    ],
    recommendedPrice,
    positioning: `Position as a modern, approachable solution for everyday ${category.toLowerCase()} needs — accessible, not premium-luxury.`,
    aiVerdict: {
      opportunity: `This product shows a ${input.winningScore ?? "moderate"} Winning Score, suggesting a reasonable balance of demand and competition worth testing with a small ad budget.`,
      risks: "Treat this as an early signal, not a guarantee — validate with real ad spend before committing to inventory.",
      strategy: "Start with 2-3 creative angles, a lean landing page, and a small daily budget before scaling.",
      audience: "Primarily younger and middle-aged adults active on short-form video platforms.",
      recommendedPrice: `Around ${input.currency} ${recommendedPrice} balances margin with perceived value.`,
      positioning: "Approachable and practical rather than luxury — lead with the problem it solves.",
    },
  } satisfies ProductAnalysisOutput;
});

function buildPrompt(input: ProductAnalysisInput) {
  return `Analyze this ecommerce product opportunity and return a structured analysis.

Title: ${input.title}
Description: ${input.description ?? "N/A"}
Category: ${input.category ?? "N/A"}
Price: ${input.price ?? "N/A"} ${input.currency}
Cost: ${input.cost ?? "N/A"} ${input.currency}
Target country: ${input.country ?? "N/A"}
Winning Score: ${input.winningScore ?? "N/A"} (0-100 estimate, not a guarantee)

Provide target audience, problems solved, advantages, objections, marketing angles, likely competitors, opportunities, risks, a recommended retail price, a positioning statement, and an AI verdict. Never claim guaranteed sales or invent reviews, certifications or customer counts.`;
}

export async function generateProductAnalysis(input: ProductAnalysisInput): Promise<ProductAnalysisOutput> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "product_analysis",
    schema: productAnalysisSchema,
    system:
      "You are an ecommerce research analyst. You never fabricate reviews, certifications, sales figures or endorsements. You clearly separate estimates from facts and never guarantee outcomes.",
    prompt: buildPrompt(input),
    input,
  });
}
