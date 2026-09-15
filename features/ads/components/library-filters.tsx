"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function LibraryFilters({ platforms, styles }: { platforms: string[]; styles: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function applyParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={searchParams.get("platform") ?? "all"} onValueChange={(v) => applyParams({ platform: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All platforms</SelectItem>
          {platforms.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("style") ?? "all"} onValueChange={(v) => applyParams({ style: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All styles</SelectItem>
          {styles.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Checkbox
          id="favoritesOnly"
          checked={searchParams.get("favoritesOnly") === "true"}
          onCheckedChange={(v) => applyParams({ favoritesOnly: v ? "true" : undefined })}
        />
        <Label htmlFor="favoritesOnly" className="font-normal">
          Favorites only
        </Label>
      </div>
    </div>
  );
}
