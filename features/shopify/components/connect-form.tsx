"use client";

import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getShopifyAuthUrl } from "@/features/shopify/server/actions";

export function ConnectForm() {
  const [shopDomain, setShopDomain] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    const result = await getShopifyAuthUrl(shopDomain);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={shopDomain}
        onChange={(e) => setShopDomain(e.target.value)}
        placeholder="your-store.myshopify.com"
        className="sm:max-w-xs"
      />
      <Button onClick={handleConnect} disabled={loading || !shopDomain}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
        Connect Shopify
      </Button>
    </div>
  );
}
