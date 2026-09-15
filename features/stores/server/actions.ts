"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { runAIJob } from "@/lib/ai/job-runner";
import { generateBrand } from "@/lib/ai/services/brand";
import { generateStoreContent } from "@/lib/ai/services/store";
import { generateStoreEdit } from "@/lib/ai/services/store-edit";
import { storeBuilderInputSchema, storeDocumentSchema, type StoreDocument } from "@/features/stores/schemas";

async function persistStoreVersion(storeId: string, document: StoreDocument, createdBy: "user" | "ai") {
  const last = await prisma.storeVersion.findFirst({ where: { storeId }, orderBy: { version: "desc" } });
  const nextVersion = (last?.version ?? 0) + 1;
  await prisma.storeVersion.create({
    data: { storeId, version: nextVersion, document: document as unknown as Prisma.InputJsonValue, createdBy },
  });
  return nextVersion;
}

export async function generateStore(input: unknown) {
  const user = await requireUser();
  const parsed = storeBuilderInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, userId: user.id } });
  if (!product) return { success: false as const, error: "Product not found" };

  const analysis = await prisma.productAnalysis.findFirst({ where: { productId: product.id }, orderBy: { createdAt: "desc" } });

  const store = await prisma.store.create({
    data: {
      userId: user.id,
      productId: product.id,
      name: product.title,
      status: "GENERATING",
      brand: {},
      theme: {},
      document: {},
      locale: parsed.data.language,
      country: parsed.data.country,
    },
  });

  const result = await runAIJob({
    userId: user.id,
    type: "STORE_GENERATION",
    input: { storeId: store.id, ...parsed.data },
    run: async () => {
      const brand = await generateBrand({
        productTitle: product.title,
        category: product.category,
        positioning: parsed.data.positioning,
        tone: parsed.data.tone,
        style: parsed.data.style,
      });

      const content = await generateStoreContent({
        brand,
        productTitle: product.title,
        productDescription: product.description,
        category: product.category,
        price: product.price,
        currency: product.currency,
        positioning: parsed.data.positioning,
        tone: parsed.data.tone,
        style: parsed.data.style,
        marketingAngles: analysis?.marketingAngles,
        advantages: analysis?.advantages,
        objections: analysis?.objections,
      });

      const document: StoreDocument = { brand, theme: content.theme, sections: content.sections };
      return document;
    },
  });

  if (!result.success) {
    await prisma.store.update({ where: { id: store.id }, data: { status: "ERROR" } });
    return { success: false as const, error: result.error, storeId: store.id };
  }

  const document = result.output;

  await prisma.$transaction([
    prisma.store.update({
      where: { id: store.id },
      data: {
        status: "READY",
        name: document.brand.name,
        brand: document.brand as unknown as Prisma.InputJsonValue,
        theme: document.theme as unknown as Prisma.InputJsonValue,
        document: document as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.storeSection.createMany({
      data: document.sections.map((section) => ({
        storeId: store.id,
        type: section.type,
        order: section.order,
        hidden: section.hidden,
        settings: section.settings as Prisma.InputJsonValue,
      })),
    }),
    prisma.storeSettings.create({ data: { storeId: store.id } }),
  ]);

  await persistStoreVersion(store.id, document, "ai");
  await logActivity({ userId: user.id, action: "store_created", entityType: "store", entityId: store.id });

  revalidatePath("/stores");
  return { success: true as const, storeId: store.id };
}

export async function updateStoreDocument(storeId: string, document: unknown) {
  const user = await requireUser();
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: user.id } });
  if (!store) return { success: false as const, error: "Store not found" };

  const parsed = storeDocumentSchema.safeParse(document);
  if (!parsed.success) return { success: false as const, error: "Invalid store document" };

  await prisma.$transaction([
    prisma.store.update({
      where: { id: storeId },
      data: {
        brand: parsed.data.brand as unknown as Prisma.InputJsonValue,
        theme: parsed.data.theme as unknown as Prisma.InputJsonValue,
        document: parsed.data as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.storeSection.deleteMany({ where: { storeId } }),
    prisma.storeSection.createMany({
      data: parsed.data.sections.map((section) => ({
        storeId,
        type: section.type,
        order: section.order,
        hidden: section.hidden,
        settings: section.settings as Prisma.InputJsonValue,
      })),
    }),
  ]);

  const version = await persistStoreVersion(storeId, parsed.data, "user");
  await logActivity({ userId: user.id, action: "store_updated", entityType: "store", entityId: storeId });

  revalidatePath(`/stores/${storeId}`);
  return { success: true as const, version };
}

export async function applyStoreAIEdit(storeId: string, instruction: string) {
  const user = await requireUser();
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: user.id } });
  if (!store) return { success: false as const, error: "Store not found" };

  const currentDocument = storeDocumentSchema.parse(store.document);

  const result = await runAIJob({
    userId: user.id,
    type: "STORE_AI_EDIT",
    input: { storeId, instruction },
    run: () => generateStoreEdit({ document: currentDocument, instruction }),
  });

  if (!result.success) return { success: false as const, error: result.error };

  const document = result.output;

  await prisma.$transaction([
    prisma.store.update({
      where: { id: storeId },
      data: {
        brand: document.brand as unknown as Prisma.InputJsonValue,
        theme: document.theme as unknown as Prisma.InputJsonValue,
        document: document as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.storeSection.deleteMany({ where: { storeId } }),
    prisma.storeSection.createMany({
      data: document.sections.map((section) => ({
        storeId,
        type: section.type,
        order: section.order,
        hidden: section.hidden,
        settings: section.settings as Prisma.InputJsonValue,
      })),
    }),
  ]);

  const newVersion = await persistStoreVersion(storeId, document, "ai");
  revalidatePath(`/stores/${storeId}`);
  return { success: true as const, document, version: newVersion };
}

export async function restoreStoreVersion(storeId: string, version: number) {
  const user = await requireUser();
  const store = await prisma.store.findFirst({ where: { id: storeId, userId: user.id } });
  if (!store) return { success: false as const, error: "Store not found" };

  const target = await prisma.storeVersion.findUnique({ where: { storeId_version: { storeId, version } } });
  if (!target) return { success: false as const, error: "Version not found" };

  const document = storeDocumentSchema.parse(target.document);

  await prisma.$transaction([
    prisma.store.update({
      where: { id: storeId },
      data: {
        brand: document.brand as unknown as Prisma.InputJsonValue,
        theme: document.theme as unknown as Prisma.InputJsonValue,
        document: document as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.storeSection.deleteMany({ where: { storeId } }),
    prisma.storeSection.createMany({
      data: document.sections.map((section) => ({
        storeId,
        type: section.type,
        order: section.order,
        hidden: section.hidden,
        settings: section.settings as Prisma.InputJsonValue,
      })),
    }),
  ]);

  const newVersion = await persistStoreVersion(storeId, document, "user");
  revalidatePath(`/stores/${storeId}`);
  return { success: true as const, document, version: newVersion };
}
