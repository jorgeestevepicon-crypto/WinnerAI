"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createStoreCheckoutSession } from "@/features/storefront/server/actions";
import { formatCurrency } from "@/lib/utils";

export function BuyBox({
  storeId,
  price,
  currency,
  accentColor,
  checkoutConfigured,
}: {
  storeId: string;
  price: number;
  currency: string;
  accentColor: string;
  checkoutConfigured: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    const result = await createStoreCheckoutSession(storeId, quantity);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="sticky bottom-0 z-10 border-t bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div className="text-lg font-semibold">{formatCurrency(price * quantity, currency)}</div>
        {checkoutConfigured ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={loading}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.min(20, q + 1))} disabled={loading}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button onClick={handleBuy} disabled={loading} style={{ backgroundColor: accentColor }} className="text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              Buy now
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Checkout isn&apos;t set up yet for this store.</p>
        )}
      </div>
    </div>
  );
}
