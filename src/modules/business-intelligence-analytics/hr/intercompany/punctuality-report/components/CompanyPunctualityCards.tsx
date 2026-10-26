"use client";

import React from "react";
import { Building2, Check, Clock } from "lucide-react";
import { CompanyPunctualitySummary } from "../types";
import { Progress } from "@/components/ui/progress";

interface CompanyPunctualityCardsProps {
  companies: CompanyPunctualitySummary[];
  selectedCompanyIds?: string[];
  onSelectCompany?: (companyIdStr: string) => void;
}

export function CompanyPunctualityCards({
  companies,
  selectedCompanyIds = [],
  onSelectCompany,
}: CompanyPunctualityCardsProps) {
  if (!companies || companies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-cyan-500" />
          <span>Intercompany Punctuality Overview ({companies.length} Operating Entities)</span>
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {selectedCompanyIds.length > 0
            ? `${selectedCompanyIds.length} Selected (Click to toggle)`
            : "Click any card to filter"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {companies.map((c) => {
          const compIdStr = String(c.companyId);
          const isSelected = selectedCompanyIds.includes(compIdStr);

          return (
            <button
              key={c.companyId}
              type="button"
              onClick={() => onSelectCompany && onSelectCompany(compIdStr)}
              className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/30 shadow-sm ring-1 ring-cyan-500"
                  : "border-border bg-card hover:border-cyan-500/40 hover:bg-muted/40"
              }`}
            >
              {/* Active Selection Check Indicator */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}

              {/* Header: Code & Status */}
              <div className="flex items-center justify-between mb-1.5 pr-5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  {c.companyCode}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {c.totalEmployees} staff
                </span>
              </div>

              {/* Company Name */}
              <h4 className="text-xs font-bold text-foreground truncate mb-2">
                {c.companyName}
              </h4>

              {/* Punctuality Rate Metric */}
              <div className="space-y-1 mb-2.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground">On-Time Rate</span>
                  <span
                    className={`font-bold tabular-nums ${
                      c.punctualityRate >= 90
                        ? "text-emerald-600 dark:text-emerald-400"
                        : c.punctualityRate >= 75
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {c.punctualityRate}%
                  </span>
                </div>
                <Progress
                  value={c.punctualityRate}
                  className="h-1.5 bg-muted"
                />
              </div>

              {/* Stats Breakdown Footer */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/60 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Late:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {c.totalLateCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3 text-cyan-500" />
                    Avg:
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {c.avgDelayMinutes}m
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
