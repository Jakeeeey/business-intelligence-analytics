// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/DataTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import type { ConsolidatorAuditRecord } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

type DataTableProps = {
  data: ConsolidatorAuditRecord[];
};

type SortConfig = {
  key: keyof ConsolidatorAuditRecord;
  direction: "asc" | "desc";
} | null;

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  const normalized = status.toLowerCase();
  if (["dispatched", "audited", "posted", "completed", "success"].includes(normalized)) {
    return "default";
  }
  if (["pending", "processing", "draft", "created"].includes(normalized)) {
    return "secondary";
  }
  if (["cancelled", "failed", "rejected"].includes(normalized)) {
    return "destructive";
  }
  return "outline";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function DataTable({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const requestSort = (key: keyof ConsolidatorAuditRecord) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortButton = ({ columnKey, label }: { columnKey: keyof ConsolidatorAuditRecord; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent"
      onClick={() => requestSort(columnKey)}
    >
      <span>{label}</span>
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-lg">
        <p className="text-sm">No audit records available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead><SortButton columnKey="pdpNo" label="PDP No." /></TableHead>
                <TableHead><SortButton columnKey="pdpStatus" label="PDP Status" /></TableHead>
                <TableHead><SortButton columnKey="pdpCreatedAt" label="PDP Created At" /></TableHead>
                <TableHead><SortButton columnKey="consolidatorNo" label="Consolidator No." /></TableHead>
                <TableHead><SortButton columnKey="consolidatorStatus" label="Consol. Status" /></TableHead>
                <TableHead><SortButton columnKey="consolidatorCreatedAt" label="Consol. Created At" /></TableHead>
                <TableHead><SortButton columnKey="dpNo" label="DP No." /></TableHead>
                <TableHead><SortButton columnKey="dpStatus" label="DP Status" /></TableHead>
                <TableHead><SortButton columnKey="dpCreatedAt" label="DP Created At" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={`${row.pdpId}-${row.consolidatorId}-${row.dpId}-${index}`} className="hover:bg-muted/20">
                  {/* PDP info */}
                  <TableCell className="font-medium text-xs text-card-foreground">
                    {row.pdpNo || "—"}
                  </TableCell>
                  <TableCell>
                    {row.pdpStatus ? (
                      <Badge variant={getStatusBadgeVariant(row.pdpStatus)} className="text-[10px] px-1.5 py-0">
                        {row.pdpStatus}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.pdpCreatedAt)}
                  </TableCell>

                  {/* Consolidator info */}
                  <TableCell className="font-medium text-xs text-card-foreground">
                    {row.consolidatorNo || "—"}
                  </TableCell>
                  <TableCell>
                    {row.consolidatorStatus ? (
                      <Badge variant={getStatusBadgeVariant(row.consolidatorStatus)} className="text-[10px] px-1.5 py-0">
                        {row.consolidatorStatus}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.consolidatorCreatedAt)}
                  </TableCell>

                  {/* Dispatch Plan info */}
                  <TableCell className="font-medium text-xs text-card-foreground">
                    {row.dpNo || "—"}
                  </TableCell>
                  <TableCell>
                    {row.dpStatus ? (
                      <Badge variant={getStatusBadgeVariant(row.dpStatus)} className="text-[10px] px-1.5 py-0">
                        {row.dpStatus}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.dpCreatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">
            Showing Page {currentPage} of {totalPages} ({data.length} total records)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
