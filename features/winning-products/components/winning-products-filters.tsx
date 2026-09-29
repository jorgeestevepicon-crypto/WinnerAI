"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "CANDIDATE", label: "Candidate" },
  { value: "IN_TEST", label: "In test" },
  { value: "WINNER", label: "Winner" },
  { value: "DISCARDED", label: "Discarded" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "status", label: "Status" },
  { value: "margin", label: "Margin" },
  { value: "orders", label: "Orders" },
  { value: "createdAt", label: "Newest" },
];

export function WinningProductsFilters() {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => applyParams({ status: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">Min score</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minScore") ?? ""}
          onBlur={(e) => applyParams({ minScore: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">Min margin %</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minMargin") ?? ""}
          onBlur={(e) => applyParams({ minMargin: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">Min orders</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minOrders") ?? ""}
          onBlur={(e) => applyParams({ minOrders: e.target.value || undefined })}
        />
      </div>

      <Select value={searchParams.get("sortBy") ?? "score"} onValueChange={(v) => applyParams({ sortBy: v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
