"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Renders a prospect probability (0–100) as a tinted pill.
 * High (>=70) emerald, medium (40–69) amber, low (<40) red — matching the
 * grouped table's probability treatment.
 */
export function ProbabilityBadge({
  value,
  className,
}: {
  value: number | string | null | undefined;
  className?: string;
}) {
  const num = parseFloat(String(value ?? "").replace("%", "").trim());

  if (!Number.isFinite(num)) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const toneClass =
    num >= 70
      ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : num >= 40
        ? "bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20"
        : "bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20";

  return (
    <Badge className={cn("rounded-full border px-2 py-0.5 font-bold select-none", toneClass, className)}>
      {num}%
    </Badge>
  );
}
