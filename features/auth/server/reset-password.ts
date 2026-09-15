"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/config/env";

const requestSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(input: unknown) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Enter a valid email" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always behave the same whether or not the account exists, to avoid leaking
  // which emails are registered.
  if (!user) {
    return { success: true as const, resetUrl: null };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  const resetUrl = `${env.appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

  // No transactional email provider is wired up in this build, so in demo
  // mode we hand the link back to the caller instead of silently pretending
  // an email was sent. Swap this for a real email send once a provider
  // (Resend, Postmark, SES...) is configured.
  return { success: true as const, resetUrl };
}

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function resetPassword(input: unknown) {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid request" };

  const { email, token, password } = parsed.data;

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record || record.expires < new Date()) {
    return { success: false as const, error: "This reset link is invalid or has expired" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } }),
  ]);

  return { success: true as const };
}
