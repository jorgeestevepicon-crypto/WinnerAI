"use client";

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";
import { restoreStoreVersion } from "@/features/stores/server/actions";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";

export function VersionHistorySheet({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const versions = useEditorStore((s) => s.versions);
  const setDocument = useEditorStore((s) => s.setDocument);
  const addVersion = useEditorStore((s) => s.addVersion);

  async function handleRestore(version: number) {
    setRestoringVersion(version);
    const result = await restoreStoreVersion(storeId, version);
    setRestoringVersion(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDocument(result.document, { fromHistory: true });
    addVersion({ version: result.version, createdBy: "user", createdAt: new Date() });
    toast.success(`Restored version ${version}`);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4" /> Versions
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {versions.map((v, i) => (
            <div key={v.version} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">
                  Version {v.version} {i === 0 && <Badge className="ml-1">Current</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.createdBy === "ai" ? "AI edit" : "Manual edit"} · {relativeTime(v.createdAt)}
                </p>
              </div>
              {i !== 0 && (
                <Button size="sm" variant="outline" onClick={() => handleRestore(v.version)} disabled={restoringVersion === v.version}>
                  {restoringVersion === v.version && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Restore
                </Button>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
