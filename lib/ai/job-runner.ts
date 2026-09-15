import "server-only";
import type { AIJobType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AIProviderError } from "@/lib/ai/types";

/**
 * Wraps an AI service call with an AIJob record so every generation has a
 * durable status (PENDING -> PROCESSING -> COMPLETED/FAILED), progress, and
 * an audit trail visible in /admin. Runs the work inline within the request
 * rather than on a separate worker queue — the services here are fast
 * (single structured-output calls or demo generators), so a synchronous run
 * with a job record is a reasonable middle ground for this deployment.
 * Swap the body for a real queue dispatch (e.g. Inngest, BullMQ, a Vercel
 * Cron-drained table) if a task grows slow enough to need one.
 */
export async function runAIJob<T>(params: {
  userId: string;
  type: AIJobType;
  input: Record<string, unknown>;
  run: () => Promise<T>;
}): Promise<{ success: true; output: T; jobId: string } | { success: false; error: string; jobId: string }> {
  const job = await prisma.aIJob.create({
    data: {
      userId: params.userId,
      type: params.type,
      status: "PROCESSING",
      input: params.input as Prisma.InputJsonValue,
      startedAt: new Date(),
      attempts: 1,
    },
  });

  try {
    const output = await params.run();
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", output: output as Prisma.InputJsonValue, progress: 100, finishedAt: new Date() },
    });
    return { success: true, output, jobId: job.id };
  } catch (error) {
    const message = error instanceof AIProviderError ? error.message : "AI generation failed unexpectedly.";
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: message, finishedAt: new Date() },
    });
    return { success: false, error: message, jobId: job.id };
  }
}
