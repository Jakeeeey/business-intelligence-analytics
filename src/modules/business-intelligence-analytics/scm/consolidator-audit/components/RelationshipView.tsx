// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/RelationshipView.tsx
"use client";

import React from "react";
import type { GroupedPdp } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Package,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";

type RelationshipViewProps = {
  data: GroupedPdp[];
};

// Premium, custom status badge stylings
function getStatusBadgeStyle(status: string): string {
  const normalized = status.toLowerCase();
  if (
    ["dispatched", "audited", "posted", "completed", "success"].includes(
      normalized
    )
  ) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30";
  }
  if (
    ["pending", "processing", "draft", "created"].includes(normalized)
  ) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30";
  }
  if (["cancelled", "failed", "rejected"].includes(normalized)) {
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-500/30";
  }
  return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    });
  } catch {
    return dateStr;
  }
}

export function RelationshipView({ data }: RelationshipViewProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed rounded-lg dark:border-zinc-700">
        <p className="text-sm">No hierarchical audit records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((pdp) => (
        <Card
          key={pdp.pdpId || pdp.pdpNo}
          className="border-l-4 border-l-blue-500 dark:border-zinc-700 dark:border-l-blue-500 bg-card shadow-sm overflow-hidden transition-all duration-300"
        >
          {/* PDP Header */}
          <div className="bg-muted/30 dark:bg-muted/10 px-5 py-4 border-b dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-card-foreground text-base tracking-tight">
                    {pdp.pdpNo}
                  </span>
                  <Badge variant="outline" className={`text-xs px-2 py-0 font-bold uppercase tracking-wider ${getStatusBadgeStyle(pdp.pdpStatus)}`}>
                    {pdp.pdpStatus}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  Pre-Dispatch Plan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created: {formatDate(pdp.pdpCreatedAt)}</span>
            </div>
          </div>

          <CardContent className="p-6">
            {pdp.consolidators.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                No consolidators linked to this Pre-Dispatch Plan.
              </div>
            ) : (
              <div className="relative pl-4 border-l border-zinc-200/80 dark:border-zinc-800 ml-4 space-y-6">
                {pdp.consolidators.map((c) => (
                  <div
                    key={c.consolidatorId || c.consolidatorNo}
                    className="relative group"
                  >
                    {/* Visual node bullet for tree structure */}
                    <div className="absolute -left-[21px] top-4 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-background dark:ring-card" />

                    <div className="border-l-4 border-l-sky-500 dark:border-zinc-700 dark:border-l-sky-500 rounded-xl p-4 bg-muted/20 dark:bg-zinc-900/30 hover:bg-muted/40 dark:hover:bg-zinc-900/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      {/* Consolidator Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md shrink-0">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-card-foreground">
                                {c.consolidatorNo}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                                  c.consolidatorStatus
                                )}`}
                              >
                                {c.consolidatorStatus}
                              </Badge>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                              Consolidator
                            </p>
                          </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 self-start sm:self-auto">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Created: {formatDate(c.consolidatorCreatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Dispatch Plans tree node connection */}
                      <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800/80 ml-3.5 space-y-3">
                        {c.dispatchPlans.length === 0 ? (
                          <div className="text-xs text-muted-foreground py-1 font-medium italic">
                            No Dispatch Plans linked.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {c.dispatchPlans.map((dp) => (
                              <div
                                key={dp.dpId || dp.dpNo}
                                className="relative group/dp flex items-start gap-2.5 p-3 rounded-lg border-l-4 border-l-emerald-500 dark:border-zinc-700 dark:border-l-emerald-500 bg-background hover:bg-muted/10 dark:hover:bg-zinc-800/20 hover:shadow-sm transition-all duration-200"
                              >
                                <div className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0 mt-0.5">
                                  <FileSpreadsheet className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 justify-between flex-wrap">
                                    <span className="font-bold text-xs text-card-foreground truncate">
                                      {dp.dpNo}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider leading-normal shrink-0 ${getStatusBadgeStyle(
                                        dp.dpStatus
                                      )}`}
                                    >
                                      {dp.dpStatus}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    <span>
                                      Dispatch Plan
                                    </span>
                                    <span className="truncate normal-case font-medium">
                                      {formatDate(dp.dpCreatedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
