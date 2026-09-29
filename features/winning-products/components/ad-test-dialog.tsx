"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createAdTest } from "@/features/winning-products/server/actions";

const NUMERIC_FIELDS = ["dailyBudget", "totalSpend", "impressions", "clicks", "addToCarts", "purchases", "revenue"] as const;

export function AdTestDialog({ productId, currency }: { productId: string; currency: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [values, setValues] = useState<Record<(typeof NUMERIC_FIELDS)[number], string>>({
    dailyBudget: "",
    totalSpend: "",
    impressions: "",
    clicks: "",
    addToCarts: "",
    purchases: "",
    revenue: "",
  });

  async function handleSubmit() {
    setLoading(true);
    const parsedValues = Object.fromEntries(
      NUMERIC_FIELDS.map((field) => [field, values[field].trim() ? Number(values[field]) : undefined])
    );
    const result = await createAdTest(productId, {
      name: name.trim() || undefined,
      platform: platform.trim() || undefined,
      currency,
      ...parsedValues,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Test added");
    setOpen(false);
    setName("");
    setPlatform("");
    setValues({ dailyBudget: "", totalSpend: "", impressions: "", clicks: "", addToCarts: "", purchases: "", revenue: "" });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="h-4 w-4" />
          Add ad test
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New ad test</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name (optional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test 1" />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="TikTok, Meta..." />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {NUMERIC_FIELDS.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                <Input
                  type="number"
                  value={values[field]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Add test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
