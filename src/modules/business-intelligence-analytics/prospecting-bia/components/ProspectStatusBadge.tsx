"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProspectStatus } from "../types";
import {
  PROSPECT_STATUS_LABEL,
  PROSPECT_STATUS_PILL,
  normalizeProspectStatus,
} from "../utils/prospect-status";

/**
 * Semantic status pill for a prospect — a solid fill using the same semantic
 * tokens (info / warning / success / destructive) as the status tabs, so the
 * hue matches everywhere the status appears.
 */
export function ProspectStatusBadge({
  status,
  className,
}: {
  status: ProspectStatus | string | null | undefined;
  className?: string;
}) {
  const normalized = normalizeProspectStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn("border font-semibold", PROSPECT_STATUS_PILL[normalized], className)}
    >
      {PROSPECT_STATUS_LABEL[normalized]}
    </Badge>
  );
}
