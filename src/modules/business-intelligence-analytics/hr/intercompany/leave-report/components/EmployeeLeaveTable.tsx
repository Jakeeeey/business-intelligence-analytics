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
  CalendarDays,
  Users,
} from "lucide-react";
import {
  EmployeeLeaveAndOtSummary,
  LeaveSortField,
  LeaveSortOrder,
} from "../types";

interface EmployeeLeaveTableProps {
  records: EmployeeLeaveAndOtSummary[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: LeaveSortField;
  sortOrder: LeaveSortOrder;
  onSort: (field: LeaveSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (emp: EmployeeLeaveAndOtSummary) => void;
  loading: boolean;
}

export function EmployeeLeaveTable({
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
}: EmployeeLeaveTableProps) {
  const renderSortIcon = (field: LeaveSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-cyan-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-cyan-500" />
    );
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-500" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Employee Overtime & Leave Summary
          </h3>
          <span className="text-xs text-muted-foreground">
            ({totalRecords.toLocaleString()} Personnel)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              {/* Employee */}
              <TableHead className="min-w-[190px]">
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Employee {renderSortIcon("name")}
                </button>
              </TableHead>

              {/* Company */}
              <TableHead className="min-w-[170px]">
                <button
                  type="button"
                  onClick={() => onSort("company")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Company {renderSortIcon("company")}
                </button>
              </TableHead>

              {/* Department */}
              <TableHead className="min-w-[150px]">
                <button
                  type="button"
                  onClick={() => onSort("department")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Department {renderSortIcon("department")}
                </button>
              </TableHead>

              {/* Total Overtime Requests */}
              <TableHead className="text-center w-28">
                <button
                  type="button"
                  onClick={() => onSort("totalOtRequests")}
                  className="flex items-center justify-center w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Total OT Reqs {renderSortIcon("totalOtRequests")}
                </button>
              </TableHead>

              {/* Approved Overtime Requests */}
              <TableHead className="text-center w-28">
                <button
                  type="button"
                  onClick={() => onSort("approvedOtRequests")}
                  className="flex items-center justify-center w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Approved Reqs {renderSortIcon("approvedOtRequests")}
                </button>
              </TableHead>

              {/* Total Overtime Rendered */}
              <TableHead className="text-right w-28">
                <button
                  type="button"
                  onClick={() => onSort("totalOtHours")}
                  className="flex items-center justify-end w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Total OT {renderSortIcon("totalOtHours")}
                </button>
              </TableHead>

              {/* Total Approved Overtime */}
              <TableHead className="text-right w-32">
                <button
                  type="button"
                  onClick={() => onSort("approvedOtHours")}
                  className="flex items-center justify-end w-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-foreground transition-colors"
                >
                  Approved OT {renderSortIcon("approvedOtHours")}
                </button>
              </TableHead>

              {/* Approved Leave Days */}
              <TableHead className="text-right w-28">
                <button
                  type="button"
                  onClick={() => onSort("approvedLeaveDays")}
                  className="flex items-center justify-end w-full text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-foreground transition-colors"
                >
                  Leave Days {renderSortIcon("approvedLeaveDays")}
                </button>
              </TableHead>

              {/* Actions */}
              <TableHead className="text-right w-24 text-xs font-semibold text-muted-foreground pr-4">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={9} className="py-4">
                    <div className="h-6 w-full rounded-md bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Clock className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">No records found</p>
                    <p className="text-xs">Try adjusting your filters or date range.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow
                  key={`${r.companyId}-${r.userId}`}
                  className="border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  {/* Employee */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-500/20">
                        {r.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{r.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {r.employeeId}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shrink-0">
                        {r.companyCode}
                      </span>
                      <span className="text-xs text-foreground truncate" title={r.companyName}>
                        {r.companyName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {r.department}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.position}</p>
                    </div>
                  </TableCell>

                  {/* Total OT Requests */}
                  <TableCell className="text-center text-xs font-mono tabular-nums">
                    {r.totalOtRequests}
                  </TableCell>

                  {/* Approved OT Requests */}
                  <TableCell className="text-center text-xs font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {r.approvedOtRequests}
                  </TableCell>

                  {/* Total OT Rendered */}
                  <TableCell className="text-right text-xs font-mono tabular-nums">
                    {r.totalOtHours} hrs
                  </TableCell>

                  {/* Approved OT Hours */}
                  <TableCell className="text-right text-xs font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {r.approvedOtHours > 0 ? `${r.approvedOtHours} hrs` : "0 hrs"}
                  </TableCell>

                  {/* Approved Leave Days */}
                  <TableCell className="text-right text-xs font-mono tabular-nums text-purple-600 dark:text-purple-400">
                    <span className="flex items-center justify-end gap-1">
                      <CalendarDays className="h-3 w-3 text-purple-500/70" />
                      {r.approvedLeaveDays} d
                    </span>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(r)}
                      className="h-7 px-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-500/10"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
          <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
          <span className="font-semibold text-foreground">{totalRecords.toLocaleString()}</span>{" "}
          personnel
        </div>

        <div className="flex items-center gap-1 self-center sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 font-medium text-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
