"use client";

import React from "react";
import { Building2, Check, Clock, CalendarDays } from "lucide-react";
import { CompanyLeaveOtSummary } from "../types";
import { Progress } from "@/components/ui/progress";

interface CompanyLeaveCardsProps {
  companies: CompanyLeaveOtSummary[];
  selectedCompanyIds?: string[];
  onSelectCompany?: (companyIdStr: string) => void;
  onClearCompanySelection?: () => void;
}

export function CompanyLeaveCards({
  companies,
  selectedCompanyIds = [],
  onSelectCompany,
  onClearCompanySelection,
}: CompanyLeaveCardsProps) {
  if (!companies || companies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-cyan-500" />
          <span>Intercompany Overtime & Leave Overview ({companies.length} Operating Entities)</span>
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {selectedCompanyIds.length > 0 ? (
            <>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                {selectedCompanyIds.length} Selected (Filtering entire dashboard)
              </span>
              {onClearCompanySelection && (
                <button
                  type="button"
                  onClick={onClearCompanySelection}
                  className="text-xs underline hover:text-foreground transition-colors ml-1"
                >
                  Clear Selection
                </button>
              )}
            </>
          ) : (
            <span>Click any card to filter entire dashboard</span>
          )}
        </div>
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
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}

              <div className="flex items-center justify-between mb-1.5 pr-5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  {c.companyCode}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {c.totalEmployees} staff
                </span>
              </div>

              <h4 className="text-xs font-bold text-foreground truncate mb-2">
                {c.companyName}
              </h4>

              {/* Overtime Metric */}
              <div className="space-y-1 mb-2.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-500" />
                    Approved OT
                  </span>
                  <span className="font-bold text-foreground tabular-nums">
                    {c.approvedOtHours} hrs
                  </span>
                </div>
                <Progress
                  value={c.otApprovalRate}
                  className="h-1.5 bg-muted"
                />
              </div>

              {/* Stats Breakdown Footer */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/60 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">OT Reqs:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {c.approvedOtRequests}/{c.totalOtRequests}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-0.5">
                    <CalendarDays className="h-3 w-3 text-purple-500" />
                    Leave:
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {c.approvedLeaveDays}d
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
