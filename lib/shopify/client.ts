import "server-only";
import { env } from "@/config/env";

export interface ShopifyProductInput {
  title: string;
  bodyHtml: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: { src: string }[];
  variants: { price: string; sku?: string; inventoryQuantity?: number }[];
  status?: "active" | "draft";
}

export class ShopifyApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

/** Thin wrapper around the Shopify Admin REST API for one connected shop. */
export class ShopifyClient {
  constructor(private readonly shopDomain: string, private readonly accessToken: string) {}

  private baseUrl(path: string) {
    return `https://${this.shopDomain}/admin/api/${env.shopify.apiVersion}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new ShopifyApiError(`Shopify API request to ${path} failed (${response.status}): ${text}`, response.status);
    }

    return response.json() as Promise<T>;
  }

  async getShop() {
    const data = await this.request<{ shop: { name: string; email: string; domain: string } }>("/shop.json");
    return data.shop;
  }

  async listProducts(limit = 20) {
    const data = await this.request<{ products: unknown[] }>(`/products.json?limit=${limit}`);
    return data.products;
  }

  async createProduct(input: ShopifyProductInput) {
    const data = await this.request<{ product: { id: number; handle: string } }>("/products.json", {
      method: "POST",
      body: JSON.stringify({
        product: {
          title: input.title,
          body_html: input.bodyHtml,
          vendor: input.vendor,
          product_type: input.productType,
          tags: input.tags?.join(", "),
          status: input.status ?? "draft",
          images: input.images,
          variants: input.variants.map((v) => ({ price: v.price, sku: v.sku, inventory_quantity: v.inventoryQuantity })),
        },
      }),
    });
    return data.product;
  }

  async updateProduct(productId: number, input: Partial<ShopifyProductInput>) {
    const data = await this.request<{ product: { id: number } }>(`/products/${productId}.json`, {
      method: "PUT",
      body: JSON.stringify({
        product: {
          id: productId,
          ...(input.title && { title: input.title }),
          ...(input.bodyHtml && { body_html: input.bodyHtml }),
          ...(input.status && { status: input.status }),
        },
      }),
    });
    return data.product;
  }

  async publishProduct(productId: number) {
    return this.updateProduct(productId, { status: "active" });
  }
}
