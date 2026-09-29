"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { WinningScoreConfig } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateScoreConfigAction } from "@/features/winning-products/server/actions";

const WEIGHT_FIELDS: { key: keyof WinningScoreConfig; label: string }[] = [
  { key: "weightMargin", label: "Margin" },
  { key: "weightPriceRangeFit", label: "Ideal price range" },
  { key: "weightDemand", label: "Demand" },
  { key: "weightDemandGrowth", label: "Demand growth" },
  { key: "weightProviderQuality", label: "Provider quality" },
  { key: "weightLogistics", label: "Logistics" },
  { key: "weightWowEffect", label: "Wow effect" },
  { key: "weightPhysicalStores", label: "Physical store availability" },
  { key: "weightCompetitionLevel", label: "Competition level" },
  { key: "weightGoogleTrends", label: "Google Trends" },
];

const THRESHOLD_FIELDS: { key: keyof WinningScoreConfig; label: string; step?: string }[] = [
  { key: "marginTargetMultiplier", label: "Target margin multiplier (price / total cost)", step: "0.1" },
  { key: "idealPriceMin", label: "Ideal sale price — minimum" },
  { key: "idealPriceMax", label: "Ideal sale price — maximum" },
  { key: "maxIdealWeightGrams", label: "Max ideal weight (grams)" },
  { key: "minRoasForWinner", label: "Minimum ROAS to mark as Winner", step: "0.1" },
];

export function ConfigForm({ config }: { config: WinningScoreConfig }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries([...WEIGHT_FIELDS, ...THRESHOLD_FIELDS].map(({ key }) => [key, String(config[key])]))
  );
  const [priceCurrency, setPriceCurrency] = useState(config.priceCurrency);
  const [targetCountry, setTargetCountry] = useState(config.targetCountry);

  const weightSum = WEIGHT_FIELDS.reduce((sum, { key }) => sum + (Number(values[key]) || 0), 0);

  async function handleSave() {
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
    const result = await updateScoreConfigAction({ ...payload, priceCurrency, targetCountry });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configuration saved");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-medium">Target market</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Price currency</Label>
            <Input value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Target country (ISO-2)</Label>
            <Input value={targetCountry} onChange={(e) => setTargetCountry(e.target.value.toUpperCase())} maxLength={2} />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-1 text-sm font-medium">Score weights</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Weights sum to {weightSum.toFixed(2)}. A factor with no real data available yet has its weight redistributed among the others automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {WEIGHT_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-1 text-sm font-medium">Thresholds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {THRESHOLD_FIELDS.map(({ key, label, step }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                type="number"
                step={step ?? "1"}
                min="0"
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save configuration
      </Button>
    </div>
  );
}
