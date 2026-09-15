import "server-only";
import { prisma } from "@/lib/db/prisma";
import { decryptShopifyToken } from "@/lib/shopify/crypto";
import { ShopifyClient } from "@/lib/shopify/client";
import { integrations } from "@/config/env";
import type { AnalyticsAdapter, AnalyticsSnapshot } from "@/lib/analytics/adapters/types";

export const shopifyAnalyticsAdapter: AnalyticsAdapter = {
  id: "shopify",
  label: "Shopify",
  get configured() {
    return integrations.shopifyConfigured;
  },
  disabledReason: "Requires Shopify API credentials (see the Shopify page) and a connected store.",

  async fetchSnapshots({ userId, sinceDays }): Promise<AnalyticsSnapshot[]> {
    const connection = await prisma.shopifyConnection.findFirst({ where: { userId, status: "CONNECTED" } });
    if (!connection?.accessTokenEncrypted) return [];

    const accessToken = decryptShopifyToken(connection.accessTokenEncrypted);
    const client = new ShopifyClient(connection.shopDomain, accessToken);

    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const orders = await client.listOrders({ createdAtMin: since.toISOString() });

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const day = order.created_at.slice(0, 10);
      const entry = byDay.get(day) ?? { revenue: 0, orders: 0 };
      entry.revenue += Number(order.total_price) || 0;
      entry.orders += 1;
      byDay.set(day, entry);
    }

    return Array.from(byDay.entries()).map(([day, values]) => ({
      date: new Date(day),
      revenue: values.revenue,
      orders: values.orders,
    }));
  },
};
