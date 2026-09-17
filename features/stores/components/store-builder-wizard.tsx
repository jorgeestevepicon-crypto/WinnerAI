"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateStore } from "@/features/stores/server/actions";
import type { StoreBuilderInput } from "@/features/stores/schemas";

const styles: { value: StoreBuilderInput["style"]; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "premium", label: "Premium" },
  { value: "bold", label: "Bold" },
  { value: "playful", label: "Playful" },
  { value: "editorial", label: "Editorial" },
];

const tones: { value: StoreBuilderInput["tone"]; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "playful", label: "Playful" },
  { value: "luxury", label: "Luxury" },
  { value: "urgent", label: "Urgent" },
];

export function StoreBuilderWizard({
  products,
  defaultProductId,
  aiConfigured,
}: {
  products: Product[];
  defaultProductId?: string;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<StoreBuilderInput>>({
    productId: defaultProductId,
    country: "US",
    language: "en",
    style: "minimal",
    tone: "friendly",
    positioning: "",
    generationMode: aiConfigured ? "ai" : "demo",
  });

  const selectedProduct = products.find((p) => p.id === form.productId);

  function update<K extends keyof StoreBuilderInput>(key: K, value: StoreBuilderInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = !!form.productId && !!form.country && !!form.language && !!form.style && !!form.tone && (form.positioning?.length ?? 0) > 2;

  async function handleSubmit() {
    setSubmitting(true);
    const result = await generateStore(form);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Store generated");
    router.push(`/stores/${result.storeId}`);
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          You need at least one saved product before building a store. Head to{" "}
          <a href="/products" className="underline">
            Product Finder
          </a>{" "}
          and save one first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.productId} onValueChange={(v) => update("productId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProduct && (
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedProduct.category} · {selectedProduct.currency} {selectedProduct.price}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Market</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="US" />
          </div>
          <div>
            <Label>Language</Label>
            <Input value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="en" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Style</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={form.style} onValueChange={(v) => update("style", v as StoreBuilderInput["style"])} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {styles.map((s) => (
              <div key={s.value} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={s.value} id={`style-${s.value}`} />
                <Label htmlFor={`style-${s.value}`} className="cursor-pointer font-normal">
                  {s.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Tone</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={form.tone} onValueChange={(v) => update("tone", v as StoreBuilderInput["tone"])} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {tones.map((t) => (
              <div key={t.value} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={t.value} id={`tone-${t.value}`} />
                <Label htmlFor={`tone-${t.value}`} className="cursor-pointer font-normal">
                  {t.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">5. Positioning</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={form.positioning}
            onChange={(e) => update("positioning", e.target.value)}
            placeholder="e.g. the smarter, more affordable way to..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">6. Generation mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <RadioGroup
            value={form.generationMode}
            onValueChange={(v) => update("generationMode", v as StoreBuilderInput["generationMode"])}
            className="grid gap-2 sm:grid-cols-2"
          >
            <div className="flex items-start gap-2 rounded-md border p-3">
              <RadioGroupItem value="ai" id="mode-ai" disabled={!aiConfigured} className="mt-1" />
              <Label htmlFor="mode-ai" className={aiConfigured ? "cursor-pointer font-normal" : "cursor-not-allowed font-normal text-muted-foreground"}>
                <span className="block font-medium text-foreground">Real AI</span>
                <span className="text-xs text-muted-foreground">
                  {aiConfigured ? "Uses your configured AI provider. Uses API credits." : "Not available — no AI provider configured yet."}
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-2 rounded-md border p-3">
              <RadioGroupItem value="demo" id="mode-demo" className="mt-1" />
              <Label htmlFor="mode-demo" className="cursor-pointer font-normal">
                <span className="block font-medium text-foreground">Demo</span>
                <span className="text-xs text-muted-foreground">Free, deterministic example content. No AI cost.</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate store
      </Button>
    </div>
  );
}
