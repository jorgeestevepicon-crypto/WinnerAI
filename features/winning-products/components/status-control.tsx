"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WinningProductStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setWinningStatus } from "@/features/winning-products/server/actions";

const STATUS_VALUES: WinningProductStatus[] = ["CANDIDATE", "IN_TEST", "WINNER", "DISCARDED"];
const STATUS_KEYS: Record<WinningProductStatus, string> = {
  CANDIDATE: "candidate",
  IN_TEST: "inTest",
  WINNER: "winner",
  DISCARDED: "discarded",
};

export function StatusControl({ productId, status }: { productId: string; status: WinningProductStatus | null }) {
  const router = useRouter();
  const t = useTranslations("winningProducts.status");
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    setLoading(true);
    const result = await setWinningStatus(productId, { status: value });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Select value={status ?? "CANDIDATE"} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-40">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {STATUS_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(STATUS_KEYS[value])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
