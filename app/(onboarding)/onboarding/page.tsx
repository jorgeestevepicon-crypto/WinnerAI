import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export const metadata = { title: "Welcome to WinnerAI" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { onboardingCompleted: true } });
  if (record?.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        Welcome to WinnerAI
      </div>
      <OnboardingWizard />
    </div>
  );
}
