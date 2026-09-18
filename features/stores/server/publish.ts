"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { storeDocumentSchema, type StoreDocument } from "@/features/stores/schemas";
import { decryptShopifyToken } from "@/lib/shopify/crypto";
import { ShopifyClient } from "@/lib/shopify/client";

/**
 * Shopify's Admin API downloads product images from the `src` URL itself —
 * it can't accept a data: URI (what the demo image provider returns), only
 * a real http(s) URL (what a real AI image provider returns). Falls back to
 * the AI-generated hero/product section images when the linked Product has
 * none of its own (e.g. it came from the demo product source).
 */
function getFallbackImageUrls(document: StoreDocument): string[] {
  const productSection = document.sections.find((s) => s.type === "product");
  const heroSection = document.sections.find((s) => s.type === "hero");
  return [
    productSection && productSection.type === "product" ? productSection.settings.imageUrl : undefined,
    heroSection && heroSection.type === "hero" ? heroSection.settings.imageUrl : undefined,
  ].filter((url): url is string => !!url && url.startsWith("http"));
}

export interface PublishChecklistItem {
  key: string;
  label: string;
  complete: boolean;
}

export async function getPublishChecklist(storeId: string): Promise<{ items: PublishChecklistItem[]; readyToPublish: boolean } | null> {
  const user = await requireUser();
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: user.id },
    include: { product: true, settings: true },
  });
  if (!store) return null;

  const document = storeDocumentSchema.parse(store.document);
  const productSection = document.sections.find((s) => s.type === "product");

  const items: PublishChecklistItem[] = [
    { key: "title", label: "Product title", complete: !!document.brand.name },
    { key: "description", label: "Description", complete: !!(productSection && productSection.type === "product" && productSection.settings.description) },
    { key: "images", label: "Images", complete: (store.product?.images.length ?? 0) > 0 || getFallbackImageUrls(document).length > 0 },
    { key: "price", label: "Price", complete: !!store.product?.price },
    { key: "variants", label: "Variants", complete: true },
    { key: "shipping", label: "Shipping configured", complete: store.product?.shippingCost !== null },
    {
      key: "policies",
      label: "Store policies",
      complete: !!(store.settings?.shippingPolicy && store.settings?.returnPolicy && store.settings?.privacyPolicy),
    },
    { key: "theme", label: "Theme colors", complete: !!document.theme.primaryColor },
    { key: "seo", label: "SEO title & description", complete: !!(store.settings?.seoTitle && store.settings?.seoDescription) },
  ];

  return { items, readyToPublish: items.filter((i) => i.key !== "policies" && i.key !== "seo").every((i) => i.complete) };
}

export async function publishStoreToShopify(storeId: string, shopifyConnectionId: string) {
  const user = await requireUser();
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: user.id }, include: { product: true } });
  if (!store || !store.product) return { success: false as const, error: "Store or linked product not found" };

  const connection = await prisma.shopifyConnection.findFirst({
    where: { id: shopifyConnectionId, userId: user.id, status: "CONNECTED" },
  });
  if (!connection || !connection.accessTokenEncrypted) {
    return { success: false as const, error: "No connected Shopify store found. Connect Shopify first." };
  }

  const document = storeDocumentSchema.parse(store.document);
  const productSection = document.sections.find((s) => s.type === "product");
  const description = productSection && productSection.type === "product" ? productSection.settings.description : store.product.description ?? "";

  try {
    const accessToken = decryptShopifyToken(connection.accessTokenEncrypted);
    const client = new ShopifyClient(connection.shopDomain, accessToken);

    const shopifyProduct = await client.createProduct({
      title: document.brand.name || store.product.title,
      bodyHtml: `<p>${description}</p>`,
      vendor: document.brand.name,
      productType: store.product.category ?? undefined,
      images: (store.product.images.length > 0 ? store.product.images : getFallbackImageUrls(document)).map((src) => ({ src })),
      variants: [{ price: String(store.product.price ?? 0), sku: store.product.id }],
      status: "draft",
    });

    await client.publishProduct(shopifyProduct.id);

    await prisma.store.update({
      where: { id: storeId },
      data: { status: "PUBLISHED", shopifyDomain: connection.shopDomain },
    });

    await logActivity({ userId: user.id, action: "store_published", entityType: "store", entityId: storeId, metadata: { shop: connection.shopDomain } });

    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publishing failed";
    return { success: false as const, error: message };
  }
}
