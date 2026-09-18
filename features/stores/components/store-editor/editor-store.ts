"use client";

import { create } from "zustand";
import type { StoreDocument, StoreSectionData, SectionType } from "@/features/stores/schemas";

const MAX_HISTORY = 30;

// Sentinel selectedSectionId value for the brand panel — brand isn't a
// section in the document.sections array, but reuses the same
// select/settings-panel plumbing as a section would.
export const BRAND_PANEL_ID = "__brand__";

// Sentinel selectedSectionId value for the store settings panel (SEO,
// policies) — these live in the separate StoreSettings table, not the
// document JSON, but reuse the same select/settings-panel plumbing.
export const SETTINGS_PANEL_ID = "__settings__";

export interface EditorVersionEntry {
  version: number;
  createdBy: string;
  createdAt: Date;
}

interface EditorState {
  document: StoreDocument;
  selectedSectionId: string | null;
  device: "desktop" | "tablet" | "mobile";
  past: StoreDocument[];
  future: StoreDocument[];
  dirty: boolean;
  versions: EditorVersionEntry[];
  initVersions: (versions: EditorVersionEntry[]) => void;
  addVersion: (entry: EditorVersionEntry) => void;

  setDocument: (doc: StoreDocument, opts?: { fromHistory?: boolean }) => void;
  selectSection: (id: string | null) => void;
  setDevice: (device: EditorState["device"]) => void;
  updateSectionSettings: (id: string, settings: Record<string, unknown>) => void;
  updateBrand: (patch: Partial<StoreDocument["brand"]>) => void;
  moveSection: (id: string, direction: "up" | "down") => void;
  toggleHidden: (id: string) => void;
  duplicateSection: (id: string) => void;
  deleteSection: (id: string) => void;
  addSection: (type: SectionType) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
}

function reorder(sections: StoreSectionData[]): StoreSectionData[] {
  return sections.map((s, i) => ({ ...s, order: i }));
}

const DEFAULT_SETTINGS: Record<SectionType, Record<string, unknown>> = {
  hero: { headline: "New headline", subtitle: "New subtitle", ctaLabel: "Shop now" },
  benefits: { title: "Why you'll love it", items: [{ title: "Benefit", description: "Description" }] },
  product: { title: "Product name", description: "Product description", bullets: ["Feature one"], ctaLabel: "Add to cart" },
  socialProof: { title: "What customers say", isPlaceholder: true, note: "Placeholder — add real reviews later." },
  faq: { title: "FAQ", items: [{ question: "Question?", answer: "Answer." }] },
  guarantee: { title: "Our promise", description: "Describe your real guarantee here." },
  cta: { headline: "Ready to try it?", ctaLabel: "Get yours" },
  footer: { text: "© Your Brand" },
};

export function createEmptySection(type: SectionType, order: number): StoreSectionData {
  return { id: `${type}-${Date.now()}`, type, order, hidden: false, settings: DEFAULT_SETTINGS[type] } as StoreSectionData;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  document: { brand: { name: "", slogan: "", description: "", logoConcept: "" }, theme: { primaryColor: "#111827", secondaryColor: "#6b7280", accentColor: "#111827", backgroundColor: "#ffffff", headingFont: "Inter", bodyFont: "Inter", style: "minimal" }, sections: [] },
  selectedSectionId: null,
  device: "desktop",
  past: [],
  future: [],
  dirty: false,
  versions: [],

  initVersions: (versions) => set({ versions }),
  addVersion: (entry) => set((state) => ({ versions: [entry, ...state.versions] })),

  setDocument: (doc, opts) => {
    if (opts?.fromHistory) {
      set({ document: doc });
      return;
    }
    const { document, past } = get();
    set({
      past: [...past, document].slice(-MAX_HISTORY),
      future: [],
      document: doc,
      dirty: true,
    });
  },

  selectSection: (id) => set({ selectedSectionId: id }),
  setDevice: (device) => set({ device }),

  updateSectionSettings: (id, settings) => {
    const { document, setDocument } = get();
    const sections = document.sections.map((s) => (s.id === id ? ({ ...s, settings: { ...s.settings, ...settings } } as StoreSectionData) : s));
    setDocument({ ...document, sections });
  },

  updateBrand: (patch) => {
    const { document, setDocument } = get();
    setDocument({ ...document, brand: { ...document.brand, ...patch } });
  },

  moveSection: (id, direction) => {
    const { document, setDocument } = get();
    const index = document.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= document.sections.length) return;
    const sections = [...document.sections];
    [sections[index], sections[swapWith]] = [sections[swapWith], sections[index]];
    setDocument({ ...document, sections: reorder(sections) });
  },

  toggleHidden: (id) => {
    const { document, setDocument } = get();
    const sections = document.sections.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)) as StoreSectionData[];
    setDocument({ ...document, sections });
  },

  duplicateSection: (id) => {
    const { document, setDocument } = get();
    const index = document.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const original = document.sections[index];
    const copy: StoreSectionData = { ...original, id: `${original.type}-${Date.now()}` };
    const sections = [...document.sections];
    sections.splice(index + 1, 0, copy);
    setDocument({ ...document, sections: reorder(sections) });
  },

  deleteSection: (id) => {
    const { document, setDocument } = get();
    const sections = document.sections.filter((s) => s.id !== id);
    setDocument({ ...document, sections: reorder(sections) });
  },

  addSection: (type) => {
    const { document, setDocument } = get();
    const section = createEmptySection(type, document.sections.length);
    setDocument({ ...document, sections: [...document.sections, section] });
  },

  undo: () => {
    const { past, document, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({ document: previous, past: past.slice(0, -1), future: [document, ...future].slice(0, MAX_HISTORY), dirty: true });
  },

  redo: () => {
    const { future, document, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ document: next, future: future.slice(1), past: [...past, document].slice(-MAX_HISTORY), dirty: true });
  },

  markSaved: () => set({ dirty: false }),
}));
