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
  | "store_seo"
  | "product_search_terms";

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
  /** Higher quality costs more per generation on real providers. Defaults to the provider's own default. */
  quality?: "low" | "medium" | "high";
  /** Isolate the subject on a transparent background — for marks/logos, not photo scenes. Ignored by providers that don't support it. */
  transparentBackground?: boolean;
  /** A real photo of the actual product to use as the basis for the generated image (image-to-image editing), instead of generating a scene from text alone. Ignored by providers that don't support editing. */
  referenceImageUrl?: string;
}

export interface AIImageResult {
  url: string;
  provider: "demo" | "openai";
}

export interface AIImageProvider {
  id: "demo" | "openai";
  generateImage(params: AIImageParams): Promise<AIImageResult>;
}

export interface AIVideoStartParams {
  /** What the clip should show. */
  prompt: string;
  /** Optional seed image (e.g. the ad variant's generated image) to animate. */
  imageUrl?: string;
  /** Clip length in seconds. Providers may round to their supported durations. */
  durationSeconds: number;
  /** "portrait" for TikTok/Reels/Stories, "landscape" for feed/YouTube. */
  orientation: "portrait" | "landscape" | "square";
}

export type AIVideoStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface AIVideoProvider {
  id: "runway";
  /** Kicks off an async generation job and returns immediately with its id. */
  startVideo(params: AIVideoStartParams): Promise<{ taskId: string }>;
  /** Polls a previously started job. */
  checkVideo(taskId: string): Promise<{ status: AIVideoStatus; videoUrl?: string; error?: string }>;
}
