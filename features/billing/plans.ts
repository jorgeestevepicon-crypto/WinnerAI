import { env } from "@/config/env";
import type { SubscriptionPlan } from "@prisma/client";

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: number;
  priceId?: string;
  description: string;
  features: string[];
  limits: {
    stores: number | "unlimited";
    campaignsPerMonth: number | "unlimited";
    bulkAdGeneration: boolean;
    growthAgent: boolean;
  };
}

export const PLANS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    description: "Explore the product finder and demo data.",
    features: ["Limited product searches", "1 store", "Basic AI copy"],
    limits: { stores: 1, campaignsPerMonth: 1, bulkAdGeneration: false, growthAgent: false },
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 29,
    priceId: env.stripe.prices.starter,
    description: "For solo operators launching their first stores.",
    features: ["Full product finder", "3 stores", "AI copy & creatives", "Shopify connection"],
    limits: { stores: 3, campaignsPerMonth: 10, bulkAdGeneration: false, growthAgent: false },
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    priceId: env.stripe.prices.pro,
    description: "For growing teams running multiple stores.",
    features: ["Everything in Starter", "Unlimited stores", "Bulk ad generation", "AI Growth Agent"],
    limits: { stores: "unlimited", campaignsPerMonth: "unlimited", bulkAdGeneration: true, growthAgent: true },
  },
  {
    id: "AGENCY",
    name: "Agency",
    price: 199,
    priceId: env.stripe.prices.agency,
    description: "For agencies managing multiple brands.",
    features: ["Everything in Pro", "Multi-user seats", "Priority support", "Advanced analytics"],
    limits: { stores: "unlimited", campaignsPerMonth: "unlimited", bulkAdGeneration: true, growthAgent: true },
  },
];

export function getPlan(id: SubscriptionPlan): PlanDefinition {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
