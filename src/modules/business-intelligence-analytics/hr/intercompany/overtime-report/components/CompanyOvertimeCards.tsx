"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  Users,
  X,
  LayoutGrid,
  Table as TableIcon,
  FileText,
} from "lucide-react";
import { CompanyOvertimeSummary } from "../types";
import { CompanyOvertimeTable } from "./CompanyOvertimeTable";

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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const hasSelection = selectedCompanyIds.length > 0;

  return (
    <div className="space-y-3">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Subsidiary Overtime Summary ({companies.length})
          </h3>
          {hasSelection && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
              {selectedCompanyIds.length} filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSelection && (
            <button
              onClick={onClearCompanySelection}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Clear selection ({selectedCompanyIds.length})
            </button>
          )}

          {/* Cards vs Table View Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border/80">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Cards View"
            >
              <LayoutGrid className="h-3 w-3" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View (Actual | Filed | Approved | Request Count)"
            >
              <TableIcon className="h-3 w-3 text-indigo-500" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Render either Table View or Cards Grid */}
      {viewMode === "table" ? (
        <CompanyOvertimeTable
          companies={companies}
          selectedCompanyIds={selectedCompanyIds}
          onSelectCompany={onSelectCompany}
          onClearCompanySelection={onClearCompanySelection}
        />
      ) : (
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

                {/* 3-way metrics in cards: Actual | Filed | Approved */}
                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-indigo-500" /> Actual OT
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {c.totalActualOtHours.toFixed(1)} hrs
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <FileText className="h-2.5 w-2.5 text-blue-500" /> Filed OT
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {c.totalFiledOtHours.toFixed(1)} hrs
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Actual Appr
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {c.totalApprovedOtHours.toFixed(1)} hrs
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" /> {c.totalEmployees} emps
                  </span>
                  <span className="font-semibold text-foreground">
                    {c.totalOtRequests} reqs ({c.otApprovalRate}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
