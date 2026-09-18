"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { deleteStore } from "@/features/stores/server/actions";

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteStore(storeId);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Store deleted");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete store</span>
      </Button>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Delete &quot;{storeName}&quot;?</DialogTitle>
          <DialogDescription>
            This removes the store from your list and the Store Builder&apos;s product picker. It won&apos;t be reachable from the app anymore.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
