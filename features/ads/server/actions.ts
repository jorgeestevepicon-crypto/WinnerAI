"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { runAIJob } from "@/lib/ai/job-runner";
import { generateAdCopy } from "@/lib/ai/services/ad-copy";
import { generateVideoConcept } from "@/lib/ai/services/video-concept";
import { getAIImageProvider } from "@/lib/ai/image-provider";
import { getAIVideoProvider } from "@/lib/ai/video-provider";
import { integrations } from "@/config/env";
import { newCampaignSchema, generateAdsInputSchema, AD_FORMATS } from "@/features/ads/schemas";

export async function createCampaign(input: unknown) {
  const user = await requireUser();
  const parsed = newCampaignSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, userId: user.id } });
  if (!product) return { success: false as const, error: "Product not found" };

  const campaign = await prisma.adCampaign.create({
    data: {
      userId: user.id,
      productId: product.id,
      name: parsed.data.name,
      platform: parsed.data.platform,
      objective: parsed.data.objective,
      audience: parsed.data.audience as unknown as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  });

  revalidatePath("/ads");
  return { success: true as const, campaignId: campaign.id };
}

export async function generateAdCreative(input: unknown) {
  const user = await requireUser();
  const parsed = generateAdsInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const campaign = await prisma.adCampaign.findFirst({
    where: { id: parsed.data.campaignId, userId: user.id },
    include: { product: { include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  if (!campaign) return { success: false as const, error: "Campaign not found" };

  const analysis = campaign.product?.analyses[0];
  const audience = campaign.audience as { ageRange: string; gender: string; country: string; interests: string[]; awarenessLevel: string };

  const result = await runAIJob({
    userId: user.id,
    type: parsed.data.variantCount > 3 ? "AD_BULK" : "AD_COPY",
    input: { campaignId: campaign.id, style: parsed.data.style, format: parsed.data.format, variantCount: parsed.data.variantCount },
    run: () =>
      generateAdCopy({
        productTitle: campaign.product!.title,
        productDescription: campaign.product!.description,
        category: campaign.product!.category,
        price: campaign.product!.price,
        currency: campaign.product!.currency,
        style: parsed.data.style,
        platform: campaign.platform,
        objective: campaign.objective,
        audience,
        marketingAngles: analysis?.marketingAngles,
        advantages: analysis?.advantages,
        objections: analysis?.objections,
        variantCount: parsed.data.variantCount,
      }),
  });

  if (!result.success) return { success: false as const, error: result.error };

  const creative = await prisma.adCreative.create({
    data: {
      campaignId: campaign.id,
      style: parsed.data.style,
      format: parsed.data.format,
      variants: {
        create: result.output.variants.map((v) => ({
          label: v.label,
          angle: v.angle,
          hook: v.hook,
          primaryText: v.primaryText,
          headline: v.headline,
          description: v.description,
          cta: v.cta,
          imagePrompt: v.imagePrompt,
        })),
      },
    },
  });

  await prisma.adCampaign.update({ where: { id: campaign.id }, data: { status: "READY" } });
  await logActivity({ userId: user.id, action: "ad_generated", entityType: "ad_creative", entityId: creative.id });

  revalidatePath(`/ads/${campaign.id}`);
  return { success: true as const, creativeId: creative.id };
}

export async function generateVariantImage(variantId: string) {
  const user = await requireUser();
  const variant = await prisma.adVariant.findUnique({
    where: { id: variantId },
    include: { creative: { include: { campaign: true } } },
  });
  if (!variant || variant.creative.campaign.userId !== user.id) return { success: false as const, error: "Not found" };

  const format = AD_FORMATS[variant.creative.format as keyof typeof AD_FORMATS] ?? AD_FORMATS.instagram_feed;
  const imageProvider = getAIImageProvider();

  try {
    const image = await imageProvider.generateImage({
      prompt: variant.imagePrompt ?? `Advertisement for the product, ${variant.creative.style} style.`,
      width: format.width,
      height: format.height,
      label: variant.headline ?? variant.hook ?? "Ad creative",
    });
    await prisma.adVariant.update({ where: { id: variantId }, data: { imageUrl: image.url } });
    revalidatePath(`/ads/${variant.creative.campaignId}`);
    return { success: true as const, url: image.url };
  } catch {
    return { success: false as const, error: "Image generation failed" };
  }
}

const PORTRAIT_FORMATS = new Set(["instagram_story", "instagram_reel", "tiktok"]);
const SQUARE_FORMATS = new Set(["instagram_feed"]);

function orientationForFormat(format: string): "portrait" | "landscape" | "square" {
  if (PORTRAIT_FORMATS.has(format)) return "portrait";
  if (SQUARE_FORMATS.has(format)) return "square";
  return "landscape";
}

export async function generateVariantVideo(variantId: string) {
  const user = await requireUser();
  const variant = await prisma.adVariant.findUnique({
    where: { id: variantId },
    include: { creative: { include: { campaign: true } } },
  });
  if (!variant || variant.creative.campaign.userId !== user.id) return { success: false as const, error: "Not found" };

  const provider = getAIVideoProvider();
  if (!provider || !integrations.videoConfigured) {
    return { success: false as const, error: "Video generation isn't configured in this environment. Set AI_VIDEO_PROVIDER and AI_VIDEO_API_KEY." };
  }

  try {
    const { taskId } = await provider.startVideo({
      prompt: variant.imagePrompt ?? `Short advertisement video for the product, ${variant.creative.style} style. ${variant.hook ?? ""}`,
      imageUrl: variant.imageUrl ?? undefined,
      durationSeconds: 8,
      orientation: orientationForFormat(variant.creative.format),
    });

    await prisma.adVariant.update({
      where: { id: variantId },
      data: { videoTaskId: taskId, videoStatus: "PROCESSING", videoUrl: null, videoError: null },
    });
    revalidatePath(`/ads/${variant.creative.campaignId}`);
    return { success: true as const, taskId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed to start";
    await prisma.adVariant.update({ where: { id: variantId }, data: { videoStatus: "FAILED", videoError: message } });
    return { success: false as const, error: message };
  }
}

export async function checkVariantVideoStatus(variantId: string) {
  const user = await requireUser();
  const variant = await prisma.adVariant.findUnique({
    where: { id: variantId },
    include: { creative: { include: { campaign: true } } },
  });
  if (!variant || variant.creative.campaign.userId !== user.id) return { success: false as const, error: "Not found" };
  if (!variant.videoTaskId) return { success: false as const, error: "No video generation in progress" };

  const provider = getAIVideoProvider();
  if (!provider) return { success: false as const, error: "Video generation isn't configured in this environment." };

  try {
    const result = await provider.checkVideo(variant.videoTaskId);
    await prisma.adVariant.update({
      where: { id: variantId },
      data: { videoStatus: result.status, videoUrl: result.videoUrl ?? null, videoError: result.error ?? null },
    });
    if (result.status === "COMPLETED") revalidatePath(`/ads/${variant.creative.campaignId}`);
    return { success: true as const, status: result.status, videoUrl: result.videoUrl, error: result.error };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status check failed";
    return { success: false as const, error: message };
  }
}

export async function toggleFavoriteCreative(creativeId: string) {
  const user = await requireUser();
  const creative = await prisma.adCreative.findFirst({
    where: { id: creativeId, campaign: { userId: user.id } },
  });
  if (!creative) return { success: false as const, error: "Not found" };

  await prisma.adCreative.update({ where: { id: creativeId }, data: { favorite: !creative.favorite } });
  revalidatePath("/ads/library");
  return { success: true as const, favorite: !creative.favorite };
}

export async function duplicateCreative(creativeId: string) {
  const user = await requireUser();
  const creative = await prisma.adCreative.findFirst({
    where: { id: creativeId, campaign: { userId: user.id } },
    include: { variants: true },
  });
  if (!creative) return { success: false as const, error: "Not found" };

  const copy = await prisma.adCreative.create({
    data: {
      campaignId: creative.campaignId,
      style: creative.style,
      format: creative.format,
      variants: {
        create: creative.variants.map((v) => ({
          label: v.label,
          angle: v.angle,
          hook: v.hook,
          primaryText: v.primaryText,
          headline: v.headline,
          description: v.description,
          cta: v.cta,
          imageUrl: v.imageUrl,
          imagePrompt: v.imagePrompt,
        })),
      },
    },
  });

  revalidatePath(`/ads/${creative.campaignId}`);
  revalidatePath("/ads/library");
  return { success: true as const, creativeId: copy.id };
}

export async function deleteCreative(creativeId: string) {
  const user = await requireUser();
  const creative = await prisma.adCreative.findFirst({ where: { id: creativeId, campaign: { userId: user.id } } });
  if (!creative) return { success: false as const, error: "Not found" };

  await prisma.adCreative.update({ where: { id: creativeId }, data: { deletedAt: new Date() } });
  revalidatePath(`/ads/${creative.campaignId}`);
  revalidatePath("/ads/library");
  return { success: true as const };
}

export async function generateCampaignVideoConcept(campaignId: string) {
  const user = await requireUser();
  const campaign = await prisma.adCampaign.findFirst({
    where: { id: campaignId, userId: user.id },
    include: { product: { include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  if (!campaign || !campaign.product) return { success: false as const, error: "Campaign not found" };

  const analysis = campaign.product.analyses[0];

  const result = await runAIJob({
    userId: user.id,
    type: "VIDEO_STORYBOARD",
    input: { campaignId },
    run: () =>
      generateVideoConcept({
        productTitle: campaign.product!.title,
        productDescription: campaign.product!.description,
        style: "UGC",
        marketingAngles: analysis?.marketingAngles,
        advantages: analysis?.advantages,
      }),
  });

  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, concept: result.output };
}
