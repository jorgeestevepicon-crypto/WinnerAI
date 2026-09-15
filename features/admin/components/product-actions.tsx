"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setProductFeatured, setProductHidden } from "@/features/admin/server/actions";

export function ProductActions({ productId, featured, hidden }: { productId: string; featured: boolean; hidden: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"feature" | "hide" | null>(null);

  async function handleFeature() {
    setLoading("feature");
    const result = await setProductFeatured(productId, !featured);
    setLoading(null);
    if (!result.success) return toast.error("Failed to update product");
    router.refresh();
  }

  async function handleHide() {
    setLoading("hide");
    const result = await setProductHidden(productId, !hidden);
    setLoading(null);
    if (!result.success) return toast.error("Failed to update product");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="outline" size="sm" onClick={handleFeature} disabled={loading !== null}>
        {loading === "feature" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
        {featured ? "Unfeature" : "Feature"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleHide} disabled={loading !== null}>
        {loading === "hide" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {hidden ? "Unhide" : "Hide"}
      </Button>
    </div>
  );
}
