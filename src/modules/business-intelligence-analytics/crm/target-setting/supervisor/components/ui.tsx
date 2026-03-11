"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const tone =
    s === "APPROVED"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : s === "REJECTED"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : s === "PENDING"
      ? "bg-amber-100 text-amber-900 border-amber-200"
      : "bg-zinc-100 text-zinc-900 border-zinc-200";

  return (
    <Badge variant="outline" className={cn("rounded-full", tone)}>
      {s || "DRAFT"}
    </Badge>
  );
}
