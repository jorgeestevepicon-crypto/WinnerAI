"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { discoverySchema } from "@/features/products/schemas";
import { getProductSourceAdapter } from "@/features/products/server/adapters";
import { toProductCreateInput } from "@/features/products/server/normalize";
import type { ProductSourceId } from "@/features/products/types";

export async function runProductDiscovery(input: unknown) {
  const user = await requireUser();
  const parsed = discoverySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const adapter = getProductSourceAdapter(parsed.data.sourceId);
  if (!adapter) return { success: false as const, error: "Unknown product source" };
  if (!adapter.configured) {
    return {
      success: false as const,
      error: adapter.disabledReason ?? `${adapter.label} is not configured in this environment.`,
    };
  }

  const results = await adapter.search({
    query: parsed.data.query,
    category: parsed.data.category,
    limit: parsed.data.limit,
  });

  if (results.length === 0) {
    return { success: true as const, count: 0 };
  }

  await prisma.$transaction(
    results.map((item) =>
      prisma.product.create({
        data: { ...toProductCreateInput(item, adapter.id as ProductSourceId), userId: user.id },
      })
    )
  );

  revalidatePath("/products");
  return { success: true as const, count: results.length };
}

export async function toggleSaveProduct(productId: string) {
  const user = await requireUser();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== user.id) {
    return { success: false as const, error: "Product not found" };
  }

  const nextSaved = !product.saved;
  await prisma.product.update({ where: { id: productId }, data: { saved: nextSaved } });

  if (nextSaved) {
    await logActivity({ userId: user.id, action: "product_saved", entityType: "product", entityId: productId });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true as const, saved: nextSaved };
}
