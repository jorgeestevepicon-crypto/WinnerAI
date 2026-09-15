"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";
import type { StoreSectionData } from "@/features/stores/schemas";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SettingsPanel({ section }: { section: StoreSectionData }) {
  const updateSectionSettings = useEditorStore((s) => s.updateSectionSettings);

  function set(key: string, value: unknown) {
    updateSectionSettings(section.id, { [key]: value });
  }

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Field label="Headline">
            <Input value={section.settings.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <Textarea value={section.settings.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="CTA label">
            <Input value={section.settings.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </Field>
        </div>
      );
    case "product":
      return (
        <div className="space-y-3">
          <Field label="Title">
            <Input value={section.settings.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={section.settings.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Bullets">
            <ListEditor
              items={section.settings.bullets}
              onChange={(items) => set("bullets", items)}
              renderItem={(item, onChange) => <Input value={item} onChange={(e) => onChange(e.target.value)} />}
              newItem={() => "New feature"}
            />
          </Field>
          <Field label="CTA label">
            <Input value={section.settings.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </Field>
        </div>
      );
    case "benefits":
      return (
        <div className="space-y-3">
          <Field label="Title">
            <Input value={section.settings.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Items">
            <ListEditor
              items={section.settings.items}
              onChange={(items) => set("items", items)}
              renderItem={(item, onChange) => (
                <div className="space-y-1 rounded-md border p-2">
                  <Input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Title" />
                  <Textarea value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} placeholder="Description" />
                </div>
              )}
              newItem={() => ({ title: "New benefit", description: "Description" })}
            />
          </Field>
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <Field label="Title">
            <Input value={section.settings.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Questions">
            <ListEditor
              items={section.settings.items}
              onChange={(items) => set("items", items)}
              renderItem={(item, onChange) => (
                <div className="space-y-1 rounded-md border p-2">
                  <Input value={item.question} onChange={(e) => onChange({ ...item, question: e.target.value })} placeholder="Question" />
                  <Textarea value={item.answer} onChange={(e) => onChange({ ...item, answer: e.target.value })} placeholder="Answer" />
                </div>
              )}
              newItem={() => ({ question: "New question?", answer: "Answer" })}
            />
          </Field>
        </div>
      );
    case "socialProof":
      return (
        <div className="space-y-3">
          <Field label="Title">
            <Input value={section.settings.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Placeholder note">
            <Textarea value={section.settings.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
          <p className="text-xs text-muted-foreground">
            This section is always marked as a placeholder — WinnerAI never presents fabricated reviews as real.
          </p>
        </div>
      );
    case "guarantee":
      return (
        <div className="space-y-3">
          <Field label="Title">
            <Input value={section.settings.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={section.settings.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <Field label="Headline">
            <Input value={section.settings.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="CTA label">
            <Input value={section.settings.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </Field>
        </div>
      );
    case "footer":
      return (
        <Field label="Text">
          <Input value={section.settings.text} onChange={(e) => set("text", e.target.value)} />
        </Field>
      );
    default:
      return null;
  }
}

function ListEditor<T>({
  items,
  onChange,
  renderItem,
  newItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onChange: (item: T) => void) => React.ReactNode;
  newItem: () => T;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            {renderItem(item, (next) => {
              const copy = [...items];
              copy[i] = next;
              onChange(copy);
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, newItem()])}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  );
}
