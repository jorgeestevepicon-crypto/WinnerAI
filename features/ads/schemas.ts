import { z } from "zod";

export const adPlatformSchema = z.enum(["META", "FACEBOOK", "INSTAGRAM", "TIKTOK", "GOOGLE", "PINTEREST", "YOUTUBE"]);
export const adObjectiveSchema = z.enum(["SALES", "CONVERSIONS", "TRAFFIC", "LEADS", "ENGAGEMENT", "PRODUCT_AWARENESS"]);
export const adStyleSchema = z.enum([
  "UGC",
  "Premium",
  "Minimal",
  "Lifestyle",
  "Problem/Solution",
  "Before/After",
  "Viral",
  "Emotional",
  "Product-focused",
  "Direct Response",
]);
export type AdStyle = z.infer<typeof adStyleSchema>;

export const adFormatSchema = z.enum([
  "instagram_feed",
  "instagram_story",
  "instagram_reel",
  "facebook_feed",
  "tiktok",
  "pinterest",
  "youtube_thumbnail",
]);
export type AdFormat = z.infer<typeof adFormatSchema>;

export const AD_FORMATS: Record<AdFormat, { label: string; width: number; height: number }> = {
  instagram_feed: { label: "Instagram Feed", width: 1080, height: 1080 },
  instagram_story: { label: "Instagram Story", width: 1080, height: 1920 },
  instagram_reel: { label: "Instagram Reel", width: 1080, height: 1920 },
  facebook_feed: { label: "Facebook Feed", width: 1200, height: 628 },
  tiktok: { label: "TikTok", width: 1080, height: 1920 },
  pinterest: { label: "Pinterest", width: 1000, height: 1500 },
  youtube_thumbnail: { label: "YouTube Thumbnail", width: 1280, height: 720 },
};

export const adAudienceSchema = z.object({
  ageRange: z.string(),
  gender: z.enum(["all", "male", "female"]),
  country: z.string(),
  interests: z.array(z.string()),
  awarenessLevel: z.enum(["unaware", "problem-aware", "solution-aware", "product-aware", "most-aware"]),
});
export type AdAudience = z.infer<typeof adAudienceSchema>;

export const newCampaignSchema = z.object({
  productId: z.string(),
  name: z.string().min(2),
  platform: adPlatformSchema,
  objective: adObjectiveSchema,
  audience: adAudienceSchema,
});
export type NewCampaignInput = z.infer<typeof newCampaignSchema>;

export const generateAdsInputSchema = z.object({
  campaignId: z.string(),
  style: adStyleSchema,
  format: adFormatSchema,
  variantCount: z.number().min(1).max(10).default(3),
});
export type GenerateAdsInput = z.infer<typeof generateAdsInputSchema>;
