"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAdCreative } from "@/features/ads/server/actions";
import { adStyleSchema, AD_FORMATS, type AdFormat, type AdStyle } from "@/features/ads/schemas";

export function GenerateCreativeForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [style, setStyle] = useState<AdStyle>("Problem/Solution");
  const [format, setFormat] = useState<AdFormat>("instagram_feed");
  const [loadingCount, setLoadingCount] = useState<number | null>(null);

  async function handleGenerate(variantCount: number) {
    setLoadingCount(variantCount);
    const result = await generateAdCreative({ campaignId, style, format, variantCount });
    setLoadingCount(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Generated ${variantCount} ad variant${variantCount > 1 ? "s" : ""}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generate ads</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Creative style</p>
          <Select value={style} onValueChange={(v) => setStyle(v as AdStyle)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {adStyleSchema.options.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Format</p>
          <Select value={format} onValueChange={(v) => setFormat(v as AdFormat)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AD_FORMATS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label} ({value.width}x{value.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleGenerate(3)} disabled={loadingCount !== null}>
          {loadingCount === 3 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate 3 variants
        </Button>
        <Button variant="outline" onClick={() => handleGenerate(10)} disabled={loadingCount !== null}>
          {loadingCount === 10 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
          Generate 10 ads
        </Button>
      </CardContent>
    </Card>
  );
}
