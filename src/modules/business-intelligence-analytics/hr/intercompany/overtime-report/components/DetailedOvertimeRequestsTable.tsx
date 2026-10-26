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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  IntercompanyOvertimeRecord,
  RequestStatus,
} from "../types";

interface DetailedOvertimeRequestsTableProps {
  overtimeRecords: IntercompanyOvertimeRecord[];
  loading: boolean;
}

export function DetailedOvertimeRequestsTable({
  overtimeRecords,
  loading,
}: DetailedOvertimeRequestsTableProps) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sort descending by requestDate
  const sortedRecords = useMemo(() => {
    return [...overtimeRecords].sort((a, b) => {
      const cmp = b.requestDate.localeCompare(a.requestDate);
      if (cmp !== 0) return cmp;
      return (b.filedAt || "").localeCompare(a.filedAt || "");
    });
  }, [overtimeRecords]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Individual Overtime Filings Log
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono">
            {sortedRecords.length} Requests
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
              <TableHead className="text-xs font-semibold select-none w-28">
                Request Date
              </TableHead>
              <TableHead className="text-xs font-semibold select-none min-w-[170px]">
                Employee Name
              </TableHead>
              <TableHead className="text-xs font-semibold select-none">
                Subsidiary
              </TableHead>
              <TableHead className="text-xs font-semibold select-none">
                Department
              </TableHead>
              <TableHead className="text-xs font-semibold select-none">
                OT Window
              </TableHead>
              <TableHead className="text-xs font-semibold select-none text-right">
                Duration
              </TableHead>
              <TableHead className="text-xs font-semibold select-none min-w-[200px]">
                Purpose / Reason
              </TableHead>
              <TableHead className="text-xs font-semibold select-none text-center">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold select-none text-right w-28">
                Filed Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={9} className="py-3">
                    <div className="h-6 w-full rounded bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center text-xs text-muted-foreground">
                  No overtime request filings found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((ot) => (
                <TableRow
                  key={ot.id}
                  className="hover:bg-muted/40 border-b border-border/40 text-xs transition-colors"
                >
                  <TableCell className="font-mono font-medium text-foreground">
                    {ot.requestDate}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {ot.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-tight">
                          {ot.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {ot.employeeId}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-muted border border-border text-foreground">
                      {ot.companyCode}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-muted-foreground">{ot.department}</span>
                  </TableCell>

                  <TableCell>
                    {ot.otFrom && ot.otTo ? (
                      <span className="font-mono text-xs text-foreground">
                        {ot.otFrom} → {ot.otTo}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    <span className="font-bold text-foreground">
                      {ot.durationHours.toFixed(1)} hrs
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      ({ot.durationMinutes}m)
                    </span>
                  </TableCell>

                  <TableCell>
                    <p className="text-xs text-foreground/90 line-clamp-2 max-w-xs">
                      {ot.purpose || "Overtime Work"}
                    </p>
                  </TableCell>

                  <TableCell className="text-center">
                    {renderStatusBadge(ot.status)}
                  </TableCell>

                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {ot.filedAt ? new Date(ot.filedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/10">
        <div>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {sortedRecords.length === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(page * pageSize, sortedRecords.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{sortedRecords.length}</span>{" "}
          requests
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
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
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
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
