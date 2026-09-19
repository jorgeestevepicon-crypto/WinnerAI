import "server-only";
import { env } from "@/config/env";
import { AIProviderError, type AIVideoProvider, type AIVideoStartParams } from "@/lib/ai/types";

/**
 * Runway ML's text/image-to-video API — the endpoints, field names and
 * required API version header below match their documented Gen-3/Gen-4
 * generation API at the time this was written. Runway (like every video-gen
 * provider) revises its API more often than a text/chat API does, so before
 * flipping AI_VIDEO_PROVIDER=runway in production, verify this against
 * https://docs.dev.runwayml.com and adjust field names/endpoints if they've
 * changed — this integration has not been exercised against a real Runway
 * account in this environment.
 */
const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";

function ratioFor(orientation: AIVideoStartParams["orientation"]): string {
  if (orientation === "portrait") return "768:1280";
  if (orientation === "square") return "1024:1024";
  return "1280:768";
}

const runwayVideoProvider: AIVideoProvider = {
  id: "runway",

  async startVideo(params: AIVideoStartParams) {
    if (!env.video.apiKey) {
      throw new AIProviderError("Runway is not configured (AI_VIDEO_API_KEY is missing).", "runway");
    }

    const endpoint = params.imageUrl ? "/image_to_video" : "/text_to_video";
    const body: Record<string, unknown> = {
      model: "gen3a_turbo",
      promptText: params.prompt,
      ratio: ratioFor(params.orientation),
      duration: Math.min(Math.max(Math.round(params.durationSeconds), 5), 10),
    };
    if (params.imageUrl) body.promptImage = params.imageUrl;

    const response = await fetch(`${RUNWAY_API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.video.apiKey}`,
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`Runway request failed (${response.status}): ${text}`, "runway");
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) throw new AIProviderError("Runway did not return a task id.", "runway");
    return { taskId: data.id };
  },

  async checkVideo(taskId: string) {
    if (!env.video.apiKey) {
      throw new AIProviderError("Runway is not configured (AI_VIDEO_API_KEY is missing).", "runway");
    }

    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${env.video.apiKey}`,
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`Runway status check failed (${response.status}): ${text}`, "runway");
    }

    const data = (await response.json()) as { status?: string; output?: string[]; failure?: string };

    if (data.status === "SUCCEEDED") {
      const videoUrl = data.output?.[0];
      if (!videoUrl) return { status: "FAILED" as const, error: "Runway reported success but returned no video URL." };
      return { status: "COMPLETED" as const, videoUrl };
    }
    if (data.status === "FAILED") {
      return { status: "FAILED" as const, error: data.failure ?? "Video generation failed." };
    }
    return { status: "PROCESSING" as const };
  },
};

export function getAIVideoProvider(): AIVideoProvider | null {
  if (env.video.provider === "runway" && env.video.apiKey) return runwayVideoProvider;
  return null;
}
