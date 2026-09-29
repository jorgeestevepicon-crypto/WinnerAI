"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addManualAliExpressProduct } from "@/features/winning-products/server/actions";

const ORIGINS = [
  { value: "TIKTOK", label: "TikTok" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "META_ADS", label: "Meta Ad Library" },
  { value: "OTHER", label: "Other" },
] as const;

export function AddManualProductDialog({ aliexpressConnected }: { aliexpressConnected: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlOrId, setUrlOrId] = useState("");
  const [origin, setOrigin] = useState<(typeof ORIGINS)[number]["value"]>("TIKTOK");
  const [discoveryUrl, setDiscoveryUrl] = useState("");

  async function handleSubmit() {
    setLoading(true);
    const result = await addManualAliExpressProduct({
      urlOrId,
      discoveryOrigin: origin,
      discoveryUrl: discoveryUrl.trim() || undefined,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Product added");
    setOpen(false);
    router.push(`/winning-products/${result.productId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="h-4 w-4" />
          Add manually
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a product you found elsewhere</DialogTitle>
        </DialogHeader>
        {!aliexpressConnected ? (
          <p className="text-sm text-muted-foreground">Connect your AliExpress account first — this pulls real product data by its AliExpress URL or item ID.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>AliExpress product URL or item ID</Label>
              <Input value={urlOrId} onChange={(e) => setUrlOrId(e.target.value)} placeholder="https://www.aliexpress.com/item/... or 1005006123456789" />
            </div>
            <div className="space-y-1.5">
              <Label>Where did you see it advertised?</Label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as (typeof ORIGINS)[number]["value"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Link to the ad/video (optional)</Label>
              <Input value={discoveryUrl} onChange={(e) => setDiscoveryUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !aliexpressConnected || !urlOrId.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Add product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
