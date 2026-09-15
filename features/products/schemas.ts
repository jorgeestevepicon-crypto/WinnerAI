import { z } from "zod";

export const productFilterSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minMargin: z.coerce.number().optional(),
  minTrend: z.coerce.number().optional(),
  maxCompetition: z.coerce.number().optional(),
  maxSaturation: z.coerce.number().optional(),
  savedOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(["winningScore", "price", "margin", "trend", "createdAt"]).default("winningScore"),
});
export type ProductFilterInput = z.infer<typeof productFilterSchema>;

export const discoverySchema = z.object({
  sourceId: z.string().default("demo"),
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(18),
});
export type DiscoveryInput = z.infer<typeof discoverySchema>;
