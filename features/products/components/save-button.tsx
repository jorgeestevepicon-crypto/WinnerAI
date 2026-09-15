"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSaveProduct } from "@/features/products/server/actions";

export function SaveButton({ productId, saved, size = "sm" }: { productId: string; saved: boolean; size?: "sm" | "default" | "icon" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    setLoading(true);
    const result = await toggleSaveProduct(productId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      disabled={loading || pending}
      className={cn(size === "icon" && "shrink-0")}
    >
      {loading || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {size !== "icon" && (saved ? "Saved" : "Save")}
    </Button>
  );
}
