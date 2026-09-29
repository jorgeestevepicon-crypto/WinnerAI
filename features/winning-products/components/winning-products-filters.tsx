"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WinningProductsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("winningProducts.filters");
  const tStatus = useTranslations("winningProducts.status");

  const STATUS_OPTIONS = [
    { value: "all", label: t("allStatuses") },
    { value: "CANDIDATE", label: tStatus("candidate") },
    { value: "IN_TEST", label: tStatus("inTest") },
    { value: "WINNER", label: tStatus("winner") },
    { value: "DISCARDED", label: tStatus("discarded") },
  ];

  const SORT_OPTIONS = [
    { value: "score", label: t("sortScore") },
    { value: "status", label: t("sortStatus") },
    { value: "margin", label: t("sortMargin") },
    { value: "orders", label: t("sortOrders") },
    { value: "createdAt", label: t("sortNewest") },
  ];

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
          <SelectValue placeholder={t("allStatuses")} />
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
        <Label className="whitespace-nowrap text-xs text-muted-foreground">{t("minScore")}</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minScore") ?? ""}
          onBlur={(e) => applyParams({ minScore: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">{t("minMargin")}</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minMargin") ?? ""}
          onBlur={(e) => applyParams({ minMargin: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">{t("minOrders")}</Label>
        <Input
          type="number"
          className="w-20"
          defaultValue={searchParams.get("minOrders") ?? ""}
          onBlur={(e) => applyParams({ minOrders: e.target.value || undefined })}
        />
      </div>

      <Select value={searchParams.get("sortBy") ?? "score"} onValueChange={(v) => applyParams({ sortBy: v })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue />
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
