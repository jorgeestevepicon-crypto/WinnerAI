import "server-only";
import { env } from "@/config/env";
import type { AIProvider } from "@/lib/ai/types";
import { demoAIProvider } from "@/lib/ai/providers/demo-provider";
import { openAIProvider } from "@/lib/ai/providers/openai-provider";
import { anthropicProvider } from "@/lib/ai/providers/anthropic-provider";

export function getAIProvider(): AIProvider {
  if (env.ai.provider === "openai" && env.ai.apiKey) return openAIProvider;
  if (env.ai.provider === "anthropic" && env.ai.apiKey) return anthropicProvider;
  return demoAIProvider;
}

export { registerDemoGenerator } from "@/lib/ai/providers/demo-provider";
export * from "@/lib/ai/types";
