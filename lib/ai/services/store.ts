import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";
import { getAIImageProvider } from "@/lib/ai/image-provider";
import { storeThemeSchema, storeSectionSchema, type StoreTheme, type StoreSectionData, type StoreBrand } from "@/features/stores/schemas";

export interface StoreContentInput {
  brand: StoreBrand;
  productTitle: string;
  productDescription: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  positioning: string;
  tone: "professional" | "friendly" | "playful" | "luxury" | "urgent";
  style: "minimal" | "premium" | "bold" | "playful" | "editorial";
  marketingAngles?: string[];
  advantages?: string[];
  objections?: string[];
}

export const storeContentSchema = z.object({
  theme: storeThemeSchema,
  sections: z.array(storeSectionSchema).min(4),
});
export type StoreContent = z.infer<typeof storeContentSchema>;

const STYLE_PALETTES: Record<StoreTheme["style"], Omit<StoreTheme, "style">> = {
  minimal: { primaryColor: "#111827", secondaryColor: "#6b7280", accentColor: "#111827", backgroundColor: "#ffffff", headingFont: "Inter", bodyFont: "Inter" },
  premium: { primaryColor: "#0f172a", secondaryColor: "#a16207", accentColor: "#eab308", backgroundColor: "#faf9f6", headingFont: "Playfair Display", bodyFont: "Inter" },
  bold: { primaryColor: "#dc2626", secondaryColor: "#111827", accentColor: "#f97316", backgroundColor: "#ffffff", headingFont: "Poppins", bodyFont: "Inter" },
  playful: { primaryColor: "#ec4899", secondaryColor: "#8b5cf6", accentColor: "#facc15", backgroundColor: "#fff7fb", headingFont: "Baloo 2", bodyFont: "Inter" },
  editorial: { primaryColor: "#1c1917", secondaryColor: "#78716c", accentColor: "#a8a29e", backgroundColor: "#fafaf9", headingFont: "Source Serif 4", bodyFont: "Inter" },
};

registerDemoGenerator("store", (rawInput) => {
  const input = rawInput as StoreContentInput;
  const angles = input.marketingAngles ?? ["a smarter way to solve an everyday problem"];
  const advantages = input.advantages ?? ["Thoughtfully designed", "Fast shipping", "Responsive support"];

  const sections: StoreSectionData[] = [
    {
      id: "hero",
      type: "hero",
      order: 0,
      hidden: false,
      settings: {
        headline: `${input.brand.name}: ${input.positioning}`,
        subtitle: input.brand.slogan,
        ctaLabel: "Shop now",
      },
    },
    {
      id: "benefits",
      type: "benefits",
      order: 1,
      hidden: false,
      settings: {
        title: "Why you'll love it",
        items: advantages.slice(0, 4).map((a) => ({ title: a, description: `${a} — built into every ${input.productTitle.toLowerCase()}.` })),
      },
    },
    {
      id: "product",
      type: "product",
      order: 2,
      hidden: false,
      settings: {
        title: input.productTitle,
        description: input.productDescription ?? `${input.productTitle}, designed around ${angles[0]}.`,
        bullets: advantages.slice(0, 5),
        ctaLabel: "Add to cart",
      },
    },
    {
      id: "social-proof",
      type: "socialProof",
      order: 3,
      hidden: false,
      settings: {
        title: "What early customers are saying",
        isPlaceholder: true,
        note: "Placeholder — replace with real customer reviews once you have them. WinnerAI never fabricates testimonials.",
      },
    },
    {
      id: "faq",
      type: "faq",
      order: 4,
      hidden: false,
      settings: {
        title: "Frequently asked questions",
        items: [
          { question: "How long does shipping take?", answer: "Shipping times vary by destination — update this with your real fulfillment timeline." },
          { question: "What if it doesn't work for me?", answer: "Update this with your real return policy." },
          { question: "Is this easy to use?", answer: `Yes — ${input.productTitle} is designed to be simple from the first use.` },
        ],
      },
    },
    {
      id: "guarantee",
      type: "guarantee",
      order: 5,
      hidden: false,
      settings: {
        title: "Our promise",
        description: "Update this section with your real guarantee or return policy — don't publish placeholder claims.",
      },
    },
    {
      id: "cta",
      type: "cta",
      order: 6,
      hidden: false,
      settings: {
        headline: `Ready to try ${input.productTitle}?`,
        ctaLabel: "Get yours today",
      },
    },
    {
      id: "footer",
      type: "footer",
      order: 7,
      hidden: false,
      settings: { text: `© ${new Date().getFullYear()} ${input.brand.name}. All rights reserved.` },
    },
  ];

  return { theme: { ...STYLE_PALETTES[input.style], style: input.style }, sections } satisfies StoreContent;
});

const STYLE_DESIGN_BRIEFS: Record<StoreContentInput["style"], string> = {
  minimal: "Minimal: near-monochrome (black/white/one grey), huge whitespace, a single restrained accent color, geometric sans-serif headings.",
  premium: "Premium: dark or cream base, a metallic gold/bronze/copper accent, a serif display heading font, generous spacing — feels expensive.",
  bold: "Bold: high-contrast saturated colors (e.g. red/black or orange/navy), a heavy grotesque or condensed heading font — feels loud and energetic.",
  playful: "Playful: bright, warm, candy-like palette with at least two saturated hues, a rounded friendly heading font — feels fun and approachable.",
  editorial: "Editorial: warm off-white or stone background, muted earthy accent, a literary serif heading font — feels like a print magazine.",
};

function buildPrompt(input: StoreContentInput) {
  return `Generate homepage content for an ecommerce store.

Brand: ${input.brand.name} — ${input.brand.slogan}
Product: ${input.productTitle} (${input.category ?? "N/A"}), price ${input.price ?? "N/A"} ${input.currency}
Positioning: ${input.positioning}
Tone: ${input.tone}, visual style: ${input.style}
Marketing angles: ${(input.marketingAngles ?? []).join("; ") || "N/A"}
Advantages: ${(input.advantages ?? []).join("; ") || "N/A"}

Design brief for the "${input.style}" style — commit to it strongly, don't default to safe blue/indigo corporate colors unless the brief calls for it:
${STYLE_DESIGN_BRIEFS[input.style]}
Pick real hex colors and real font family names (Google Fonts) that match that brief. Two stores in different styles should look nothing alike.

Produce a theme (colors + fonts matching the style) and homepage sections: hero, benefits, product, socialProof (a clearly-labeled placeholder, never a fabricated review), faq, guarantee, cta, footer.
Never invent customer reviews, testimonials, certifications, awards or sales numbers as if they were real.`;
}

export async function generateStoreContent(input: StoreContentInput, options?: { forceDemo?: boolean }): Promise<StoreContent> {
  const provider = getAIProvider(options);
  return provider.generateObject({
    taskId: "store",
    schema: storeContentSchema,
    system:
      "You are an ecommerce landing page copywriter and designer. You never fabricate reviews, testimonials, certifications or sales figures — placeholders are always explicitly labeled as such.",
    prompt: buildPrompt(input),
    input,
  });
}

/**
 * Renders a hero background and a product shot via the image provider —
 * demo mode gets a labeled SVG placeholder, real mode gets a generated
 * image. Never throws: a failed render just leaves the section without an
 * image rather than blocking store generation (same pattern as the brand
 * logo).
 */
export async function generateHeroImage(
  input: Pick<StoreContentInput, "productTitle" | "category" | "style" | "tone">,
  options?: { forceDemo?: boolean }
): Promise<string | undefined> {
  try {
    const imageProvider = getAIImageProvider(options);
    const result = await imageProvider.generateImage({
      prompt: `Wide hero banner photo for an ecommerce homepage selling ${input.productTitle} (${input.category ?? "general product"}). Visual style: ${input.style}, mood: ${input.tone}. Realistic product photography or lifestyle scene, no text, no logos.`,
      width: 1600,
      height: 900,
      label: input.productTitle,
    });
    return result.url;
  } catch {
    return undefined;
  }
}

export async function generateProductImage(
  input: Pick<StoreContentInput, "productTitle" | "productDescription" | "category" | "style">,
  options?: { forceDemo?: boolean }
): Promise<string | undefined> {
  try {
    const imageProvider = getAIImageProvider(options);
    const result = await imageProvider.generateImage({
      prompt: `Studio product photo of ${input.productTitle}. ${input.productDescription ?? ""} Category: ${input.category ?? "general product"}. Visual style: ${input.style}. Clean background, no text, no watermarks.`,
      width: 800,
      height: 800,
      label: input.productTitle,
    });
    return result.url;
  } catch {
    return undefined;
  }
}

export interface StoreSeoInput {
  brandName: string;
  productTitle: string;
  productDescription: string | null;
  category: string | null;
}

export const storeSeoSchema = z.object({
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
});
export type StoreSeo = z.infer<typeof storeSeoSchema>;

registerDemoGenerator("store_seo", (rawInput) => {
  const input = rawInput as StoreSeoInput;
  const category = input.category ?? "products";
  return {
    seoTitle: `${input.brandName} | ${input.productTitle}`.slice(0, 70),
    seoDescription: `Shop ${input.productTitle} at ${input.brandName}. Quality ${category.toLowerCase()} built for everyday use.`.slice(0, 160),
  } satisfies StoreSeo;
});

export async function generateStoreSeo(input: StoreSeoInput, options?: { forceDemo?: boolean }): Promise<StoreSeo> {
  const provider = getAIProvider(options);
  return provider.generateObject({
    taskId: "store_seo",
    schema: storeSeoSchema,
    system:
      "You are an ecommerce SEO copywriter. Write concise, honest search-engine metadata — never invent claims, certifications, or numbers that aren't given to you.",
    prompt: `Write an SEO title (max 70 characters) and SEO meta description (max 160 characters) for an online store.

Brand: ${input.brandName}
Product: ${input.productTitle} (${input.category ?? "general product"})
${input.productDescription ? `Description: ${input.productDescription}` : ""}`,
    input,
  });
}
