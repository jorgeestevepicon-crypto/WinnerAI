import { cn } from "@/lib/utils";
import type { WinningProductStatus } from "@prisma/client";

const STATUS_STYLES: Record<WinningProductStatus, { label: string; className: string }> = {
  CANDIDATE: { label: "Candidate", className: "bg-muted text-muted-foreground border-border" },
  IN_TEST: { label: "In test", className: "bg-warning/15 text-warning border-warning/30" },
  WINNER: { label: "Winner", className: "bg-success/15 text-success border-success/30" },
  DISCARDED: { label: "Discarded", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function WinningStatusBadge({ status, className }: { status: WinningProductStatus | null; className?: string }) {
  if (!status) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  const style = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", style.className, className)}>
      {style.label}
    </span>
  );
}
