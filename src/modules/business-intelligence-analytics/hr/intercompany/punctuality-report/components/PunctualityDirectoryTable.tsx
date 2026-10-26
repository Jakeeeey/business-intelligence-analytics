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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Plane,
  Users,
  Camera,
} from "lucide-react";
import {
  IntercompanyPunctualityRecord,
  PunctualitySortField,
  PunctualitySortOrder,
  PunctualityStatus,
} from "../types";

interface PunctualityDirectoryTableProps {
  records: IntercompanyPunctualityRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: PunctualitySortField;
  sortOrder: PunctualitySortOrder;
  onSort: (field: PunctualitySortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (record: IntercompanyPunctualityRecord) => void;
  loading: boolean;
}

export function PunctualityDirectoryTable({
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
}: PunctualityDirectoryTableProps) {
  const renderSortIcon = (field: PunctualitySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-cyan-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-cyan-500" />
    );
  };

  const renderStatusBadge = (status: PunctualityStatus, delay: number, hasFiledLeave?: boolean) => {
    let badgeClass = "";
    let icon = null;

    switch (status) {
      case "On Time":
        badgeClass =
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        icon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
        break;
      case "Grace Period":
        badgeClass =
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        icon = <Clock className="h-3 w-3 shrink-0" />;
        break;
      case "Moderate Late":
        badgeClass =
          "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
        icon = <AlertTriangle className="h-3 w-3 shrink-0" />;
        break;
      case "Severe Late":
        badgeClass =
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
        icon = <XCircle className="h-3 w-3 shrink-0" />;
        break;
      case "Undertime":
        badgeClass =
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
        icon = <Clock className="h-3 w-3 shrink-0" />;
        break;
      case "On Leave":
        badgeClass =
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
        icon = <Plane className="h-3 w-3 shrink-0" />;
        break;
      case "Absent":
      default:
        badgeClass = "bg-muted text-muted-foreground border-border";
        icon = <XCircle className="h-3 w-3 shrink-0" />;
        break;
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
        >
          {icon}
          <span>{status}</span>
        </span>
        {hasFiledLeave && status !== "On Leave" && (
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            Filed Leave
          </span>
        )}
      </div>
    );
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      {/* Header Info Banner */}
      <div className="px-4 py-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-500" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Intercompany Punctuality Log Directory
          </h3>
          <span className="text-xs text-muted-foreground">
            ({totalRecords.toLocaleString()} Total Records)
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

      {/* Table Content */}
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              {/* Date */}
              <TableHead className="w-28">
                <button
                  type="button"
                  onClick={() => onSort("logDate")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Date {renderSortIcon("logDate")}
                </button>
              </TableHead>

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

              {/* Department & Position */}
              <TableHead className="min-w-[160px]">
                <button
                  type="button"
                  onClick={() => onSort("department")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Department & Role {renderSortIcon("department")}
                </button>
              </TableHead>

              {/* Scheduled Time */}
              <TableHead className="text-center w-28 text-xs font-semibold text-muted-foreground">
                Scheduled
              </TableHead>

              {/* Actual Time In */}
              <TableHead className="text-center w-28">
                <button
                  type="button"
                  onClick={() => onSort("timeIn")}
                  className="flex items-center justify-center w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Time In {renderSortIcon("timeIn")}
                </button>
              </TableHead>

              {/* Actual Time Out */}
              <TableHead className="text-center w-28 text-xs font-semibold text-muted-foreground">
                Time Out
              </TableHead>

              {/* Punctuality Status */}
              <TableHead className="min-w-[150px]">
                <button
                  type="button"
                  onClick={() => onSort("punctualityStatus")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Punctuality {renderSortIcon("punctualityStatus")}
                </button>
              </TableHead>

              {/* Delay Minutes */}
              <TableHead className="text-right w-28">
                <button
                  type="button"
                  onClick={() => onSort("delayMinutes")}
                  className="flex items-center justify-end w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Delay {renderSortIcon("delayMinutes")}
                </button>
              </TableHead>

              {/* Biometric Proof */}
              <TableHead className="text-center w-20 text-xs font-semibold text-muted-foreground">
                Proof
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
                  <TableCell colSpan={11} className="py-4">
                    <div className="h-6 w-full rounded-md bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Clock className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">No punctuality records found</p>
                    <p className="text-xs">
                      Try adjusting your date range, company selection, or search criteria.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  {/* Date */}
                  <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {r.logDate}
                  </TableCell>

                  {/* Employee */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-500/20">
                        {r.firstName.charAt(0)}
                        {r.lastName.charAt(0)}
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

                  {/* Department & Position */}
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {r.department}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.position}</p>
                    </div>
                  </TableCell>

                  {/* Scheduled In */}
                  <TableCell className="text-center text-xs font-mono text-muted-foreground">
                    {r.scheduledTimeIn}
                  </TableCell>

                  {/* Actual Time In */}
                  <TableCell className="text-center text-xs font-mono font-bold text-foreground">
                    {r.timeIn || "--:--"}
                  </TableCell>

                  {/* Actual Time Out */}
                  <TableCell className="text-center text-xs font-mono text-muted-foreground">
                    {r.timeOut || "--:--"}
                  </TableCell>

                  {/* Punctuality Status */}
                  <TableCell>
                    {renderStatusBadge(r.punctualityStatus, r.delayMinutes, r.hasFiledLeave)}
                  </TableCell>

                  {/* Delay Minutes */}
                  <TableCell className="text-right text-xs font-mono">
                    {r.delayMinutes === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        0m (On-Time)
                      </span>
                    ) : (
                      <span
                        className={`font-bold ${
                          r.delayMinutes > 30
                            ? "text-rose-600 dark:text-rose-400"
                            : r.delayMinutes > 15
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        +{r.delayMinutes}m
                      </span>
                    )}
                  </TableCell>

                  {/* Photo Proof */}
                  <TableCell className="text-center">
                    {r.imageTimeIn ? (
                      <button
                        type="button"
                        onClick={() => onViewDetail(r)}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted hover:bg-cyan-500/20 text-muted-foreground hover:text-cyan-600 transition-colors"
                        title="View Biometric Photo Proof"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40 font-mono">--</span>
                    )}
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
          records
        </div>

        <div className="flex items-center gap-1 self-center sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border bg-background"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border bg-background"
            title="Previous Page"
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
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0 border-border bg-background"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
