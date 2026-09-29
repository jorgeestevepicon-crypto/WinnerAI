"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductSupplierChecklist } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updateSupplierChecklist } from "@/features/winning-products/server/actions";

export function ChecklistCard({ productId, checklist }: { productId: string; checklist: ProductSupplierChecklist | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sampleOrdered, setSampleOrdered] = useState(checklist?.sampleOrdered ?? false);
  const [sampleReceived, setSampleReceived] = useState(checklist?.sampleReceived ?? false);
  const [qualityOk, setQualityOk] = useState(checklist?.qualityOk ?? false);
  const [actualShippingDays, setActualShippingDays] = useState(checklist?.actualShippingDays ? String(checklist.actualShippingDays) : "");
  const [notes, setNotes] = useState(checklist?.notes ?? "");

  const wouldBeReadyToScale = sampleOrdered && sampleReceived && qualityOk;

  async function handleSave() {
    setSaving(true);
    const result = await updateSupplierChecklist(productId, {
      sampleOrdered,
      sampleReceived,
      qualityOk,
      actualShippingDays: actualShippingDays.trim() ? Number(actualShippingDays) : undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.readyToScale ? "Ready to scale" : "Saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[
          { id: "sampleOrdered", label: "Sample ordered", checked: sampleOrdered, set: setSampleOrdered },
          { id: "sampleReceived", label: "Sample received", checked: sampleReceived, set: setSampleReceived },
          { id: "qualityOk", label: "Quality OK", checked: qualityOk, set: setQualityOk },
        ].map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox id={item.id} checked={item.checked} onCheckedChange={(v) => item.set(!!v)} />
            <Label htmlFor={item.id} className="font-normal">
              {item.label}
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Actual shipping time (days)</Label>
        <Input type="number" value={actualShippingDays} onChange={(e) => setActualShippingDays(e.target.value)} className="w-32" />
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {wouldBeReadyToScale && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Ready to scale
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save checklist
      </Button>
    </div>
  );
}
