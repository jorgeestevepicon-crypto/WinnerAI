"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { ProductManualSignal } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertManualSignal } from "@/features/winning-products/server/actions";

const NONE = "__none__";

export function ManualSignalForm({ productId, signal }: { productId: string; signal: ProductManualSignal | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [wowEffect, setWowEffect] = useState(signal?.wowEffect ? String(signal.wowEffect) : NONE);
  const [foundInPhysicalStores, setFoundInPhysicalStores] = useState(signal?.foundInPhysicalStores ?? false);
  const [competitionLevel, setCompetitionLevel] = useState(signal?.competitionLevel ?? NONE);
  const [googleTrendsManual, setGoogleTrendsManual] = useState(signal?.googleTrendsManual ?? NONE);
  const [notes, setNotes] = useState(signal?.notes ?? "");

  async function handleSave() {
    setSaving(true);
    const result = await upsertManualSignal(productId, {
      wowEffect: wowEffect === NONE ? undefined : Number(wowEffect),
      foundInPhysicalStores,
      competitionLevel: competitionLevel === NONE ? undefined : competitionLevel,
      googleTrendsManual: googleTrendsManual === NONE ? undefined : googleTrendsManual,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Wow effect (1-5)</Label>
          <Select value={wowEffect} onValueChange={setWowEffect}>
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Competition level</Label>
          <Select value={competitionLevel} onValueChange={setCompetitionLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Google Trends direction</Label>
          <Select value={googleTrendsManual} onValueChange={setGoogleTrendsManual}>
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              <SelectItem value="RISING">Rising</SelectItem>
              <SelectItem value="STABLE">Stable</SelectItem>
              <SelectItem value="FALLING">Falling</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Pre-filled from this product&apos;s real Google Trends signal when available — override if you know better.</p>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Checkbox id="foundInStores" checked={foundInPhysicalStores} onCheckedChange={(v) => setFoundInPhysicalStores(!!v)} />
          <Label htmlFor="foundInStores" className="font-normal">
            Found in physical stores
          </Label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </Button>
    </div>
  );
}
