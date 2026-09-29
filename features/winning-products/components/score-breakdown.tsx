import { getTranslations } from "next-intl/server";
import { Progress } from "@/components/ui/progress";
import type { DropshippingScoreResult } from "@/features/winning-products/types";

export async function ScoreBreakdown({ result }: { result: DropshippingScoreResult }) {
  const t = await getTranslations("winningProducts");
  const entries = Object.entries(result.breakdown).filter(([, value]) => value !== undefined) as [keyof DropshippingScoreResult["breakdown"], number][];

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{t(`scoreFactors.${key}`)}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
          <Progress value={value} />
        </div>
      ))}
      {result.missingFactors.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("scoreBreakdown.notAvailable", { factors: result.missingFactors.map((key) => t(`scoreFactors.${key}`)).join(", ") })}
        </p>
      )}
    </div>
  );
}
