"use client";

import Image from "next/image";
import { ArrowUp, ArrowDown, Copy, Trash2, Eye, EyeOff, Plus, Palette, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEditorStore, BRAND_PANEL_ID, SETTINGS_PANEL_ID } from "@/features/stores/components/store-editor/editor-store";
import type { SectionType } from "@/features/stores/schemas";

const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  benefits: "Benefits",
  product: "Product",
  socialProof: "Social Proof",
  faq: "FAQ",
  guarantee: "Guarantee",
  cta: "Call to Action",
  footer: "Footer",
};

const ADDABLE_TYPES: SectionType[] = ["hero", "benefits", "product", "socialProof", "faq", "guarantee", "cta", "footer"];

export function SidebarSections() {
  const document = useEditorStore((s) => s.document);
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId);
  const selectSection = useEditorStore((s) => s.selectSection);
  const moveSection = useEditorStore((s) => s.moveSection);
  const toggleHidden = useEditorStore((s) => s.toggleHidden);
  const duplicateSection = useEditorStore((s) => s.duplicateSection);
  const deleteSection = useEditorStore((s) => s.deleteSection);
  const addSection = useEditorStore((s) => s.addSection);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        <div
          onClick={() => selectSection(BRAND_PANEL_ID)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
            selectedSectionId === BRAND_PANEL_ID ? "border-primary bg-accent" : "hover:bg-accent/50"
          )}
        >
          {document.brand.logoUrl ? (
            <Image src={document.brand.logoUrl} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded object-cover" unoptimized />
          ) : (
            <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium">Brand</span>
        </div>
        <div
          onClick={() => selectSection(SETTINGS_PANEL_ID)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
            selectedSectionId === SETTINGS_PANEL_ID ? "border-primary bg-accent" : "hover:bg-accent/50"
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">Store settings</span>
        </div>
        <div className="my-2 border-t" />
        {document.sections.map((section, index) => (
          <div
            key={section.id}
            onClick={() => selectSection(section.id)}
            className={cn(
              "group flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm",
              selectedSectionId === section.id ? "border-primary bg-accent" : "hover:bg-accent/50",
              section.hidden && "opacity-50"
            )}
          >
            <span className="truncate">{SECTION_LABELS[section.type]}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveSection(section.id, "up"); }}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === document.sections.length - 1} onClick={(e) => { e.stopPropagation(); moveSection(section.id, "down"); }}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleHidden(section.id); }}>
                {section.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ADDABLE_TYPES.map((type) => (
              <DropdownMenuItem key={type} onClick={() => addSection(type)}>
                {SECTION_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
