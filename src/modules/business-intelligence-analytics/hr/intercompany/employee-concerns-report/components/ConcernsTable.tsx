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
import { Badge } from "@/components/ui/badge";
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
  MessageSquareWarning,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import {
  IntercompanyConcernRecord,
  ConcernsSortField,
  ConcernsSortOrder,
} from "../types";

interface ConcernsTableProps {
  records: IntercompanyConcernRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: ConcernsSortField;
  sortOrder: ConcernsSortOrder;
  onSort: (field: ConcernsSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (record: IntercompanyConcernRecord) => void;
  loading: boolean;
}

export function ConcernsTable({
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
}: ConcernsTableProps) {
  const renderSortIcon = (field: ConcernsSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-amber-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-amber-500" />
    );
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3 shrink-0" />
          Pending
        </span>
      );
    }
    if (s === "IN_REVIEW" || s === "UNDER_REVIEW" || s === "IN PROGRESS" || s === "INVESTIGATING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <AlertCircle className="h-3 w-3 shrink-0" />
          In Review
        </span>
      );
    }
    if (s === "RESOLVED" || s === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
        {status}
      </span>
    );
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      {/* Header Info Banner */}
      <div className="px-4 py-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Employee Grievance & Concern Directory
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
              {/* ID */}
              <TableHead className="w-20">
                <button
                  type="button"
                  onClick={() => onSort("id")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  ID {renderSortIcon("id")}
                </button>
              </TableHead>

              {/* Date Submitted */}
              <TableHead className="w-32">
                <button
                  type="button"
                  onClick={() => onSort("createdAt")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Date {renderSortIcon("createdAt")}
                </button>
              </TableHead>

              {/* Submitter */}
              <TableHead className="min-w-[190px]">
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Submitter {renderSortIcon("name")}
                </button>
              </TableHead>

              {/* Company */}
              <TableHead className="min-w-[160px]">
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

              {/* Subject of Concern */}
              <TableHead className="min-w-[220px]">
                <button
                  type="button"
                  onClick={() => onSort("subject")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Subject & Details {renderSortIcon("subject")}
                </button>
              </TableHead>

              {/* Category */}
              <TableHead className="min-w-[140px] text-xs font-semibold text-muted-foreground">
                Category
              </TableHead>

              {/* Status */}
              <TableHead className="w-32">
                <button
                  type="button"
                  onClick={() => onSort("status")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Status {renderSortIcon("status")}
                </button>
              </TableHead>

              {/* Action */}
              <TableHead className="text-right w-24 text-xs font-semibold text-muted-foreground pr-4">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                    <MessageSquareWarning className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">No employee concerns found</p>
                    <p className="text-xs">
                      Try adjusting your company, department, status, or search filters.
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
                  {/* Concern ID */}
                  <TableCell className="font-mono text-xs font-bold text-foreground whitespace-nowrap">
                    #{r.concernId}
                  </TableCell>

                  {/* Date Submitted */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <p className="font-mono font-medium text-foreground">
                      {r.createdAt.slice(0, 10)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.createdAt.slice(11, 16)}
                    </p>
                  </TableCell>

                  {/* Submitter */}
                  <TableCell>
                    {r.isAnonymous ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <EyeOff className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            Anonymous
                          </p>
                          <span className="text-[10px] font-mono px-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">
                            Undisclosed
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-500/20">
                          {(r.firstName.charAt(0) || "E").toUpperCase()}
                          {(r.lastName.charAt(0) || "M").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {r.name}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {r.employeeId} • {r.position}
                          </p>
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        {r.companyCode}
                      </span>
                      <span
                        className="text-xs text-foreground truncate"
                        title={r.companyName}
                      >
                        {r.companyName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <span className="text-xs font-medium text-foreground">
                      {r.department}
                    </span>
                  </TableCell>

                  {/* Subject & snippet */}
                  <TableCell>
                    <div className="min-w-0 max-w-[280px]">
                      <p className="text-xs font-bold text-foreground truncate" title={r.subjectOfConcern}>
                        {r.subjectOfConcern}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={r.concern}>
                        {r.concern}
                      </p>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-border/80 bg-muted/30 text-foreground whitespace-nowrap gap-1"
                    >
                      <Tag className="h-2.5 w-2.5 text-cyan-500" />
                      <span>{r.category}</span>
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {renderStatusBadge(r.status)}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(r)}
                      className="h-7 px-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Review
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
          <span className="font-semibold text-foreground">
            {totalRecords.toLocaleString()}
          </span>{" "}
          concerns
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

