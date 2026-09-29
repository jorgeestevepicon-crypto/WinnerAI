"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runProductDiscovery } from "@/features/products/server/actions";
import { getAliExpressAuthUrl } from "@/features/aliexpress/server/actions";

export interface DiscoverableSource {
  id: string;
  label: string;
  configured: boolean;
  disabledReason?: string;
}

export function DiscoverButton({ sources, aliexpressConnected }: { sources: DiscoverableSource[]; aliexpressConnected: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(sources.find((s) => s.id === "demo")?.id ?? sources[0]?.id ?? "demo");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const selectedSource = sources.find((s) => s.id === sourceId);
  const needsKeyword = sourceId !== "demo";
  const needsAliExpressConnection = sourceId === "aliexpress" && selectedSource?.configured && !aliexpressConnected;

  async function handleSubmit() {
    setLoading(true);
    const result = await runProductDiscovery({ sourceId, query: query.trim() || undefined, category: category.trim() || undefined });
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

  async function handleConnectAliExpress() {
    setConnecting(true);
    const result = await getAliExpressAuthUrl();
    setConnecting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
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
            {needsAliExpressConnection && (
              <p className="text-xs text-muted-foreground">Connect your AliExpress account to search this source.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Category {needsKeyword && "(optional if you enter keywords below)"}</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Technology, Beauty, Home"
            />
            {needsKeyword && category.trim() && (
              <p className="text-xs text-muted-foreground">
                Saved products from this search will be tagged with the &quot;{category.trim()}&quot; category, so you can filter by it afterwards.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Search keywords {(!needsKeyword || category.trim()) && "(optional)"}</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={needsKeyword ? "e.g. wireless earbuds" : "Leave blank to browse the demo catalog"}
            />
          </div>
        </div>
        <DialogFooter>
          {needsAliExpressConnection ? (
            <Button onClick={handleConnectAliExpress} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect AliExpress
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={busy || (needsKeyword && !query.trim() && !category.trim()) || !selectedSource?.configured}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Search
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
