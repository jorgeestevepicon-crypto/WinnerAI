"use client";

import Link from "next/link";
import { ArrowLeft, Undo2, Redo2, Monitor, Tablet, Smartphone, Check, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";
import { VersionHistorySheet } from "@/features/stores/components/store-editor/version-history-sheet";

export function Toolbar({ storeId, storeName, saving }: { storeId: string; storeName: string; saving: boolean }) {
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const device = useEditorStore((s) => s.device);
  const setDevice = useEditorStore((s) => s.setDevice);
  const dirty = useEditorStore((s) => s.dirty);

  return (
    <div className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/stores">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="truncate text-sm font-medium">{storeName}</span>

      <div className="ml-4 flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto flex items-center gap-1 rounded-lg border p-1">
        {[
          { value: "desktop" as const, icon: Monitor },
          { value: "tablet" as const, icon: Tablet },
          { value: "mobile" as const, icon: Smartphone },
        ].map((d) => (
          <Button
            key={d.value}
            variant={device === d.value ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setDevice(d.value)}
          >
            <d.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>

      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", dirty && "text-warning")}>
        {saving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
          </>
        ) : dirty ? (
          "Unsaved changes"
        ) : (
          <>
            <Check className="h-3.5 w-3.5" /> Saved
          </>
        )}
      </div>

      <VersionHistorySheet storeId={storeId} />
      <Button variant="default" size="sm" asChild>
        <Link href={`/stores/${storeId}/publish`}>
          <Rocket className="h-4 w-4" /> Publish
        </Link>
      </Button>
    </div>
  );
}
