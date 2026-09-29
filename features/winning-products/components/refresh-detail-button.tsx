"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refreshAliExpressProductDetail } from "@/features/winning-products/server/actions";

export function RefreshDetailButton({ productId }: { productId: string }) {
  const router = useRouter();
  const t = useTranslations("winningProducts.detail");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await refreshAliExpressProductDetail(productId);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(t("refresh"));
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {t("refresh")}
    </Button>
  );
}
