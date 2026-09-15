"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampaign } from "@/features/ads/server/actions";
import { adPlatformSchema, adObjectiveSchema, type NewCampaignInput } from "@/features/ads/schemas";

const platforms = adPlatformSchema.options;
const objectives = adObjectiveSchema.options;

export function NewCampaignForm({ products, defaultProductId }: { products: Product[]; defaultProductId?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<NewCampaignInput>>({
    productId: defaultProductId,
    platform: "META",
    objective: "SALES",
    audience: { ageRange: "25-45", gender: "all", country: "US", interests: [], awarenessLevel: "problem-aware" },
  });

  const selectedProduct = products.find((p) => p.id === form.productId);

  function update<K extends keyof NewCampaignInput>(key: K, value: NewCampaignInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = !!form.productId && !!form.platform && !!form.objective;

  async function handleSubmit() {
    setSubmitting(true);
    const result = await createCampaign({ ...form, name: selectedProduct ? `${selectedProduct.title} — ${form.platform}` : "New campaign" });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.push(`/ads/${result.campaignId}`);
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Save a product in{" "}
          <a href="/products" className="underline">
            Product Finder
          </a>{" "}
          before creating an ad campaign.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.productId} onValueChange={(v) => update("productId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={form.platform} onValueChange={(v) => update("platform", v as NewCampaignInput["platform"])} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {platforms.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={p} id={`platform-${p}`} />
                <Label htmlFor={`platform-${p}`} className="cursor-pointer font-normal">
                  {p}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={form.objective} onValueChange={(v) => update("objective", v as NewCampaignInput["objective"])} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {objectives.map((o) => (
              <div key={o} className="flex items-center gap-2 rounded-md border p-3">
                <RadioGroupItem value={o} id={`objective-${o}`} />
                <Label htmlFor={`objective-${o}`} className="cursor-pointer font-normal">
                  {o.replace("_", " ")}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Age range</Label>
            <Input
              value={form.audience?.ageRange}
              onChange={(e) => update("audience", { ...form.audience!, ageRange: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Country</Label>
            <Input
              value={form.audience?.country}
              onChange={(e) => update("audience", { ...form.audience!, country: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Interests (comma separated)</Label>
            <Input
              value={form.audience?.interests.join(", ")}
              onChange={(e) => update("audience", { ...form.audience!, interests: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </div>
          <div>
            <Label className="text-xs">Awareness level</Label>
            <Select
              value={form.audience?.awarenessLevel}
              onValueChange={(v) => update("audience", { ...form.audience!, awarenessLevel: v as NewCampaignInput["audience"]["awarenessLevel"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["unaware", "problem-aware", "solution-aware", "product-aware", "most-aware"].map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSubmit} disabled={!canSubmit || submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
        Create campaign
      </Button>
    </div>
  );
}
