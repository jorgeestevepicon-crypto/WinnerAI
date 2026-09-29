"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { WinningScoreConfig } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateScoreConfigAction } from "@/features/winning-products/server/actions";

const WEIGHT_FIELDS: { key: keyof WinningScoreConfig; factorKey: string }[] = [
  { key: "weightMargin", factorKey: "margin" },
  { key: "weightPriceRangeFit", factorKey: "priceRangeFit" },
  { key: "weightDemand", factorKey: "demand" },
  { key: "weightDemandGrowth", factorKey: "demandGrowth" },
  { key: "weightProviderQuality", factorKey: "providerQuality" },
  { key: "weightLogistics", factorKey: "logistics" },
  { key: "weightWowEffect", factorKey: "wowEffect" },
  { key: "weightPhysicalStores", factorKey: "physicalStores" },
  { key: "weightCompetitionLevel", factorKey: "competitionLevel" },
  { key: "weightGoogleTrends", factorKey: "googleTrends" },
];

const THRESHOLD_FIELDS: { key: keyof WinningScoreConfig; labelKey: string; step?: string }[] = [
  { key: "marginTargetMultiplier", labelKey: "marginTargetMultiplier", step: "0.1" },
  { key: "idealPriceMin", labelKey: "idealPriceMin" },
  { key: "idealPriceMax", labelKey: "idealPriceMax" },
  { key: "maxIdealWeightGrams", labelKey: "maxIdealWeight" },
  { key: "minRoasForWinner", labelKey: "minRoasForWinner", step: "0.1" },
];

export function ConfigForm({ config }: { config: WinningScoreConfig }) {
  const router = useRouter();
  const t = useTranslations("winningProducts.config");
  const tFactors = useTranslations("winningProducts.scoreFactors");
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
    toast.success(t("save"));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-medium">{t("targetMarketTitle")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("priceCurrencyLabel")}</Label>
            <Input value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("targetCountryLabel")}</Label>
            <Input value={targetCountry} onChange={(e) => setTargetCountry(e.target.value.toUpperCase())} maxLength={2} />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-1 text-sm font-medium">{t("weightsTitle")}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{t("weightsHint", { sum: weightSum.toFixed(2) })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {WEIGHT_FIELDS.map(({ key, factorKey }) => (
            <div key={key} className="space-y-1.5">
              <Label>{tFactors(factorKey)}</Label>
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
        <h3 className="mb-1 text-sm font-medium">{t("thresholdsTitle")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {THRESHOLD_FIELDS.map(({ key, labelKey, step }) => (
            <div key={key} className="space-y-1.5">
              <Label>{t(labelKey)}</Label>
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
        {t("save")}
      </Button>
    </div>
  );
}
