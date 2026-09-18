"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateStoreSettings } from "@/features/stores/server/actions";
import type { StoreSettingsInput } from "@/features/stores/schemas";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StoreSettingsPanel({ storeId, initialSettings }: { storeId: string; initialSettings: Partial<StoreSettingsInput> }) {
  const [form, setForm] = useState<StoreSettingsInput>({
    seoTitle: initialSettings.seoTitle ?? "",
    seoDescription: initialSettings.seoDescription ?? "",
    shippingPolicy: initialSettings.shippingPolicy ?? "",
    returnPolicy: initialSettings.returnPolicy ?? "",
    privacyPolicy: initialSettings.privacyPolicy ?? "",
  });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof StoreSettingsInput>(key: K, value: StoreSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateStoreSettings(storeId, form);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">SEO</h3>
        <Field label="SEO title" hint="Shown in search results and browser tabs. Aim for under 70 characters.">
          <Input value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} maxLength={70} />
        </Field>
        <Field label="SEO description" hint="The summary shown under your title in search results. Aim for under 160 characters.">
          <Textarea value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} maxLength={160} />
        </Field>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold">Store policies</h3>
        <p className="text-xs text-muted-foreground">
          Stored here for your records and to track completeness. When you publish, also set these as your store&apos;s official policies in
          Shopify (Settings → Policies) — that&apos;s the legally binding copy customers see at checkout.
        </p>
        <Field label="Shipping policy">
          <Textarea value={form.shippingPolicy} onChange={(e) => update("shippingPolicy", e.target.value)} rows={3} />
        </Field>
        <Field label="Return policy">
          <Textarea value={form.returnPolicy} onChange={(e) => update("returnPolicy", e.target.value)} rows={3} />
        </Field>
        <Field label="Privacy policy">
          <Textarea value={form.privacyPolicy} onChange={(e) => update("privacyPolicy", e.target.value)} rows={3} />
        </Field>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save settings
      </Button>
    </div>
  );
}
