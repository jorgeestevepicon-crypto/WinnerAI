"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { onboardingSchema } from "@/features/onboarding/schemas";
import type { Prisma } from "@prisma/client";

export async function completeOnboarding(input: unknown) {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingCompleted: true,
      onboardingData: parsed.data as unknown as Prisma.InputJsonValue,
    },
  });

  return { success: true as const };
}
