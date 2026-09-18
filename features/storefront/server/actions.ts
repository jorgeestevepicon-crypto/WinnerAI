"use server";

import { prisma } from "@/lib/db/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { integrations, env } from "@/config/env";
import { getPublicStore } from "@/features/storefront/server/queries";

const MAX_QUANTITY = 20;

export async function createStoreCheckoutSession(storeId: string, quantity: number) {
  const stripe = getStripeClient();
  if (!stripe || !integrations.stripeConfigured) {
    return { success: false as const, error: "Checkout isn't configured for this store yet." };
  }

  const qty = Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);

  const store = await getPublicStore(storeId);
  if (!store || !store.product) {
    return { success: false as const, error: "This store isn't available right now." };
  }
  if (!store.product.price || store.product.price <= 0) {
    return { success: false as const, error: "This product doesn't have a price set yet." };
  }

  const brand = (store.brand as { name?: string } | null)?.name || store.name;
  const image = store.product.images[0];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: store.product.currency.toLowerCase(),
          product_data: {
            name: `${brand} — ${store.product.title}`,
            images: image ? [image] : undefined,
          },
          unit_amount: Math.round(store.product.price * 100),
        },
        quantity: qty,
      },
    ],
    success_url: `${env.appUrl}/s/${storeId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/s/${storeId}`,
    metadata: {
      type: "store_order",
      storeId,
      userId: store.userId,
      productTitle: store.product.title,
      quantity: String(qty),
      unitPrice: String(store.product.price),
      currency: store.product.currency,
    },
  });

  if (!session.url) return { success: false as const, error: "Stripe did not return a checkout URL." };
  return { success: true as const, url: session.url };
}

export async function getStoreOrderBySessionId(storeId: string, sessionId: string) {
  return prisma.storeOrder.findFirst({ where: { storeId, stripeCheckoutSessionId: sessionId } });
}
