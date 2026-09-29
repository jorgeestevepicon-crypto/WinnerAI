import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { ScoreConfigInput } from "@/features/winning-products/schemas";

/** Every default here matches the column defaults in the WinningScoreConfig Prisma model — kept in sync there since Prisma applies them at the DB level for rows created outside this helper. */
export async function getOrCreateScoreConfig(userId: string) {
  const existing = await prisma.winningScoreConfig.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.winningScoreConfig.create({ data: { userId } });
}

export async function updateScoreConfig(userId: string, input: ScoreConfigInput) {
  return prisma.winningScoreConfig.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
