"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runProductDiscovery } from "@/features/products/server/actions";

export function DiscoverButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await runProductDiscovery({ sourceId: "demo" });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.count === 0) {
      toast.info("No new products matched this search.");
      return;
    }
    toast.success(`Found ${result.count} products`);
    startTransition(() => router.refresh());
  }

  const busy = loading || pending;

  return (
    <Button onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Find products
    </Button>
  );
}
