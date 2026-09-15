import "server-only";
import Stripe from "stripe";
import { env } from "@/config/env";

let stripeClient: Stripe | null = null;

/** Returns null when Stripe isn't configured — callers must handle that case explicitly. */
export function getStripeClient(): Stripe | null {
  if (!env.stripe.secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey, { apiVersion: "2026-08-26.dahlia" });
  }
  return stripeClient;
}
