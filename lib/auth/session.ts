import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // JWT sessions don't hit the database on every request, so a user
  // suspended mid-session would otherwise keep working until their token
  // expires. This check closes that gap for every protected server render.
  // Server Components can't clear cookies (only Server Actions/Route
  // Handlers can), so this redirects without signing out client-side —
  // harmless, since every protected render re-checks and redirects again,
  // and the credentials authorize() callback blocks a fresh login anyway.
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { suspended: true } });
  if (record?.suspended) {
    redirect("/login?suspended=true");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
