"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { regenerateBrandLogo } from "@/features/stores/server/actions";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function BrandSettingsPanel({ storeId }: { storeId: string }) {
  const brand = useEditorStore((s) => s.document.brand);
  const updateBrand = useEditorStore((s) => s.updateBrand);
  const setDocument = useEditorStore((s) => s.setDocument);
  const addVersion = useEditorStore((s) => s.addVersion);
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerateLogo() {
    setRegenerating(true);
    const result = await regenerateBrandLogo(storeId);
    setRegenerating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDocument(result.document, { fromHistory: true });
    addVersion({ version: result.version, createdBy: "ai", createdAt: new Date() });
    toast.success("Logo regenerated");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {brand.logoUrl ? (
            <Image src={brand.logoUrl} alt={`${brand.name} logo`} width={96} height={96} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-xs text-muted-foreground">No logo yet</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRegenerateLogo} disabled={regenerating}>
          {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {brand.logoUrl ? "Regenerate logo" : "Generate logo"}
        </Button>
      </div>

      <Field label="Brand name">
        <Input value={brand.name} onChange={(e) => updateBrand({ name: e.target.value })} />
      </Field>
      <Field label="Slogan">
        <Input value={brand.slogan} onChange={(e) => updateBrand({ slogan: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea value={brand.description} onChange={(e) => updateBrand({ description: e.target.value })} />
      </Field>
      <Field label="Logo concept (used to generate the logo image)">
        <Textarea value={brand.logoConcept} onChange={(e) => updateBrand({ logoConcept: e.target.value })} />
      </Field>
    </div>
  );
}
