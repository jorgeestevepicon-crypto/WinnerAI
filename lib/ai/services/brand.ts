import { getAIProvider, registerDemoGenerator } from "@/lib/ai";
import { getAIImageProvider } from "@/lib/ai/image-provider";
import { storeBrandSchema, type StoreBrand } from "@/features/stores/schemas";

export interface BrandInput {
  productTitle: string;
  category: string | null;
  positioning: string;
  tone: "professional" | "friendly" | "playful" | "luxury" | "urgent";
  style: "minimal" | "premium" | "bold" | "playful" | "editorial";
}

const PREFIXES: Record<BrandInput["style"], string[]> = {
  minimal: ["Pure", "Simple", "Clear", "Essence"],
  premium: ["Lumière", "Noir", "Atelier", "Aurum"],
  bold: ["Bolt", "Surge", "Apex", "Forge"],
  playful: ["Bloom", "Zippy", "Nimbly", "Fizz"],
  editorial: ["The Field", "Studio", "Journal", "Folio"],
};

registerDemoGenerator("brand", (rawInput) => {
  const input = rawInput as BrandInput;
  const category = input.category ?? "products";
  const prefix = PREFIXES[input.style][input.productTitle.length % PREFIXES[input.style].length];
  const name = `${prefix} ${category.split(" ")[0]}`.trim();

  return {
    name,
    slogan: `${input.positioning}`.slice(0, 80),
    description: `${name} is a ${input.style} brand built around ${input.productTitle.toLowerCase()}, designed for people who want a ${input.tone} take on ${category.toLowerCase()}.`,
    logoConcept: `A ${input.style} wordmark for "${name}", using clean geometry and a single accent color — no literal product illustration.`,
  } satisfies StoreBrand;
});

function buildPrompt(input: BrandInput) {
  return `Create a brand identity for an ecommerce store selling: ${input.productTitle} (category: ${input.category ?? "N/A"}).
Positioning: ${input.positioning}
Tone: ${input.tone}
Visual style: ${input.style}

Return a brand name, a short slogan, a one-paragraph description, and a text description of a logo concept (not an image). Never claim awards, certifications or customer counts that aren't provided.`;
}

export async function generateBrand(input: BrandInput): Promise<StoreBrand> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "brand",
    schema: storeBrandSchema,
    system: "You are a brand strategist for ecommerce startups. You never invent awards, certifications or customer testimonials.",
    prompt: buildPrompt(input),
    input,
  });
}

/**
 * Renders `logoConcept` as an actual image via the image provider abstraction
 * (the same one the Ad Studio uses) — demo mode gets a labeled SVG
 * placeholder, a configured AI_IMAGE_PROVIDER gets a real generated image.
 * Never throws: a failed logo render shouldn't block store generation, so
 * callers get `undefined` and the UI falls back to a text wordmark.
 */
export async function generateBrandLogo(brand: Pick<StoreBrand, "name" | "logoConcept">): Promise<string | undefined> {
  try {
    const imageProvider = getAIImageProvider();
    const result = await imageProvider.generateImage({
      prompt: `Minimal logo mark for the brand "${brand.name}". ${brand.logoConcept} Flat vector style, transparent-friendly, no photographic elements, no text other than the brand name itself.`,
      width: 512,
      height: 512,
      label: brand.name,
    });
    return result.url;
  } catch {
    return undefined;
  }
}
