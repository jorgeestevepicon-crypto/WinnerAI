import { z } from "zod";

export const onboardingSchema = z.object({
  sellingWhat: z.string().min(2, "Tell us what you'd like to sell"),
  country: z.string().min(2, "Select a country"),
  hasShopify: z.enum(["yes", "no", "not-sure"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  marketingFocus: z.array(z.enum(["organic", "paid-ads", "influencers", "email", "seo"])).min(1, "Pick at least one"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
