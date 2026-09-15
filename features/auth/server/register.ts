"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/features/auth/schemas";
import { env } from "@/config/env";

export type RegisterResult = { success: true } | { success: false; error: string };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isConfiguredAdmin = !!env.auth.adminEmail && email.toLowerCase() === env.auth.adminEmail.toLowerCase();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: isConfiguredAdmin ? "ADMIN" : "USER",
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });

  return { success: true };
}
