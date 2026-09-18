import { z } from "zod";

export const storeBrandSchema = z.object({
  name: z.string(),
  slogan: z.string(),
  description: z.string(),
  logoConcept: z.string(),
  // Populated after generation by generateBrandLogo() — the AI text call
  // that produces the fields above never returns an image itself.
  logoUrl: z.string().optional(),
});
export type StoreBrand = z.infer<typeof storeBrandSchema>;

export const storeThemeSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  headingFont: z.string(),
  bodyFont: z.string(),
  style: z.enum(["minimal", "premium", "bold", "playful", "editorial"]),
});
export type StoreTheme = z.infer<typeof storeThemeSchema>;

// Every section type the visual editor and AI can produce. Each has a
// `settings` shape specific to its type, validated by sectionSettingsSchema.
export const sectionTypeSchema = z.enum([
  "hero",
  "benefits",
  "product",
  "socialProof",
  "faq",
  "guarantee",
  "cta",
  "footer",
]);
export type SectionType = z.infer<typeof sectionTypeSchema>;

export const heroSettingsSchema = z.object({
  headline: z.string(),
  subtitle: z.string(),
  ctaLabel: z.string(),
  imageUrl: z.string().optional(),
});

export const benefitsSettingsSchema = z.object({
  title: z.string(),
  items: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
});

export const productSettingsSchema = z.object({
  title: z.string(),
  description: z.string(),
  bullets: z.array(z.string()),
  ctaLabel: z.string(),
  imageUrl: z.string().optional(),
});

export const socialProofSettingsSchema = z.object({
  title: z.string(),
  isPlaceholder: z.literal(true),
  note: z.string(),
});

export const faqSettingsSchema = z.object({
  title: z.string(),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

export const guaranteeSettingsSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const ctaSettingsSchema = z.object({
  headline: z.string(),
  ctaLabel: z.string(),
});

export const footerSettingsSchema = z.object({
  text: z.string(),
});

export const sectionSettingsSchemaByType = {
  hero: heroSettingsSchema,
  benefits: benefitsSettingsSchema,
  product: productSettingsSchema,
  socialProof: socialProofSettingsSchema,
  faq: faqSettingsSchema,
  guarantee: guaranteeSettingsSchema,
  cta: ctaSettingsSchema,
  footer: footerSettingsSchema,
} as const;

const baseSection = { id: z.string(), order: z.number(), hidden: z.boolean().default(false) };

export const storeSectionSchema = z.discriminatedUnion("type", [
  z.object({ ...baseSection, type: z.literal("hero"), settings: heroSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("benefits"), settings: benefitsSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("product"), settings: productSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("socialProof"), settings: socialProofSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("faq"), settings: faqSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("guarantee"), settings: guaranteeSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("cta"), settings: ctaSettingsSchema }),
  z.object({ ...baseSection, type: z.literal("footer"), settings: footerSettingsSchema }),
]);
export type StoreSectionData = z.infer<typeof storeSectionSchema>;

export const storeDocumentSchema = z.object({
  brand: storeBrandSchema,
  theme: storeThemeSchema,
  sections: z.array(storeSectionSchema),
});
export type StoreDocument = z.infer<typeof storeDocumentSchema>;

export const storeBuilderInputSchema = z.object({
  productId: z.string(),
  country: z.string().min(2),
  language: z.string().min(2),
  style: z.enum(["minimal", "premium", "bold", "playful", "editorial"]),
  tone: z.enum(["professional", "friendly", "playful", "luxury", "urgent"]),
  positioning: z.string().min(2),
  generationMode: z.enum(["ai", "demo"]).default("ai"),
});
export type StoreBuilderInput = z.infer<typeof storeBuilderInputSchema>;

export const storeSettingsInputSchema = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  shippingPolicy: z.string().optional(),
  returnPolicy: z.string().optional(),
  privacyPolicy: z.string().optional(),
});
export type StoreSettingsInput = z.infer<typeof storeSettingsInputSchema>;
