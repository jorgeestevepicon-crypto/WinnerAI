"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/features/billing/server/actions";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createPortalSession();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Manage billing
    </Button>
  );
}
