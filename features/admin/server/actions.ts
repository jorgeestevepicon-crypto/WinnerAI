"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { generateAdCreative } from "@/features/ads/server/actions";
import { generateCampaignVideoConcept } from "@/features/ads/server/actions";
import { runProductAnalysis } from "@/features/products/server/actions";
import { applyStoreAIEdit } from "@/features/stores/server/actions";

export async function setUserSuspended(userId: string, suspended: boolean) {
  const admin = await requireAdmin();
  if (suspended && userId === admin.id) {
    return { success: false as const, error: "You can't suspend your own account." };
  }
  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  revalidatePath("/admin/users");
  return { success: true as const };
}

export async function setProductFeatured(productId: string, featured: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { featured } });
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function setProductHidden(productId: string, hidden: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { deletedAt: hidden ? new Date() : null } });
  revalidatePath("/admin/products");
  return { success: true as const };
}

const RETRYABLE_TYPES = new Set(["PRODUCT_ANALYSIS", "AD_COPY", "AD_BULK", "VIDEO_STORYBOARD", "STORE_AI_EDIT"]);

export async function retryJob(jobId: string) {
  const admin = await requireAdmin();
  const job = await prisma.aIJob.findUnique({ where: { id: jobId } });
  if (!job) return { success: false as const, error: "Job not found" };
  if (!RETRYABLE_TYPES.has(job.type)) {
    return { success: false as const, error: "This job type can't be retried from here — re-run it from the page that created it." };
  }
  if (job.userId !== admin.id) {
    // The underlying actions re-check ownership against the caller's own
    // session, by design (an admin retrying on someone else's behalf would
    // otherwise mean impersonating them). Retrying another user's job from
    // here would just fail that check, so say so plainly instead.
    return { success: false as const, error: "This job belongs to another user — only that user (or an admin acting as themselves) can retry it." };
  }

  const input = job.input as Record<string, unknown>;

  try {
    switch (job.type) {
      case "PRODUCT_ANALYSIS":
        await runProductAnalysis(input.productId as string);
        break;
      case "AD_COPY":
      case "AD_BULK":
        await generateAdCreative(input);
        break;
      case "VIDEO_STORYBOARD":
        await generateCampaignVideoConcept(input.campaignId as string);
        break;
      case "STORE_AI_EDIT":
        await applyStoreAIEdit(input.storeId as string, input.instruction as string);
        break;
    }
    revalidatePath("/admin/jobs");
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    return { success: false as const, error: message };
  }
}
