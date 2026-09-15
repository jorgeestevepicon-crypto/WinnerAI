import { describe, expect, it } from "vitest";
import { generateProductAnalysis, productAnalysisSchema } from "@/lib/ai/services/product-analysis";
import { generateBrand } from "@/lib/ai/services/brand";
import { generateStoreContent } from "@/lib/ai/services/store";
import { generateAdCopy } from "@/lib/ai/services/ad-copy";
import { generateVideoConcept } from "@/lib/ai/services/video-concept";
import { generateGrowthRecommendations } from "@/lib/ai/services/growth-recommendations";
import { generateStoreEdit } from "@/lib/ai/services/store-edit";
import { storeDocumentSchema } from "@/features/stores/schemas";

// These exercise the demo provider path (no AI_API_KEY is set in the test
// environment), which is where every AI service's output is validated
// against its Zod schema before being trusted — the same validation a real
// LLM's response goes through. A schema mismatch here means the safety net
// that prevents raw, unvalidated AI JSON from ever reaching the database
// would have failed silently.

describe("generateProductAnalysis (demo mode)", () => {
  it("returns output matching productAnalysisSchema", async () => {
    const result = await generateProductAnalysis({
      title: "Portable Neck Fan",
      description: "A wearable fan",
      category: "Electronics",
      price: 24.99,
      cost: 6.5,
      currency: "USD",
      winningScore: 72,
      country: "US",
    });
    expect(() => productAnalysisSchema.parse(result)).not.toThrow();
    expect(result.aiVerdict.opportunity).toContain("72");
  });

  it("never fabricates a guarantee of sales", async () => {
    const result = await generateProductAnalysis({
      title: "Test Product",
      description: null,
      category: null,
      price: 10,
      cost: 5,
      currency: "USD",
      winningScore: 90,
      country: null,
    });
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(/guarantee(d)? (sales|profit|income)/);
  });
});

describe("generateBrand (demo mode)", () => {
  it("produces a non-empty brand identity", async () => {
    const brand = await generateBrand({
      productTitle: "Scalp Massager",
      category: "Beauty",
      positioning: "affordable self-care",
      tone: "friendly",
      style: "minimal",
    });
    expect(brand.name.length).toBeGreaterThan(0);
    expect(brand.slogan.length).toBeGreaterThan(0);
  });
});

describe("generateStoreContent (demo mode)", () => {
  it("produces a theme and at least the core homepage sections", async () => {
    const brand = { name: "TestBrand", slogan: "Slogan", description: "Desc", logoConcept: "Concept" };
    const content = await generateStoreContent({
      brand,
      productTitle: "Test Product",
      productDescription: "A great product",
      category: "Electronics",
      price: 20,
      currency: "USD",
      positioning: "smart and simple",
      tone: "friendly",
      style: "minimal",
    });
    const types = content.sections.map((s) => s.type);
    expect(types).toContain("hero");
    expect(types).toContain("product");
    expect(types).toContain("footer");
  });

  it("marks the social proof section as a placeholder, never a real testimonial", async () => {
    const brand = { name: "TestBrand", slogan: "Slogan", description: "Desc", logoConcept: "Concept" };
    const content = await generateStoreContent({
      brand,
      productTitle: "Test Product",
      productDescription: null,
      category: null,
      price: null,
      currency: "USD",
      positioning: "smart and simple",
      tone: "friendly",
      style: "minimal",
    });
    const socialProof = content.sections.find((s) => s.type === "socialProof");
    expect(socialProof).toBeDefined();
    if (socialProof?.type === "socialProof") {
      expect(socialProof.settings.isPlaceholder).toBe(true);
    }
  });
});

describe("generateStoreEdit (demo mode)", () => {
  it("applies a recognized instruction and returns a valid document", async () => {
    const document = storeDocumentSchema.parse({
      brand: { name: "Brand", slogan: "Slogan", description: "Desc", logoConcept: "Concept" },
      theme: { primaryColor: "#fff", secondaryColor: "#000", accentColor: "#000", backgroundColor: "#fff", headingFont: "Inter", bodyFont: "Inter", style: "minimal" },
      sections: [{ id: "hero", type: "hero", order: 0, hidden: false, settings: { headline: "Hi", subtitle: "Sub", ctaLabel: "Go" } }],
    });

    const result = await generateStoreEdit({ document, instruction: "make it more premium" });
    expect(result.theme.style).toBe("premium");
    expect(() => storeDocumentSchema.parse(result)).not.toThrow();
  });
});

describe("generateAdCopy (demo mode)", () => {
  it("produces exactly the requested number of genuinely distinct variants", async () => {
    const result = await generateAdCopy({
      productTitle: "Compression Sleeves",
      productDescription: "Recovery gear",
      category: "Sports",
      price: 18,
      currency: "USD",
      style: "UGC",
      platform: "META",
      objective: "SALES",
      audience: { ageRange: "25-45", gender: "all", country: "US", interests: ["fitness"], awarenessLevel: "problem-aware" },
      variantCount: 5,
    });
    expect(result.variants).toHaveLength(5);
    const angles = new Set(result.variants.map((v) => v.angle));
    expect(angles.size).toBeGreaterThan(1);
  });
});

describe("generateVideoConcept (demo mode)", () => {
  it("produces a full storyboard covering every required stage", async () => {
    const concept = await generateVideoConcept({
      productTitle: "Sleep Mask",
      productDescription: "Better sleep",
      style: "UGC",
    });
    const stages = concept.scenes.map((s) => s.stage);
    for (const required of ["hook", "problem", "product_intro", "solution", "benefits", "cta"]) {
      expect(stages).toContain(required);
    }
  });
});

describe("generateGrowthRecommendations (demo mode)", () => {
  it("grounds recommendations in the products/stores/campaigns actually passed in", async () => {
    const result = await generateGrowthRecommendations({
      products: [{ id: "p1", title: "Winner Product", winningScore: 88, estimatedMargin: 60 }],
      stores: [],
      campaigns: [],
      hasRealAnalytics: false,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    const titles = result.recommendations.map((r) => r.title).join(" ");
    expect(titles).toContain("Winner Product");
  });
});
