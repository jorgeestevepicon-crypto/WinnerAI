import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { AIProviderError, type AIProvider, type GenerateObjectParams } from "@/lib/ai/types";

function extractJson(text: string): string {
  // Claude sometimes wraps JSON in markdown fences despite instructions not to.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : text.trim();
}

export const anthropicProvider: AIProvider = {
  id: "anthropic",
  async generateObject<T>(params: GenerateObjectParams<T>): Promise<T> {
    if (!env.ai.apiKey) {
      throw new AIProviderError("Anthropic is not configured (AI_API_KEY is missing).", "anthropic");
    }

    const jsonSchema = z.toJSONSchema(params.schema as z.ZodType);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ai.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ai.model,
        max_tokens: 2048,
        system: `${params.system}\n\nRespond with ONLY a single JSON object matching this JSON Schema, no prose, no markdown fences:\n${JSON.stringify(jsonSchema)}`,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`Anthropic request failed (${response.status}): ${text}`, "anthropic");
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (typeof content !== "string") {
      throw new AIProviderError("Anthropic response did not include text content.", "anthropic");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJson(content));
    } catch (error) {
      throw new AIProviderError("Anthropic response was not valid JSON.", "anthropic", error);
    }

    const result = params.schema.safeParse(parsedJson);
    if (!result.success) {
      throw new AIProviderError(
        `Anthropic response did not match the expected schema: ${result.error.message}`,
        "anthropic",
        result.error
      );
    }

    return result.data;
  },
};
