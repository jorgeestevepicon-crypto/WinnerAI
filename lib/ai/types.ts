import type { ZodType } from "zod";

export type AITaskId =
  | "product_analysis"
  | "brand"
  | "store"
  | "copy"
  | "ad_copy"
  | "ad_variants"
  | "marketing_strategy"
  | "video_concept"
  | "storyboard"
  | "growth_recommendations"
  | "store_ai_edit"
  | "store_seo";

export interface GenerateObjectParams<T> {
  taskId: AITaskId;
  schema: ZodType<T>;
  /** System prompt for real LLM providers. Ignored by the demo provider. */
  system: string;
  /** User prompt for real LLM providers. Ignored by the demo provider. */
  prompt: string;
  /**
   * Structured input the demo provider can use to produce contextually
   * relevant mock output (e.g. reusing the real product title). Real
   * providers ignore this — everything they need is in `prompt`.
   */
  input: unknown;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export interface AIProvider {
  id: "demo" | "openai" | "anthropic";
  /** Generates a structured, schema-validated object for a given task. */
  generateObject<T>(params: GenerateObjectParams<T>): Promise<T>;
}

export interface AIImageParams {
  prompt: string;
  width: number;
  height: number;
  /** Short label describing what the image is for, shown in demo placeholders. */
  label: string;
}

export interface AIImageResult {
  url: string;
  provider: "demo" | "openai";
}

export interface AIImageProvider {
  id: "demo" | "openai";
  generateImage(params: AIImageParams): Promise<AIImageResult>;
}
