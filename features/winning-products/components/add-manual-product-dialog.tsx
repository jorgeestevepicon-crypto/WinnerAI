"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addManualAliExpressProduct } from "@/features/winning-products/server/actions";

const ORIGIN_VALUES = ["TIKTOK", "INSTAGRAM", "META_ADS", "OTHER"] as const;

export function AddManualProductDialog({ aliexpressConnected }: { aliexpressConnected: boolean }) {
  const router = useRouter();
  const t = useTranslations("winningProducts.addManualDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlOrId, setUrlOrId] = useState("");
  const [origin, setOrigin] = useState<(typeof ORIGIN_VALUES)[number]>("TIKTOK");
  const [discoveryUrl, setDiscoveryUrl] = useState("");

  const ORIGIN_LABELS: Record<(typeof ORIGIN_VALUES)[number], string> = {
    TIKTOK: t("origins.tiktok"),
    INSTAGRAM: t("origins.instagram"),
    META_ADS: t("origins.metaAds"),
    OTHER: t("origins.other"),
  };

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
    toast.success(t("added"));
    setOpen(false);
    router.push(`/winning-products/${result.productId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="h-4 w-4" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {!aliexpressConnected ? (
          <p className="text-sm text-muted-foreground">{t("connectFirst")}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("urlLabel")}</Label>
              <Input value={urlOrId} onChange={(e) => setUrlOrId(e.target.value)} placeholder="https://www.aliexpress.com/item/... or 1005006123456789" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("originLabel")}</Label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as (typeof ORIGIN_VALUES)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ORIGIN_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("linkLabel")}</Label>
              <Input value={discoveryUrl} onChange={(e) => setDiscoveryUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !aliexpressConnected || !urlOrId.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {t("addProduct")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
