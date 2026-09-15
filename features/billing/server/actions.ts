"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { getStripeClient } from "@/lib/stripe/client";
import { integrations, env } from "@/config/env";
import { getPlan } from "@/features/billing/plans";
import type { SubscriptionPlan } from "@prisma/client";

export async function createCheckoutSession(plan: SubscriptionPlan) {
  const user = await requireUser();
  const stripe = getStripeClient();

  if (!stripe || !integrations.stripeConfigured) {
    return { success: false as const, error: "Billing is not configured in this environment. Set STRIPE_SECRET_KEY to enable it." };
  }

  const planDef = getPlan(plan);
  if (!planDef.priceId) {
    return { success: false as const, error: `No Stripe price configured for the ${planDef.name} plan.` };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { subscription: true } });

  let customerId = dbUser.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: dbUser.email, name: dbUser.name ?? undefined, metadata: { userId: user.id } });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planDef.priceId, quantity: 1 }],
    success_url: `${env.appUrl}/billing?checkout=success`,
    cancel_url: `${env.appUrl}/billing?checkout=cancelled`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });

  if (!session.url) return { success: false as const, error: "Stripe did not return a checkout URL." };
  return { success: true as const, url: session.url };
}

export async function createPortalSession() {
  const user = await requireUser();
  const stripe = getStripeClient();

  if (!stripe || !integrations.stripeConfigured) {
    return { success: false as const, error: "Billing is not configured in this environment." };
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!subscription?.stripeCustomerId) {
    return { success: false as const, error: "No billing account found. Subscribe to a plan first." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.appUrl}/billing`,
  });

  return { success: true as const, url: session.url };
}
