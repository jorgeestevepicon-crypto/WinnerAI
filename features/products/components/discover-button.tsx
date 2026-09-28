"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runProductDiscovery } from "@/features/products/server/actions";

export interface DiscoverableSource {
  id: string;
  label: string;
  configured: boolean;
  disabledReason?: string;
}

export function DiscoverButton({ sources }: { sources: DiscoverableSource[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(sources.find((s) => s.id === "demo")?.id ?? sources[0]?.id ?? "demo");
  const [query, setQuery] = useState("");

  const selectedSource = sources.find((s) => s.id === sourceId);
  const needsQuery = sourceId !== "demo";

  async function handleSubmit() {
    setLoading(true);
    const result = await runProductDiscovery({ sourceId, query: query.trim() || undefined });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.count === 0) {
      toast.info("No new products matched this search.");
      return;
    }
    toast.success(`Found ${result.count} products`);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const busy = loading || pending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="h-4 w-4" />
          Find products
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find products</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id} disabled={!source.configured}>
                    {source.label}
                    {!source.configured ? " (not configured)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSource && !selectedSource.configured && (
              <p className="text-xs text-muted-foreground">{selectedSource.disabledReason}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Search keywords {!needsQuery && "(optional)"}</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={needsQuery ? "e.g. wireless earbuds" : "Leave blank to browse the demo catalog"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={busy || (needsQuery && !query.trim()) || !selectedSource?.configured}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
