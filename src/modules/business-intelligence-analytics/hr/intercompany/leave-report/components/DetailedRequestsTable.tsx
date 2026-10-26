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
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
} from "lucide-react";
import {
  IntercompanyOvertimeRecord,
  IntercompanyLeaveRecord,
  RequestStatus,
} from "../types";

interface CombinedRequestItem {
  id: string;
  type: "overtime" | "leave";
  date: string;
  employeeName: string;
  employeeId: string;
  companyName: string;
  companyCode: string;
  department: string;
  position: string;
  details: string;
  purpose: string;
  status: RequestStatus;
  filedAt: string | null;
}

interface DetailedRequestsTableProps {
  overtimeRecords: IntercompanyOvertimeRecord[];
  leaveRecords: IntercompanyLeaveRecord[];
  typeFilter: "ALL" | "overtime" | "leave";
  loading: boolean;
}

export function DetailedRequestsTable({
  overtimeRecords,
  leaveRecords,
  typeFilter,
  loading,
}: DetailedRequestsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Combine and sort requests
  const combinedItems = useMemo<CombinedRequestItem[]>(() => {
    const items: CombinedRequestItem[] = [];

    if (typeFilter === "ALL" || typeFilter === "overtime") {
      overtimeRecords.forEach((ot) => {
        const timeFrom = ot.otFrom ? ot.otFrom.slice(0, 5) : "";
        const timeTo = ot.otTo ? ot.otTo.slice(0, 5) : "";
        const timeSpan = timeFrom && timeTo ? `${timeFrom} - ${timeTo}` : "Overtime";
        items.push({
          id: ot.id,
          type: "overtime",
          date: ot.requestDate,
          employeeName: ot.name,
          employeeId: ot.employeeId,
          companyName: ot.companyName,
          companyCode: ot.companyCode,
          department: ot.department,
          position: ot.position,
          details: `${timeSpan} (${ot.durationHours} hrs)`,
          purpose: ot.purpose,
          status: ot.status,
          filedAt: ot.filedAt,
        });
      });
    }

    if (typeFilter === "ALL" || typeFilter === "leave") {
      leaveRecords.forEach((lv) => {
        items.push({
          id: lv.id,
          type: "leave",
          date: lv.leaveStart,
          employeeName: lv.name,
          employeeId: lv.employeeId,
          companyName: lv.companyName,
          companyCode: lv.companyCode,
          department: lv.department,
          position: lv.position,
          details: `${lv.leaveType} • ${lv.totalDays} day(s) (${lv.leaveStart} to ${lv.leaveEnd})`,
          purpose: lv.reason,
          status: lv.status,
          filedAt: lv.filedAt,
        });
      });
    }

    return items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [overtimeRecords, leaveRecords, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(combinedItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return combinedItems.slice(start, start + pageSize);
  }, [combinedItems, page, pageSize]);

  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 shrink-0" />
            Rejected
          </span>
        );
    }
  };

  const startRecord = combinedItems.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, combinedItems.length);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-500" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Detailed Filing Logs (Overtime & Leaves)
          </h3>
          <span className="text-xs text-muted-foreground">
            ({combinedItems.length.toLocaleString()} Total Filings)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
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
              <TableHead className="w-28 text-xs font-semibold text-muted-foreground">Date</TableHead>
              <TableHead className="min-w-[180px] text-xs font-semibold text-muted-foreground">Employee</TableHead>
              <TableHead className="min-w-[150px] text-xs font-semibold text-muted-foreground">Company</TableHead>
              <TableHead className="min-w-[140px] text-xs font-semibold text-muted-foreground">Department</TableHead>
              <TableHead className="w-28 text-center text-xs font-semibold text-muted-foreground">Filing Type</TableHead>
              <TableHead className="min-w-[200px] text-xs font-semibold text-muted-foreground">Details & Duration</TableHead>
              <TableHead className="min-w-[180px] text-xs font-semibold text-muted-foreground">Purpose / Reason</TableHead>
              <TableHead className="w-28 text-center text-xs font-semibold text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={8} className="py-4">
                    <div className="h-6 w-full rounded-md bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : combinedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                  No filing logs found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {item.date}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.employeeName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{item.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      {item.companyCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-foreground truncate">{item.department}</TableCell>
                  <TableCell className="text-center">
                    {item.type === "overtime" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        <Clock className="h-3 w-3" />
                        Overtime
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <CalendarDays className="h-3 w-3" />
                        Leave
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {item.details}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground italic truncate max-w-[200px]" title={item.purpose}>
                    {item.purpose || "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(item.status)}
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
          <span className="font-semibold text-foreground">{combinedItems.length.toLocaleString()}</span> filings
        </div>

        <div className="flex items-center gap-1 self-center sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
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
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0 border-border bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
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
