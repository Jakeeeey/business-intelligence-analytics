// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/RelationshipView.tsx
"use client";

import React from "react";
import type { GroupedPdp } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Package, FileSpreadsheet, Calendar, ArrowRight } from "lucide-react";

type RelationshipViewProps = {
  data: GroupedPdp[];
};

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (["dispatched", "audited", "posted", "completed", "success"].includes(normalized)) {
    return "default"; // green/primary in active design systems
  }
  if (["pending", "processing", "draft", "created"].includes(normalized)) {
    return "secondary";
  }
  if (["cancelled", "failed", "rejected"].includes(normalized)) {
    return "destructive";
  }
  return "outline";
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
    });
  } catch {
    return dateStr;
  }
}

export function RelationshipView({ data }: RelationshipViewProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed rounded-lg">
        <p className="text-sm">No hierarchical audit records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((pdp) => (
        <Card key={pdp.pdpId || pdp.pdpNo} className="border border-border bg-card shadow-sm overflow-hidden">
          {/* PDP Header */}
          <div className="bg-muted/40 px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-card-foreground text-base">{pdp.pdpNo}</span>
                  <Badge variant={getStatusBadgeVariant(pdp.pdpStatus)}>
                    {pdp.pdpStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Pre-Dispatch Plan</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created: {formatDate(pdp.pdpCreatedAt)}</span>
            </div>
          </div>

          <CardContent className="p-5">
            {pdp.consolidators.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No consolidators linked to this Pre-Dispatch Plan.
              </div>
            ) : (
              <div className="space-y-4">
                {pdp.consolidators.map((c) => (
                  <div
                    key={c.consolidatorId || c.consolidatorNo}
                    className="group border border-border/80 hover:border-border rounded-xl p-4 bg-background transition-all"
                  >
                    {/* Consolidator Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-card-foreground">{c.consolidatorNo}</span>
                            <Badge variant={getStatusBadgeVariant(c.consolidatorStatus)} className="text-[10px] px-1.5 py-0">
                              {c.consolidatorStatus}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Consolidator</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(c.consolidatorCreatedAt)}</span>
                      </div>
                    </div>

                    {/* Connecting Visualizer or Dispatch Plans */}
                    <div className="pl-2 sm:pl-7 border-l-2 border-dashed border-border/60 ml-3 sm:ml-4 space-y-3">
                      {c.dispatchPlans.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-1">
                          No Dispatch Plans linked.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {c.dispatchPlans.map((dp) => (
                            <div
                              key={dp.dpId || dp.dpNo}
                              className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0 mt-0.5">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="font-semibold text-xs text-card-foreground truncate">{dp.dpNo}</span>
                                  <Badge variant={getStatusBadgeVariant(dp.dpStatus)} className="text-[9px] px-1.5 py-0 leading-normal shrink-0">
                                    {dp.dpStatus}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <span className="text-[9px] text-muted-foreground">Dispatch Plan</span>
                                  <span className="text-[9px] text-muted-foreground truncate">{formatDate(dp.dpCreatedAt)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
