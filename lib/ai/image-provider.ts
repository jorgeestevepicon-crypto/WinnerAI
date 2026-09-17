import "server-only";
import { env } from "@/config/env";
import { AIProviderError, type AIImageProvider, type AIImageParams, type AIImageResult } from "@/lib/ai/types";

function escapeXml(text: string) {
  return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

const demoImageProvider: AIImageProvider = {
  id: "demo",
  async generateImage(params: AIImageParams): Promise<AIImageResult> {
    const lines = wrapText(params.label, 28);
    const lineHeight = 28;
    const startY = params.height / 2 - (lines.length * lineHeight) / 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4338ca"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      ${lines
        .map(
          (line, i) =>
            `<text x="50%" y="${startY + i * lineHeight}" font-family="sans-serif" font-size="22" fill="white" text-anchor="middle" font-weight="600">${escapeXml(line)}</text>`
        )
        .join("\n")}
      <text x="50%" y="${params.height - 20}" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.75)" text-anchor="middle">AI Generated — Demo placeholder</text>
    </svg>`;

    const base64 = Buffer.from(svg).toString("base64");
    return { url: `data:image/svg+xml;base64,${base64}`, provider: "demo" };
  },
};

const openAIImageProvider: AIImageProvider = {
  id: "openai",
  async generateImage(params: AIImageParams): Promise<AIImageResult> {
    if (!env.ai.imageApiKey) {
      throw new AIProviderError("OpenAI image generation is not configured (AI_IMAGE_API_KEY is missing).", "openai");
    }

    const size = params.width === params.height ? "1024x1024" : params.width > params.height ? "1792x1024" : "1024x1792";

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ai.imageApiKey}`,
      },
      body: JSON.stringify({ model: "dall-e-3", prompt: params.prompt, size, n: 1 }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`OpenAI image request failed (${response.status}): ${text}`, "openai");
    }

    const data = await response.json();
    const url = data.data?.[0]?.url;
    if (typeof url !== "string") {
      throw new AIProviderError("OpenAI image response did not include a URL.", "openai");
    }

    return { url, provider: "openai" };
  },
};

export function getAIImageProvider(options?: { forceDemo?: boolean }): AIImageProvider {
  if (options?.forceDemo) return demoImageProvider;
  if (env.ai.imageProvider === "openai" && env.ai.imageApiKey) return openAIImageProvider;
  return demoImageProvider;
}
