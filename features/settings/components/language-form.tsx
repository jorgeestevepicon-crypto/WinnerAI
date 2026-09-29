"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { setLocale } from "@/features/settings/server/actions";
import { SUPPORTED_LOCALES } from "@/i18n/config";

export function LanguageForm() {
  const t = useTranslations("settings.language");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSelect(next: string) {
    if (next === locale) return;
    startTransition(async () => {
      const result = await setLocale(next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LOCALES.map((value) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => handleSelect(value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:border-primary disabled:opacity-60",
                locale === value && "border-primary bg-accent"
              )}
            >
              {locale === value && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
              {t(value === "en" ? "english" : "spanish")}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
