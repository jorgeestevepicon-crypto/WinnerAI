import { cn } from "@/lib/utils";

export function classifyWinningScore(score: number) {
  if (score >= 90) return { label: "Exceptional", className: "bg-success/15 text-success border-success/30" };
  if (score >= 80) return { label: "Excellent", className: "bg-primary/15 text-primary border-primary/30" };
  if (score >= 70) return { label: "Strong", className: "bg-accent text-accent-foreground border-accent" };
  if (score >= 60) return { label: "Moderate", className: "bg-warning/15 text-warning border-warning/30" };
  return { label: "Weak", className: "bg-muted text-muted-foreground border-border" };
}

export function WinningScoreBadge({ score, className }: { score: number | null | undefined; className?: string }) {
  if (score === null || score === undefined) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Not scored</span>;
  }
  const { label, className: badgeClass } = classifyWinningScore(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", badgeClass, className)}>
      <span className="font-semibold">{Math.round(score)}</span>
      {label}
    </span>
  );
}
