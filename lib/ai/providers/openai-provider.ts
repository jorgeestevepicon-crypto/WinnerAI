import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { AIProviderError, type AIProvider, type GenerateObjectParams } from "@/lib/ai/types";

export const openAIProvider: AIProvider = {
  id: "openai",
  async generateObject<T>(params: GenerateObjectParams<T>): Promise<T> {
    if (!env.ai.apiKey) {
      throw new AIProviderError("OpenAI is not configured (AI_API_KEY is missing).", "openai");
    }

    const jsonSchema = z.toJSONSchema(params.schema as z.ZodType);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: env.ai.model,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `${params.system}\n\nRespond with ONLY a single JSON object matching this JSON Schema, no prose, no markdown fences:\n${JSON.stringify(jsonSchema)}`,
          },
          { role: "user", content: params.prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`OpenAI request failed (${response.status}): ${text}`, "openai");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new AIProviderError("OpenAI response did not include message content.", "openai");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch (error) {
      throw new AIProviderError("OpenAI response was not valid JSON.", "openai", error);
    }

    const result = params.schema.safeParse(parsedJson);
    if (!result.success) {
      throw new AIProviderError(
        `OpenAI response did not match the expected schema: ${result.error.message}`,
        "openai",
        result.error
      );
    }

    return result.data;
  },
};
