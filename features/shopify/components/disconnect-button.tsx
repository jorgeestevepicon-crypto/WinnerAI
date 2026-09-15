"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { disconnectShopify } from "@/features/shopify/server/actions";

export function DisconnectButton({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await disconnectShopify(connectionId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Shopify disconnected");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Disconnect
    </Button>
  );
}
