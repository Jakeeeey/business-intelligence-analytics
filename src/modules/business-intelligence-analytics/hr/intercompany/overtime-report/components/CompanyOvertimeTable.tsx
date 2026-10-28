"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Clock,
  CheckCircle2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Check,
  X,
} from "lucide-react";
import { CompanyOvertimeSummary } from "../types";

export type CompanySortField =
  | "companyCode"
  | "companyName"
  | "totalEmployees"
  | "totalActualOtHours"
  | "totalFiledOtHours"
  | "totalApprovedOtHours"
  | "totalOtRequests"
  | "otApprovalRate";

export type CompanySortOrder = "asc" | "desc";

interface CompanyOvertimeTableProps {
  companies: CompanyOvertimeSummary[];
  selectedCompanyIds?: string[];
  onSelectCompany: (companyIdStr: string) => void;
  onClearCompanySelection?: () => void;
  loading?: boolean;
}

export function CompanyOvertimeTable({
  companies,
  selectedCompanyIds = [],
  onSelectCompany,
  onClearCompanySelection,
  loading = false,
}: CompanyOvertimeTableProps) {
  const [sortField, setSortField] = useState<CompanySortField>("totalApprovedOtHours");
  const [sortOrder, setSortOrder] = useState<CompanySortOrder>("desc");

  const handleSort = (field: CompanySortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedCompanies = useMemo(() => {
    const list = [...companies];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "companyCode":
          cmp = a.companyCode.localeCompare(b.companyCode);
          break;
        case "companyName":
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case "totalEmployees":
          cmp = a.totalEmployees - b.totalEmployees;
          break;
        case "totalActualOtHours":
          cmp = a.totalActualOtHours - b.totalActualOtHours;
          break;
        case "totalFiledOtHours":
          cmp = a.totalFiledOtHours - b.totalFiledOtHours;
          break;
        case "totalApprovedOtHours":
          cmp = a.totalApprovedOtHours - b.totalApprovedOtHours;
          break;
        case "totalOtRequests":
          cmp = a.totalOtRequests - b.totalOtRequests;
          break;
        case "otApprovalRate":
          cmp = a.otApprovalRate - b.otApprovalRate;
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [companies, sortField, sortOrder]);

  // Aggregate totals
  const totals = useMemo(() => {
    return companies.reduce(
      (acc, c) => {
        acc.totalEmployees += c.totalEmployees;
        acc.totalActualOtHours += c.totalActualOtHours;
        acc.totalFiledOtHours += c.totalFiledOtHours;
        acc.totalApprovedOtHours += c.totalApprovedOtHours;
        acc.totalOtRequests += c.totalOtRequests;
        acc.approvedOtRequests += c.approvedOtRequests;
        acc.pendingOtRequests += c.pendingOtRequests;
        acc.rejectedOtRequests += c.rejectedOtRequests;
        return acc;
      },
      {
        totalEmployees: 0,
        totalActualOtHours: 0,
        totalFiledOtHours: 0,
        totalApprovedOtHours: 0,
        totalOtRequests: 0,
        approvedOtRequests: 0,
        pendingOtRequests: 0,
        rejectedOtRequests: 0,
      }
    );
  }, [companies]);

  const overallApprovalRate =
    totals.totalOtRequests > 0
      ? Math.round((totals.approvedOtRequests / totals.totalOtRequests) * 100)
      : 0;

  const renderSortIndicator = (field: CompanySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-indigo-500 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-500 ml-1 inline" />
    );
  };

  const hasSelection = selectedCompanyIds.length > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Subsidiary Overtime Summary Table
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
            {companies.length} Companies
          </span>
          {hasSelection && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
              {selectedCompanyIds.length} filtered
            </span>
          )}
        </div>

        {hasSelection && onClearCompanySelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompanySelection}
            className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear Company Filter ({selectedCompanyIds.length})
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead
                onClick={() => handleSort("companyCode")}
                className="cursor-pointer text-xs font-semibold select-none min-w-[200px]"
              >
                Subsidiary / Company {renderSortIndicator("companyCode")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalEmployees")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Employees {renderSortIndicator("totalEmployees")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalActualOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right min-w-[130px]"
              >
                Actual Overtime {renderSortIndicator("totalActualOtHours")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalFiledOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right min-w-[130px]"
              >
                Filed Overtime {renderSortIndicator("totalFiledOtHours")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalApprovedOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right min-w-[140px]"
              >
                Actual Approved {renderSortIndicator("totalApprovedOtHours")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("totalOtRequests")}
                className="cursor-pointer text-xs font-semibold select-none text-right min-w-[140px]"
              >
                Request Count {renderSortIndicator("totalOtRequests")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("otApprovalRate")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Approval % {renderSortIndicator("otApprovalRate")}
              </TableHead>
              <TableHead className="text-right text-xs font-semibold select-none w-28">
                Filter
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={8} className="py-3">
                    <div className="h-6 w-full rounded bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedCompanies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No company records match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedCompanies.map((c) => {
                const isSelected = selectedCompanyIds.includes(String(c.companyId));
                const isOffline = c.status === "OFFLINE";

                return (
                  <TableRow
                    key={c.companyId}
                    className={`border-b border-border/40 text-xs transition-colors hover:bg-muted/40 ${
                      isSelected ? "bg-indigo-500/10 dark:bg-indigo-950/20" : ""
                    }`}
                  >
                    {/* Subsidiary Name & Code */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
                          {c.companyCode}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">
                            {c.companyName}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-semibold mt-0.5 px-1.5 py-0.2 rounded-full ${
                              isOffline
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {isOffline ? "Offline" : "Active"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Total Employees */}
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {c.totalEmployees}
                      </span>
                    </TableCell>

                    {/* 1. Actual Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span className="font-bold text-foreground">
                        {c.totalActualOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({Math.round(c.totalActualOtHours * 60).toLocaleString()}m)
                      </span>
                    </TableCell>

                    {/* 2. Filed Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span className="font-medium text-foreground">
                        {c.totalFiledOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({c.totalOtMinutes.toLocaleString()}m)
                      </span>
                    </TableCell>

                    {/* 3. Actual Approved Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${
                          c.totalApprovedOtHours > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Clock className="h-3 w-3 text-emerald-500 shrink-0" />
                        {c.totalApprovedOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({c.approvedOtMinutes.toLocaleString()}m)
                      </span>
                    </TableCell>

                    {/* 4. Request Count */}
                    <TableCell className="text-right tabular-nums">
                      <span className="font-semibold text-foreground">
                        {c.totalOtRequests} requests
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {c.approvedOtRequests} appr
                        </span>
                        {c.pendingOtRequests > 0 && ` • ${c.pendingOtRequests} pend`}
                        {c.rejectedOtRequests > 0 && ` • ${c.rejectedOtRequests} rej`}
                      </span>
                    </TableCell>

                    {/* Approval Rate */}
                    <TableCell className="text-right tabular-nums">
                      {c.totalOtRequests > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            c.otApprovalRate >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : c.otApprovalRate >= 50
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {c.otApprovalRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectCompany(String(c.companyId))}
                        className={`h-7 px-2.5 text-xs rounded-lg ${
                          isSelected
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "border-border/80 hover:bg-muted"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Filtered
                          </>
                        ) : (
                          <>
                            <Filter className="h-3 w-3 mr-1" />
                            Filter
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Total Summary Row */}
            {sortedCompanies.length > 0 && (
              <TableRow className="border-t-2 border-border/80 bg-muted/30 font-semibold text-xs">
                <TableCell>
                  <span className="font-bold text-foreground">
                    All Subsidiaries Total ({companies.length})
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {totals.totalEmployees.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums text-indigo-700 dark:text-indigo-300 font-bold">
                  {Math.round(totals.totalActualOtHours * 10) / 10} hrs
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {Math.round(totals.totalFiledOtHours * 10) / 10} hrs
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                  {Math.round(totals.totalApprovedOtHours * 10) / 10} hrs
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {totals.totalOtRequests} reqs ({totals.approvedOtRequests} approved)
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground font-bold">
                  {overallApprovalRate}%
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-[11px]">
                  Summary
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
