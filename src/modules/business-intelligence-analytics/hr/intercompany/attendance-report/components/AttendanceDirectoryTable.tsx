"use client";

import React, { useState } from "react";
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
  Plane,
  Building2,
  User,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import {
  IntercompanyEmployeeRecord,
  SortField,
  SortOrder,
} from "../types";
import { AttendanceDetailModal } from "./AttendanceDetailModal";

interface AttendanceDirectoryTableProps {
  data: IntercompanyEmployeeRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

export function AttendanceDirectoryTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  loading,
}: AttendanceDirectoryTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<IntercompanyEmployeeRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (rec: IntercompanyEmployeeRecord) => {
    setSelectedRecord(rec);
    setModalOpen(true);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-cyan-500 font-bold" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-cyan-500 font-bold" />
    );
  };

  const renderStatusBadge = (rec: IntercompanyEmployeeRecord) => {
    switch (rec.attendanceStatus) {
      case "On Time":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            On Time
          </span>
        );
      case "Late":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Late
          </span>
        );
      case "Absent":
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <XCircle className="h-3 w-3" />
              Absent
            </span>
            {rec.hasFiledLeave && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <FileText className="h-2.5 w-2.5" />
                Filed ({rec.leaveStatus || "pending"})
              </span>
            )}
          </div>
        );
      case "On Leave":
        return (
          <div className="flex flex-col items-center">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
              title={rec.leaveType || ""}
            >
              <Plane className="h-3 w-3" />
              On Leave
            </span>
            {rec.leaveType && (
              <span className="mt-0.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate max-w-[110px]" title={rec.leaveType}>
                {rec.leaveType}
              </span>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-500" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Personnel Attendance Records
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              ({totalCount.toLocaleString()} total)
            </span>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
            <span>Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-16 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>rows</span>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead
                  onClick={() => onSort("name")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 min-w-[200px]"
                >
                  <div className="flex items-center">
                    <span>Personnel</span>
                    {renderSortIcon("name")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("companyName")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 min-w-[160px]"
                >
                  <div className="flex items-center">
                    <span>Company</span>
                    {renderSortIcon("companyName")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("department")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 min-w-[150px]"
                >
                  <div className="flex items-center">
                    <span>Department</span>
                    {renderSortIcon("department")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("position")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 min-w-[140px]"
                >
                  <div className="flex items-center">
                    <span>Position</span>
                    {renderSortIcon("position")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("attendanceStatus")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 text-center min-w-[120px]"
                >
                  <div className="flex items-center justify-center">
                    <span>Status</span>
                    {renderSortIcon("attendanceStatus")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("timeIn")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 text-center min-w-[100px]"
                >
                  <div className="flex items-center justify-center">
                    <span>Time In</span>
                    {renderSortIcon("timeIn")}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("timeOut")}
                  className="cursor-pointer select-none text-xs font-semibold text-foreground py-3 text-center min-w-[100px]"
                >
                  <div className="flex items-center justify-center">
                    <span>Time Out</span>
                    {renderSortIcon("timeOut")}
                  </div>
                </TableHead>

                <TableHead className="text-xs font-semibold text-foreground py-3 text-right pr-4 min-w-[90px]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-border animate-pulse">
                    <TableCell colSpan={8} className="py-4">
                      <div className="h-5 bg-muted/60 rounded-md w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        No attendance records match your filter
                      </p>
                      <p className="text-xs">
                        Try selecting another company, department, or date.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((rec) => (
                  <TableRow
                    key={rec.id}
                    className="border-border hover:bg-muted/40 transition-colors"
                  >
                    {/* Personnel Name & ID */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/20">
                          {rec.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {rec.name}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {rec.employeeId}
                            </span>
                            {rec.hasFiledLeave && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-semibold border ${
                                  rec.leaveStatus === "approved"
                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                }`}
                                title={
                                  rec.leaveType
                                    ? `Filed Leave (${rec.leaveStatus === "approved" ? "Approved" : "Pending"}): ${rec.leaveType}${rec.leaveDates ? ` [${rec.leaveDates}]` : ""}`
                                    : "Filed for Leave"
                                }
                              >
                                {rec.leaveStatus === "approved" ? (
                                  <Plane className="h-2.5 w-2.5 shrink-0" />
                                ) : (
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                )}
                                <span>{rec.leaveType || "Leave"} ({rec.leaveStatus === "approved" ? "Approved" : "Pending"})</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Company */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                          {rec.companyCode}
                        </span>
                        <span className="text-xs text-foreground truncate" title={rec.companyName}>
                          {rec.companyName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell className="py-2.5 text-xs text-foreground">
                      <span className="truncate block max-w-[180px]">{rec.department}</span>
                    </TableCell>

                    {/* Position */}
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      <span className="truncate block max-w-[180px]">{rec.position}</span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-2.5 text-center">
                      {renderStatusBadge(rec)}
                    </TableCell>

                    {/* Time In */}
                    <TableCell className="py-2.5 text-center text-xs font-medium tabular-nums text-foreground">
                      {rec.timeIn || <span className="text-muted-foreground/60">--:--</span>}
                    </TableCell>

                    {/* Time Out */}
                    <TableCell className="py-2.5 text-center text-xs font-medium tabular-nums text-foreground">
                      {rec.timeOut || <span className="text-muted-foreground/60">--:--</span>}
                    </TableCell>

                    {/* Action: View Details */}
                    <TableCell className="py-2.5 text-right pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(rec)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
                        title="View Full Attendance Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-5 border-t border-border/60 bg-muted/10 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-xs border-border"
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-xs border-border"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-xs font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-xs border-border"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-xs border-border"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || loading}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        record={selectedRecord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
