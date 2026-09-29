import { z } from "zod";

export const addManualProductSchema = z.object({
  urlOrId: z.string().min(3, "Enter an AliExpress product URL or item ID"),
  discoveryOrigin: z.enum(["TIKTOK", "INSTAGRAM", "META_ADS", "OTHER"]),
  discoveryUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
export type AddManualProductInput = z.infer<typeof addManualProductSchema>;

export const discoverCandidatesSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
});
export type DiscoverCandidatesInput = z.infer<typeof discoverCandidatesSchema>;

export const manualSignalSchema = z.object({
  wowEffect: z.coerce.number().int().min(1).max(5).optional(),
  foundInPhysicalStores: z.boolean().optional(),
  competitionLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  googleTrendsManual: z.enum(["RISING", "STABLE", "FALLING"]).optional(),
  notes: z.string().max(2000).optional(),
});
export type ManualSignalInput = z.infer<typeof manualSignalSchema>;

export const adTestSchema = z.object({
  name: z.string().max(120).optional(),
  platform: z.string().max(60).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  dailyBudget: z.coerce.number().min(0).optional(),
  totalSpend: z.coerce.number().min(0).optional(),
  impressions: z.coerce.number().int().min(0).optional(),
  clicks: z.coerce.number().int().min(0).optional(),
  addToCarts: z.coerce.number().int().min(0).optional(),
  purchases: z.coerce.number().int().min(0).optional(),
  revenue: z.coerce.number().min(0).optional(),
  currency: z.string().default("USD"),
  notes: z.string().max(2000).optional(),
});
export type AdTestInput = z.infer<typeof adTestSchema>;

export const checklistSchema = z.object({
  sampleOrdered: z.boolean(),
  sampleReceived: z.boolean(),
  qualityOk: z.boolean(),
  actualShippingDays: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});
export type ChecklistInput = z.infer<typeof checklistSchema>;

export const setWinningStatusSchema = z.object({
  status: z.enum(["CANDIDATE", "IN_TEST", "WINNER", "DISCARDED"]),
});
export type SetWinningStatusInput = z.infer<typeof setWinningStatusSchema>;

export const scoreConfigSchema = z.object({
  weightMargin: z.coerce.number().min(0).max(1),
  weightPriceRangeFit: z.coerce.number().min(0).max(1),
  weightDemand: z.coerce.number().min(0).max(1),
  weightDemandGrowth: z.coerce.number().min(0).max(1),
  weightProviderQuality: z.coerce.number().min(0).max(1),
  weightLogistics: z.coerce.number().min(0).max(1),
  weightWowEffect: z.coerce.number().min(0).max(1),
  weightPhysicalStores: z.coerce.number().min(0).max(1),
  weightCompetitionLevel: z.coerce.number().min(0).max(1),
  weightGoogleTrends: z.coerce.number().min(0).max(1),
  marginTargetMultiplier: z.coerce.number().min(1).max(20),
  idealPriceMin: z.coerce.number().min(0),
  idealPriceMax: z.coerce.number().min(0),
  priceCurrency: z.string().min(1).max(10),
  targetCountry: z.string().min(2).max(2),
  maxIdealWeightGrams: z.coerce.number().min(1),
  minRoasForWinner: z.coerce.number().min(0),
});
export type ScoreConfigInput = z.infer<typeof scoreConfigSchema>;

export const winningProductFilterSchema = z.object({
  status: z.enum(["CANDIDATE", "IN_TEST", "WINNER", "DISCARDED"]).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  minMargin: z.coerce.number().optional(),
  minOrders: z.coerce.number().optional(),
  sortBy: z.enum(["score", "status", "margin", "orders", "createdAt"]).default("score"),
});
export type WinningProductFilterInput = z.infer<typeof winningProductFilterSchema>;
