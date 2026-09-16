"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEditorStore, BRAND_PANEL_ID } from "@/features/stores/components/store-editor/editor-store";
import { SectionRenderer } from "@/features/stores/components/store-editor/section-renderer";

const DEVICE_WIDTH: Record<string, string> = {
  desktop: "w-full",
  tablet: "w-[768px]",
  mobile: "w-[390px]",
};

export function Canvas() {
  const document = useEditorStore((s) => s.document);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const selectSection = useEditorStore((s) => s.selectSection);
  const device = useEditorStore((s) => s.device);

  const visibleSections = document.sections.filter((s) => !s.hidden);

  return (
    <div className="flex h-full justify-center overflow-y-auto bg-muted/40 p-6">
      <div className={cn("mx-auto min-h-full rounded-lg border bg-white shadow-sm transition-all", DEVICE_WIDTH[device])}>
        <div
          onClick={() => selectSection(BRAND_PANEL_ID)}
          className={cn(
            "flex cursor-pointer items-center gap-2 border-b px-4 py-3 outline outline-2 outline-transparent hover:outline-primary/40",
            selectedSectionId === BRAND_PANEL_ID && "outline-primary"
          )}
        >
          {document.brand.logoUrl ? (
            <Image src={document.brand.logoUrl} alt={`${document.brand.name} logo`} width={28} height={28} className="h-7 w-7 rounded object-cover" unoptimized />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
              {document.brand.name.slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <span className="text-sm font-semibold" style={{ color: document.theme.primaryColor }}>
            {document.brand.name || "Untitled brand"}
          </span>
        </div>
        {visibleSections.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No visible sections</div>
        ) : (
          document.sections.map((section) =>
            section.hidden ? null : (
              <div
                key={section.id}
                onClick={() => selectSection(section.id)}
                className={cn(
                  "cursor-pointer outline outline-2 outline-transparent transition-all hover:outline-primary/40",
                  selectedSectionId === section.id && "outline-primary"
                )}
              >
                <SectionRenderer section={section} theme={document.theme} />
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
