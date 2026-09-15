"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runProductAnalysis } from "@/features/products/server/actions";

export function AnalyzeButton({ productId, hasAnalysis }: { productId: string; hasAnalysis: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    setLoading(true);
    const result = await runProductAnalysis(productId);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Analysis complete");
    startTransition(() => router.refresh());
  }

  const busy = loading || pending;

  return (
    <Button onClick={handleClick} disabled={busy} variant={hasAnalysis ? "outline" : "default"}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {hasAnalysis ? "Regenerate analysis" : "Analyze with AI"}
    </Button>
  );
}
