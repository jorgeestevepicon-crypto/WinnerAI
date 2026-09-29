import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { WinningProductStatus } from "@prisma/client";

const STATUS_STYLES: Record<WinningProductStatus, { key: string; className: string }> = {
  CANDIDATE: { key: "candidate", className: "bg-muted text-muted-foreground border-border" },
  IN_TEST: { key: "inTest", className: "bg-warning/15 text-warning border-warning/30" },
  WINNER: { key: "winner", className: "bg-success/15 text-success border-success/30" },
  DISCARDED: { key: "discarded", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export async function WinningStatusBadge({ status, className }: { status: WinningProductStatus | null; className?: string }) {
  if (!status) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  const t = await getTranslations("winningProducts.status");
  const style = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", style.className, className)}>
      {t(style.key)}
    </span>
  );
}
