import { Progress } from "@/components/ui/progress";
import type { DropshippingScoreResult } from "@/features/winning-products/types";

const FACTOR_LABELS: Record<keyof DropshippingScoreResult["breakdown"], string> = {
  margin: "Margin",
  priceRangeFit: "Ideal price range",
  demand: "Demand",
  demandGrowth: "Demand growth",
  providerQuality: "Provider quality",
  logistics: "Logistics",
  wowEffect: "Wow effect",
  physicalStores: "Physical store availability",
  competitionLevel: "Competition level",
  googleTrends: "Google Trends",
};

export function ScoreBreakdown({ result }: { result: DropshippingScoreResult }) {
  const entries = Object.entries(result.breakdown).filter(([, value]) => value !== undefined) as [keyof DropshippingScoreResult["breakdown"], number][];

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{FACTOR_LABELS[key]}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
          <Progress value={value} />
        </div>
      ))}
      {result.missingFactors.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Not yet included (no real data available): {result.missingFactors.join(", ")}.
        </p>
      )}
    </div>
  );
}
