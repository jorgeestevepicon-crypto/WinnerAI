import { z } from "zod";
import { getAIProvider, registerDemoGenerator } from "@/lib/ai";

export const storyboardSceneSchema = z.object({
  stage: z.enum(["hook", "problem", "product_intro", "solution", "benefits", "cta"]),
  durationSeconds: z.number().positive(),
  onScreenText: z.string(),
  voiceover: z.string(),
  visualDirection: z.string(),
});
export type StoryboardScene = z.infer<typeof storyboardSceneSchema>;

export const videoConceptSchema = z.object({
  title: z.string(),
  concept: z.string(),
  totalDurationSeconds: z.number().positive(),
  cta: z.string(),
  scenes: z.array(storyboardSceneSchema).min(4),
});
export type VideoConceptOutput = z.infer<typeof videoConceptSchema>;

export interface VideoConceptInput {
  productTitle: string;
  productDescription: string | null;
  style: string;
  marketingAngles?: string[];
  advantages?: string[];
}

registerDemoGenerator("video_concept", (rawInput) => {
  const input = rawInput as VideoConceptInput;
  const advantage = (input.advantages ?? ["it just works better"])[0];
  const angle = (input.marketingAngles ?? ["a smarter everyday choice"])[0];

  const scenes: StoryboardScene[] = [
    {
      stage: "hook",
      durationSeconds: 3,
      onScreenText: "Wait... this actually works?",
      voiceover: `I didn't expect ${input.productTitle} to be this useful.`,
      visualDirection: "Close-up, handheld, natural lighting, direct address to camera.",
    },
    {
      stage: "problem",
      durationSeconds: 4,
      onScreenText: "The everyday problem",
      voiceover: `You know that annoying moment when things just don't go smoothly?`,
      visualDirection: "Show the frustration moment in a relatable everyday setting.",
    },
    {
      stage: "product_intro",
      durationSeconds: 4,
      onScreenText: input.productTitle,
      voiceover: `That's exactly why ${input.productTitle} exists.`,
      visualDirection: "Clean product reveal shot, well-lit, simple background.",
    },
    {
      stage: "solution",
      durationSeconds: 5,
      onScreenText: angle,
      voiceover: `${advantage} — ${angle}.`,
      visualDirection: "Show the product in use, demonstrating the core benefit.",
    },
    {
      stage: "benefits",
      durationSeconds: 5,
      onScreenText: "Why people are switching",
      voiceover: `${input.productDescription ?? `${input.productTitle} is designed to fit right into your routine.`}`,
      visualDirection: "Quick cuts showing 2-3 more use cases or benefits.",
    },
    {
      stage: "cta",
      durationSeconds: 3,
      onScreenText: "Get yours today",
      voiceover: `Try ${input.productTitle} for yourself.`,
      visualDirection: "End card with product shot and clear call to action.",
    },
  ];

  return {
    title: `${input.productTitle} — ${input.style} concept`,
    concept: `A ${input.style.toLowerCase()}-style short-form video building from a relatable problem to ${input.productTitle} as the solution.`,
    totalDurationSeconds: scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
    cta: "Get yours today",
    scenes,
  } satisfies VideoConceptOutput;
});

function buildPrompt(input: VideoConceptInput) {
  return `Create a short-form video ad concept and storyboard for: ${input.productTitle}.
Description: ${input.productDescription ?? "N/A"}
Style: ${input.style}
Marketing angles: ${(input.marketingAngles ?? []).join("; ") || "N/A"}
Advantages: ${(input.advantages ?? []).join("; ") || "N/A"}

Structure the storyboard as scenes in this order: hook, problem, product_intro, solution, benefits, cta. Each scene needs a duration in seconds, on-screen text, a voiceover line, and visual direction. Never invent testimonials, certifications or medical/financial claims.`;
}

export async function generateVideoConcept(input: VideoConceptInput): Promise<VideoConceptOutput> {
  const provider = getAIProvider();
  return provider.generateObject({
    taskId: "video_concept",
    schema: videoConceptSchema,
    system: "You are a short-form video ad creative director. You never fabricate testimonials, certifications or claims.",
    prompt: buildPrompt(input),
    input,
  });
}
