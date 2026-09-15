"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { completeOnboarding } from "@/features/onboarding/server/actions";
import type { OnboardingInput } from "@/features/onboarding/schemas";

const marketingOptions: { value: OnboardingInput["marketingFocus"][number]; label: string }[] = [
  { value: "organic", label: "Organic social" },
  { value: "paid-ads", label: "Paid ads" },
  { value: "influencers", label: "Influencers" },
  { value: "email", label: "Email marketing" },
  { value: "seo", label: "SEO" },
];

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingInput>>({ marketingFocus: [] });

  function update<K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function canContinue() {
    switch (step) {
      case 1:
        return !!data.sellingWhat && data.sellingWhat.trim().length >= 2;
      case 2:
        return !!data.country;
      case 3:
        return !!data.hasShopify;
      case 4:
        return !!data.experience;
      case 5:
        return (data.marketingFocus?.length ?? 0) > 0;
      default:
        return false;
    }
  }

  async function finish() {
    setSubmitting(true);
    const result = await completeOnboarding(data);
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Progress value={(step / TOTAL_STEPS) * 100} />

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">What do you want to sell?</h2>
          <p className="text-sm text-muted-foreground">A category, niche, or a specific product idea — whatever you have.</p>
          <Input
            placeholder="e.g. skincare tools, pet accessories..."
            value={data.sellingWhat ?? ""}
            onChange={(e) => update("sellingWhat", e.target.value)}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Which country are you targeting?</h2>
          <Input
            placeholder="e.g. United States"
            value={data.country ?? ""}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Do you already have a Shopify store?</h2>
          <RadioGroup value={data.hasShopify} onValueChange={(v) => update("hasShopify", v as OnboardingInput["hasShopify"])}>
            {[
              { value: "yes", label: "Yes, I have one" },
              { value: "no", label: "No, not yet" },
              { value: "not-sure", label: "Not sure" },
            ].map((option) => (
              <div key={option.value} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">What&apos;s your ecommerce experience?</h2>
          <RadioGroup value={data.experience} onValueChange={(v) => update("experience", v as OnboardingInput["experience"])}>
            {[
              { value: "beginner", label: "Beginner — just getting started" },
              { value: "intermediate", label: "Intermediate — launched a store before" },
              { value: "advanced", label: "Advanced — running active stores" },
            ].map((option) => (
              <div key={option.value} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">What&apos;s your marketing focus?</h2>
          <p className="text-sm text-muted-foreground">Select all that apply.</p>
          <div className="space-y-2">
            {marketingOptions.map((option) => {
              const checked = data.marketingFocus?.includes(option.value) ?? false;
              return (
                <div key={option.value} className="flex items-center gap-2 rounded-md border p-3">
                  <Checkbox
                    id={option.value}
                    checked={checked}
                    onCheckedChange={(value) => {
                      const set = new Set(data.marketingFocus ?? []);
                      if (value) set.add(option.value);
                      else set.delete(option.value);
                      update("marketingFocus", Array.from(set));
                    }}
                  />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue()}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={!canContinue() || submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Finish
          </Button>
        )}
      </div>
    </div>
  );
}
