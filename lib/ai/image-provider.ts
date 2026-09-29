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

/**
 * OpenAI retired `dall-e-3` from the images API at some point after this
 * was first written (it started returning "model does not exist" in
 * production). `gpt-image-1` is its current successor at the time of this
 * fix — but OpenAI has been known to require the account's organization to
 * complete ID verification (platform.openai.com → Settings → Organization
 * → Verifications) before an API key can use it, so a 403 mentioning
 * verification here is an account setting, not a bug. Unlike dall-e-3,
 * gpt-image-1 doesn't support `response_format` and always returns base64
 * image data (`b64_json`) rather than a hosted URL, which this code turns
 * into a data: URI — `persistRemoteAsset` uploads that to our own bucket
 * just like it would a hosted link. If OpenAI's image API has moved on
 * again by the time you read this, check https://platform.openai.com/docs
 * and adjust the model name / response parsing below.
 */
function parseImageResponse(data: { data?: Array<{ url?: string; b64_json?: string }> }): AIImageResult {
  const first = data.data?.[0];
  if (typeof first?.url === "string") {
    return { url: first.url, provider: "openai" };
  }
  if (typeof first?.b64_json === "string") {
    return { url: `data:image/png;base64,${first.b64_json}`, provider: "openai" };
  }
  throw new AIProviderError("OpenAI image response did not include image data.", "openai");
}

/**
 * Image-to-image editing (via OpenAI's /v1/images/edits) — used when we have
 * a real photo of the actual product (e.g. from AliExpress) and want a
 * professional studio version of THAT product, not a from-scratch scene
 * that merely resembles it. Untested against a live account: the edits
 * endpoint's accepted input formats/size limits for gpt-image-1 haven't
 * been verified here — if it rejects the downloaded photo's format, that's
 * the first thing to check.
 */
async function editImage(params: AIImageParams, size: string): Promise<AIImageResult> {
  const sourceResponse = await fetch(params.referenceImageUrl!);
  if (!sourceResponse.ok) {
    throw new AIProviderError(`Could not download the reference image (${sourceResponse.status}) to edit it.`, "openai");
  }
  const sourceBlob = await sourceResponse.blob();

  const form = new FormData();
  form.set("model", "gpt-image-1");
  form.set("prompt", params.prompt);
  form.set("size", size);
  form.set("n", "1");
  if (params.quality) form.set("quality", params.quality);
  form.set("image", sourceBlob, "reference.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.ai.imageApiKey}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AIProviderError(`OpenAI image edit request failed (${response.status}): ${text}`, "openai");
  }

  return parseImageResponse(await response.json());
}

const openAIImageProvider: AIImageProvider = {
  id: "openai",
  async generateImage(params: AIImageParams): Promise<AIImageResult> {
    if (!env.ai.imageApiKey) {
      throw new AIProviderError("OpenAI image generation is not configured (AI_IMAGE_API_KEY is missing).", "openai");
    }

    const size = params.width === params.height ? "1024x1024" : params.width > params.height ? "1536x1024" : "1024x1536";

    if (params.referenceImageUrl) {
      return editImage(params, size);
    }

    const body: Record<string, unknown> = { model: "gpt-image-1", prompt: params.prompt, size, n: 1 };
    if (params.quality) body.quality = params.quality;
    if (params.transparentBackground) body.background = "transparent";

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ai.imageApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AIProviderError(`OpenAI image request failed (${response.status}): ${text}`, "openai");
    }

    return parseImageResponse(await response.json());
  },
};

export function getAIImageProvider(options?: { forceDemo?: boolean }): AIImageProvider {
  if (options?.forceDemo) return demoImageProvider;
  if (env.ai.imageProvider === "openai" && env.ai.imageApiKey) return openAIImageProvider;
  return demoImageProvider;
}
