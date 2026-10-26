"use client";

import React from "react";
import { Building2, Clock, CheckCircle2, Users, X } from "lucide-react";
import { CompanyOvertimeSummary } from "../types";

interface CompanyOvertimeCardsProps {
  companies: CompanyOvertimeSummary[];
  selectedCompanyIds?: string[];
  onSelectCompany: (companyIdStr: string) => void;
  onClearCompanySelection: () => void;
}

export function CompanyOvertimeCards({
  companies,
  selectedCompanyIds = [],
  onSelectCompany,
  onClearCompanySelection,
}: CompanyOvertimeCardsProps) {
  const hasSelection = selectedCompanyIds.length > 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Subsidiary Overtime Summary ({companies.length})
          </h3>
        </div>

        {hasSelection && (
          <button
            onClick={onClearCompanySelection}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Clear selection ({selectedCompanyIds.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {companies.map((c) => {
          const isSelected = selectedCompanyIds.includes(String(c.companyId));
          const isOffline = c.status === "OFFLINE";

          return (
            <div
              key={c.companyId}
              onClick={() => onSelectCompany(String(c.companyId))}
              className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all text-left ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30"
                  : "border-border/70 bg-card hover:border-indigo-500/40 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {c.companyCode}
                  </span>
                  <p
                    className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5"
                    title={c.companyName}
                  >
                    {c.companyName}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isOffline
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {isOffline ? "Offline" : "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                <div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-indigo-500" /> Approved OT
                  </span>
                  <p className="font-bold text-foreground tabular-nums mt-0.5">
                    {c.approvedOtHours.toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">hrs</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Approval
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                    {c.otApprovalRate}%
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/30">
                <span className="flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" /> {c.totalEmployees} employees
                </span>
                <span>{c.totalOtRequests} requests</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
