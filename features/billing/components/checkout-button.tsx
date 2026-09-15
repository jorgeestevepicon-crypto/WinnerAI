"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/features/billing/server/actions";
import type { SubscriptionPlan } from "@prisma/client";

export function CheckoutButton({ plan, label, variant }: { plan: SubscriptionPlan; label: string; variant?: "default" | "outline" }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createCheckoutSession(plan);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <Button className="w-full" variant={variant} onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
