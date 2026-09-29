"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WinningProductStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setWinningStatus } from "@/features/winning-products/server/actions";

const STATUS_OPTIONS: { value: WinningProductStatus; label: string }[] = [
  { value: "CANDIDATE", label: "Candidate" },
  { value: "IN_TEST", label: "In test" },
  { value: "WINNER", label: "Winner" },
  { value: "DISCARDED", label: "Discarded" },
];

export function StatusControl({ productId, status }: { productId: string; status: WinningProductStatus | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    setLoading(true);
    const result = await setWinningStatus(productId, { status: value });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Status updated");
    router.refresh();
  }

  return (
    <Select value={status ?? "CANDIDATE"} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-40">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
