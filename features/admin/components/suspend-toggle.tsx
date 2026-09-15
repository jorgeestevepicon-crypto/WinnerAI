"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setUserSuspended } from "@/features/admin/server/actions";

export function SuspendToggle({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await setUserSuspended(userId, !suspended);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant={suspended ? "default" : "outline"} size="sm" onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {suspended ? "Reinstate" : "Suspend"}
    </Button>
  );
}
