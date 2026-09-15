import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";
import type { AdStyle } from "@/features/ads/schemas";

export const adVariantContentSchema = z.object({
  label: z.string(),
  angle: z.string(),
  hook: z.string(),
  primaryText: z.string(),
  headline: z.string(),
  description: z.string(),
  cta: z.string(),
  imagePrompt: z.string(),
});
export type AdVariantContent = z.infer<typeof adVariantContentSchema>;

export const adCopyOutputSchema = z.object({ variants: z.array(adVariantContentSchema).min(1) });
export type AdCopyOutput = z.infer<typeof adCopyOutputSchema>;

export interface AdCopyInput {
  productTitle: string;
  productDescription: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  style: AdStyle;
  platform: string;
  objective: string;
  audience: { ageRange: string; gender: string; country: string; interests: string[]; awarenessLevel: string };
  marketingAngles?: string[];
  advantages?: string[];
  objections?: string[];
  variantCount: number;
}

const ANGLE_TEMPLATES: { angle: string; hook: (p: string) => string; cta: string }[] = [
  { angle: "Problem/Solution", hook: (p) => `Tired of dealing with this every day? ${p} fixes it.`, cta: "Shop now" },
  { angle: "UGC", hook: (p) => `I wasn't expecting ${p} to actually work this well...`, cta: "See for yourself" },
  { angle: "Direct Response", hook: (p) => `${p} — limited stock, don't miss it.`, cta: "Get yours today" },
  { angle: "Before/After", hook: (p) => `This is what changed after I started using ${p}.`, cta: "Try it now" },
  { angle: "Emotional", hook: (p) => `Little things like ${p} make a bigger difference than you'd think.`, cta: "Discover more" },
  { angle: "Product-focused", hook: (p) => `Meet ${p} — designed to just work.`, cta: "Learn more" },
  { angle: "Viral", hook: (p) => `Everyone's suddenly talking about ${p}.`, cta: "Join in" },
  { angle: "Lifestyle", hook: (p) => `${p} fits right into your everyday routine.`, cta: "Shop the look" },
  { angle: "Premium", hook: (p) => `${p} — crafted for people who notice the details.`, cta: "Explore" },
  { angle: "Minimal", hook: (p) => `${p}. Simple. Effective.`, cta: "Shop now" },
];

registerDemoGenerator("ad_copy", (rawInput) => {
  const input = rawInput as AdCopyInput;
  const advantages = input.advantages ?? ["thoughtful design", "fast shipping", "great value"];

  const variants: AdVariantContent[] = Array.from({ length: input.variantCount }).map((_, i) => {
    const template = ANGLE_TEMPLATES[i % ANGLE_TEMPLATES.length];
    const label = `Variant ${String.fromCharCode(65 + i)}`;
    const advantage = advantages[i % advantages.length];

    return {
      label,
      angle: template.angle,
      hook: template.hook(input.productTitle),
      primaryText: `${input.productTitle} is built around ${advantage}. ${(input.marketingAngles ?? [])[0] ?? "It's a small change that makes a real difference."}`,
      headline: `${input.productTitle} — ${advantage}`,
      description: input.productDescription ?? `Discover ${input.productTitle}, available now.`,
      cta: template.cta,
      imagePrompt: `${template.angle} style advertisement for ${input.productTitle}, ${input.category ?? "product"}, clean composition, no fabricated claims or certifications, no text overlay.`,
    };
  });

  return { variants } satisfies AdCopyOutput;
});

function buildPrompt(input: AdCopyInput) {
  return `Generate ${input.variantCount} distinct ad copy variants for this product.

Product: ${input.productTitle} — ${input.productDescription ?? "N/A"}
Category: ${input.category ?? "N/A"}, price ${input.price ?? "N/A"} ${input.currency}
Platform: ${input.platform}, Objective: ${input.objective}
Creative style: ${input.style}
Audience: ${input.audience.ageRange}, ${input.audience.gender}, ${input.audience.country}, interests: ${input.audience.interests.join(", ")}, awareness: ${input.audience.awarenessLevel}
Marketing angles: ${(input.marketingAngles ?? []).join("; ") || "N/A"}
Advantages: ${(input.advantages ?? []).join("; ") || "N/A"}

Each variant must have a genuinely different angle, hook, emotion and CTA — not just small rewordings. Never invent reviews, certifications, sales numbers or medical/financial claims. Also produce a one-sentence image prompt per variant describing a photorealistic ad visual (no on-image text, no fabricated certifications).`;
}

export async function generateAdCopy(input: AdCopyInput): Promise<AdCopyOutput> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "ad_copy",
    schema: adCopyOutputSchema,
    system:
      "You are a senior performance marketing copywriter. You never fabricate reviews, certifications, medical claims or sales figures, and every variant must have a distinct angle.",
    prompt: buildPrompt(input),
    input,
  });
}
