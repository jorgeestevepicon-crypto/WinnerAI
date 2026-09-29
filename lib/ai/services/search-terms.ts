import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";

export const searchTermsSchema = z.object({
  terms: z.array(z.string().min(2)).min(3).max(6),
});
export type SearchTermsOutput = z.infer<typeof searchTermsSchema>;

interface SearchTermsInput {
  category: string;
  baseTerm: string;
}

// Demo mode has no real LLM to call — vary the static mapped term with
// generic dropshipping-catalog modifiers instead of inventing fake trend
// data or product names.
registerDemoGenerator("product_search_terms", (rawInput) => {
  const input = rawInput as SearchTermsInput;
  const modifiers = ["mini", "portable", "wireless", "2024", "set"];
  return {
    terms: [input.baseTerm, ...modifiers.map((m) => `${input.baseTerm} ${m}`)],
  } satisfies SearchTermsOutput;
});

function buildPrompt(input: SearchTermsInput) {
  return `You are helping search AliExpress's catalog for the "${input.category}" category using a literal product-title text search — it only matches words that actually appear in real product titles, it does not understand abstract category browsing.

The current search phrase used is: "${input.baseTerm}"

Generate 5 diverse, specific search phrases a real AliExpress seller would plausibly use in a product title within this category, chosen so they'd surface genuinely different winning-dropshipping-product candidates rather than 5 near-duplicates of the same phrase. Each phrase should be 2-4 words, in English, and sound like real product-title language (e.g. "mini massage gun", not "wellness devices"). Do not invent brand names, certifications, or specific sales/trend figures.`;
}

/**
 * Expands a single static category->keyword mapping into several diverse,
 * realistic product-title search phrases via the AI provider, so a
 * category search hits more of AliExpress's real catalog instead of
 * whatever one fixed phrase happens to return. Falls back to the original
 * single term (never throws) if the AI call fails, so a flaky/unconfigured
 * provider degrades to the previous behavior rather than breaking search.
 */
export async function generateProductSearchTerms(category: string, baseTerm: string): Promise<string[]> {
  const provider = getAIProvider();
  const input: SearchTermsInput = { category, baseTerm };
  try {
    const result = await provider.generateObject({
      taskId: "product_search_terms",
      schema: searchTermsSchema,
      system:
        "You are an ecommerce merchandiser who writes realistic AliExpress product search phrases. You never fabricate sales data, reviews, or trends.",
      prompt: buildPrompt(input),
      input,
    });
    return Array.from(new Set([baseTerm, ...result.terms]));
  } catch (error) {
    console.error("generateProductSearchTerms failed, falling back to the single mapped term", error);
    return [baseTerm];
  }
}
