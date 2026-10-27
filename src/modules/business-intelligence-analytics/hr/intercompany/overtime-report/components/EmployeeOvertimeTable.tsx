"use client";

import React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  EmployeeOvertimeSummary,
  OvertimeSortField,
  OvertimeSortOrder,
} from "../types";

interface EmployeeOvertimeTableProps {
  records: EmployeeOvertimeSummary[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: OvertimeSortField;
  sortOrder: OvertimeSortOrder;
  onSort: (field: OvertimeSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (emp: EmployeeOvertimeSummary) => void;
  loading: boolean;
}

export function EmployeeOvertimeTable({
  records,
  totalRecords,
  page,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  loading,
}: EmployeeOvertimeTableProps) {
  const renderSortIndicator = (field: OvertimeSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-indigo-500 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-500 ml-1 inline" />
    );
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Employee Overtime Directory
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono">
            {totalRecords} Employees
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg border-border/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead
                onClick={() => onSort("employeeId")}
                className="cursor-pointer text-xs font-semibold select-none w-28"
              >
                Employee ID {renderSortIndicator("employeeId")}
              </TableHead>
              <TableHead
                onClick={() => onSort("name")}
                className="cursor-pointer text-xs font-semibold select-none min-w-[180px]"
              >
                Employee Name {renderSortIndicator("name")}
              </TableHead>
              <TableHead
                onClick={() => onSort("company")}
                className="cursor-pointer text-xs font-semibold select-none"
              >
                Subsidiary {renderSortIndicator("company")}
              </TableHead>
              <TableHead
                onClick={() => onSort("department")}
                className="cursor-pointer text-xs font-semibold select-none"
              >
                Department / Role {renderSortIndicator("department")}
              </TableHead>
              <TableHead
                onClick={() => onSort("actualOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Actual OT (Hours) {renderSortIndicator("actualOtHours")}
              </TableHead>
              <TableHead
                onClick={() => onSort("filedOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Filed OT (Hours) {renderSortIndicator("filedOtHours")}
              </TableHead>
              <TableHead
                onClick={() => onSort("approvedOtHours")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Actual Approved OT {renderSortIndicator("approvedOtHours")}
              </TableHead>
              <TableHead
                onClick={() => onSort("totalOtRequests")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Requests (Appr/Total) {renderSortIndicator("totalOtRequests")}
              </TableHead>
              <TableHead
                onClick={() => onSort("approvalRate")}
                className="cursor-pointer text-xs font-semibold select-none text-right"
              >
                Approval % {renderSortIndicator("approvalRate")}
              </TableHead>
              <TableHead className="text-right text-xs font-semibold select-none w-20">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={10} className="py-3">
                    <div className="h-6 w-full rounded bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center text-xs text-muted-foreground">
                  No overtime employee records match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map((emp) => {
                const hasOt = emp.totalOtHours > 0 || emp.totalActualOtHours > 0;

                return (
                  <TableRow
                    key={`${emp.companyId}-${emp.userId}`}
                    className="hover:bg-muted/40 border-b border-border/40 text-xs transition-colors"
                  >
                    <TableCell className="font-mono font-medium text-muted-foreground">
                      {emp.employeeId}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground">
                          {emp.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-muted border border-border text-foreground">
                        {emp.companyCode}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{emp.department}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.position}</p>
                      </div>
                    </TableCell>

                    {/* 1. Actual Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span className="font-semibold text-foreground">
                        {emp.totalActualOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({emp.totalActualOtMinutes}m)
                      </span>
                    </TableCell>

                    {/* 2. Filed Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span className="font-medium text-foreground">
                        {emp.totalFiledOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({emp.totalFiledOtMinutes}m)
                      </span>
                    </TableCell>

                    {/* 3. Actual Approved Overtime */}
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${
                          emp.totalApprovedOtHours > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Clock className="h-3 w-3 text-emerald-500 shrink-0" />
                        {emp.totalApprovedOtHours.toFixed(1)} hrs
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({emp.totalApprovedOtMinutes}m)
                      </span>
                    </TableCell>

                    {/* Requests (Approved / Total) */}
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={`font-semibold ${
                          emp.approvedOtRequests > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {emp.approvedOtRequests}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {" "}/ {emp.totalOtRequests}
                      </span>
                      {emp.pendingOtRequests > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                          ({emp.pendingOtRequests} pending)
                        </span>
                      )}
                    </TableCell>

                    {/* Approval Rate */}
                    <TableCell className="text-right tabular-nums">
                      {hasOt ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            emp.approvalRate >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : emp.approvalRate >= 50
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {emp.approvalRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(emp)}
                        className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/10">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(page * pageSize, totalRecords)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{totalRecords}</span>{" "}
          employees
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="px-2 font-mono font-medium text-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
