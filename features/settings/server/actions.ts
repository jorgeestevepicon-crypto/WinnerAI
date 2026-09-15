"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import {
  profileSchema,
  notificationPreferencesSchema,
  changePasswordSchema,
  defaultNotificationPreferences,
} from "@/features/settings/schemas";

export async function updateProfile(input: unknown) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, image: parsed.data.image || null },
  });

  revalidatePath("/settings");
  return { success: true as const };
}

export async function updateNotificationPreferences(input: unknown) {
  const user = await requireUser();
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid preferences" };

  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { preferences: true } });
  const preferences = {
    ...(typeof existing?.preferences === "object" && existing?.preferences ? existing.preferences : {}),
    notifications: parsed.data,
  };

  await prisma.user.update({ where: { id: user.id }, data: { preferences } });
  revalidatePath("/settings");
  return { success: true as const };
}

export async function getNotificationPreferences(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const prefs = user?.preferences as { notifications?: unknown } | null;
  const parsed = notificationPreferencesSchema.safeParse(prefs?.notifications);
  return parsed.success ? parsed.data : defaultNotificationPreferences;
}

export async function changePassword(input: unknown) {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.passwordHash) {
    return { success: false as const, error: "This account signs in with a social provider and has no password to change" };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!isValid) return { success: false as const, error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true as const };
}
