import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/config/env";
import { logActivity } from "@/lib/activity/log";
import type { SubscriptionPlan } from "@prisma/client";

export const dynamic = "force-dynamic";

function planFromPriceId(priceId: string | undefined): SubscriptionPlan | null {
  if (!priceId) return null;
  if (priceId === env.stripe.prices.starter) return "STARTER";
  if (priceId === env.stripe.prices.pro) return "PRO";
  if (priceId === env.stripe.prices.agency) return "AGENCY";
  return null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe || !env.stripe.webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = planFromPriceId(subscription.items.data[0]?.price.id) ?? "STARTER";
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan,
            status: "ACTIVE",
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });
        await logActivity({ userId, action: "subscription_updated", metadata: { plan, status: "ACTIVE" } });
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const plan = planFromPriceId(subscription.items.data[0]?.price.id);
        await prisma.subscription.updateMany({
          where: { userId },
          data: {
            ...(plan && { plan }),
            status: subscription.status === "active" ? "ACTIVE" : subscription.status === "past_due" ? "PAST_DUE" : "CANCELED",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });
        await logActivity({ userId, action: "subscription_updated", metadata: { status: subscription.status } });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.subscription.updateMany({
          where: { userId },
          data: { plan: "FREE", status: "CANCELED", stripeSubscriptionId: null },
        });
        await logActivity({ userId, action: "subscription_updated", metadata: { status: "CANCELED" } });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
