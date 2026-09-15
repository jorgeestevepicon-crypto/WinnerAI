import { getAIProvider, registerDemoGenerator } from "@/lib/ai";
import { storeDocumentSchema, type StoreDocument } from "@/features/stores/schemas";

export interface StoreEditInput {
  document: StoreDocument;
  instruction: string;
}

const COLOR_WORDS: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  pink: "#ec4899",
  purple: "#7c3aed",
  gold: "#eab308",
  orange: "#f97316",
};

// Demo mode implements a handful of real, understandable transformations
// instead of just echoing the document back — genuinely useful without a
// real LLM, while staying obviously simpler than a real model's range.
registerDemoGenerator("store_ai_edit", (rawInput) => {
  const input = rawInput as StoreEditInput;
  const instruction = input.instruction.toLowerCase();
  const doc: StoreDocument = JSON.parse(JSON.stringify(input.document));

  if (instruction.includes("premium") || instruction.includes("luxury")) {
    doc.theme.style = "premium";
    doc.theme.headingFont = "Playfair Display";
    doc.theme.primaryColor = "#0f172a";
    doc.theme.accentColor = "#eab308";
  }
  if (instruction.includes("bold") || instruction.includes("aggressive")) {
    doc.theme.style = "bold";
    doc.theme.primaryColor = "#dc2626";
    doc.theme.accentColor = "#f97316";
  }
  if (instruction.includes("minimal") || instruction.includes("simple") || instruction.includes("clean")) {
    doc.theme.style = "minimal";
    doc.theme.primaryColor = "#111827";
    doc.theme.accentColor = "#111827";
  }
  if (instruction.includes("playful") || instruction.includes("fun")) {
    doc.theme.style = "playful";
    doc.theme.primaryColor = "#ec4899";
    doc.theme.accentColor = "#facc15";
  }

  for (const [word, hex] of Object.entries(COLOR_WORDS)) {
    if (instruction.includes(word)) {
      doc.theme.primaryColor = hex;
    }
  }

  if (instruction.includes("short")) {
    const hero = doc.sections.find((s) => s.type === "hero");
    if (hero && hero.type === "hero") {
      hero.settings.subtitle = hero.settings.subtitle.split(" ").slice(0, 8).join(" ");
    }
  }

  if (instruction.includes("faq") && instruction.includes("add")) {
    const hasFaq = doc.sections.some((s) => s.type === "faq");
    if (!hasFaq) {
      doc.sections.push({
        id: `faq-${Date.now()}`,
        type: "faq",
        order: doc.sections.length,
        hidden: false,
        settings: { title: "Frequently asked questions", items: [{ question: "New question", answer: "New answer" }] },
      });
    }
  }

  return doc satisfies StoreDocument;
});

function buildPrompt(input: StoreEditInput) {
  return `Here is the current store document as JSON:
${JSON.stringify(input.document)}

Apply this instruction from the store owner: "${input.instruction}"

Return the FULL updated store document as JSON, with the same shape, applying only the requested change. Do not remove sections unless explicitly asked. Never invent reviews, testimonials, certifications or sales figures.`;
}

export async function generateStoreEdit(input: StoreEditInput): Promise<StoreDocument> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "store_ai_edit",
    schema: storeDocumentSchema,
    system:
      "You edit ecommerce store JSON documents based on natural-language instructions. You only ever return a modified version of the same JSON structure — never code, never prose outside the JSON.",
    prompt: buildPrompt(input),
    input,
  });
}
