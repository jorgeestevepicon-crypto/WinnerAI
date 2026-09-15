"use client";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";
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
