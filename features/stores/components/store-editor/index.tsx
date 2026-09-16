"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Toolbar } from "@/features/stores/components/store-editor/toolbar";
import { SidebarSections } from "@/features/stores/components/store-editor/sidebar-sections";
import { Canvas } from "@/features/stores/components/store-editor/canvas";
import { SettingsPanel } from "@/features/stores/components/store-editor/settings-panel";
import { BrandSettingsPanel } from "@/features/stores/components/store-editor/brand-settings-panel";
import { AIChatPanel } from "@/features/stores/components/store-editor/ai-chat-panel";
import { useEditorStore, BRAND_PANEL_ID, type EditorVersionEntry } from "@/features/stores/components/store-editor/editor-store";
import { updateStoreDocument } from "@/features/stores/server/actions";
import type { StoreDocument } from "@/features/stores/schemas";
import { EmptyState } from "@/components/shared/empty-state";
import { MousePointerClick } from "lucide-react";

const AUTOSAVE_DELAY_MS = 1500;

export function StoreEditor({
  storeId,
  storeName,
  initialDocument,
  initialVersions,
}: {
  storeId: string;
  storeName: string;
  initialDocument: StoreDocument;
  initialVersions: EditorVersionEntry[];
}) {
  const document = useEditorStore((s) => s.document);
  const dirty = useEditorStore((s) => s.dirty);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const setDocumentInStore = useEditorStore((s) => s.setDocument);
  const markSaved = useEditorStore((s) => s.markSaved);
  const initVersions = useEditorStore((s) => s.initVersions);
  const addVersion = useEditorStore((s) => s.addVersion);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!initialized.current) {
      setDocumentInStore(initialDocument, { fromHistory: true });
      initVersions(initialVersions);
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized.current || !dirty) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      const result = await updateStoreDocument(storeId, document);
      setSaving(false);
      if (!result.success) {
        toast.error(`Autosave failed: ${result.error}`);
        return;
      }
      markSaved();
      addVersion({ version: result.version, createdBy: "user", createdAt: new Date() });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, dirty, storeId]);

  const selectedSection = document.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="flex h-screen flex-col">
      <Toolbar storeId={storeId} storeName={storeName} saving={saving} />
      <div className="grid flex-1 grid-cols-[240px_1fr_280px] overflow-hidden">
        <div className="border-r">
          <SidebarSections />
        </div>
        <Canvas />
        <div className="flex flex-col border-l">
          <div className="flex-1 overflow-y-auto border-b p-4">
            {selectedSectionId === BRAND_PANEL_ID ? (
              <BrandSettingsPanel storeId={storeId} />
            ) : selectedSection ? (
              <SettingsPanel section={selectedSection} />
            ) : (
              <EmptyState icon={MousePointerClick} title="No section selected" description="Click a section in the canvas or the list to edit it." />
            )}
          </div>
          <div className="h-72 shrink-0">
            <AIChatPanel storeId={storeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
