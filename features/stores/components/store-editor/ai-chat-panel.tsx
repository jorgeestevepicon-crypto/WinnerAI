"use client";

import { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyStoreAIEdit } from "@/features/stores/server/actions";
import { useEditorStore } from "@/features/stores/components/store-editor/editor-store";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = ["Make the hero more premium", "Make the copy shorter", "Change the primary color to black", "Add a FAQ section"];

export function AIChatPanel({ storeId }: { storeId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Tell me how you'd like to change this store — for example \"make it more premium\" or \"change the accent color to blue\"." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const setDocument = useEditorStore((s) => s.setDocument);
  const addVersion = useEditorStore((s) => s.addVersion);

  async function send(instruction: string) {
    if (!instruction.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: instruction }]);
    setInput("");
    setLoading(true);

    const result = await applyStoreAIEdit(storeId, instruction);
    setLoading(false);

    if (!result.success) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Couldn't apply that change: ${result.error}` }]);
      toast.error(result.error);
      return;
    }

    setDocument(result.document, { fromHistory: true });
    addVersion({ version: result.version, createdBy: "ai", createdAt: new Date() });
    setMessages((prev) => [...prev, { role: "assistant", content: "Done — I've updated the store. You can undo this like any other change." }]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Edit with AI
        </p>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-6 rounded-lg bg-primary/10 p-2 text-sm" : "mr-6 rounded-lg bg-muted p-2 text-sm"}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="mr-6 flex items-center gap-2 rounded-lg bg-muted p-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="space-y-2 border-t p-3">
        <div className="flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe a change..." disabled={loading} />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
