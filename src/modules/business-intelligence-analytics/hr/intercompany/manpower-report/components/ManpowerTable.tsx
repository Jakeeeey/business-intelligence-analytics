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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IntercompanyManpowerRecord,
  ManpowerRequestStatus,
} from "../types";
import { SortField, SortOrder } from "../hooks/useIntercompanyManpower";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileQuestion,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from "lucide-react";

interface ManpowerTableProps {
  records: IntercompanyManpowerRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelectRecord: (record: IntercompanyManpowerRecord) => void;
}

export function ManpowerTable({
  records,
  totalItems,
  page,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onPageSizeChange,
  onSelectRecord,
}: ManpowerTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  };

  const renderStatusBadge = (status: ManpowerRequestStatus) => {
    switch (status) {
      case "Approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "Draft":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <Clock className="h-3 w-3" />
            Draft / Pending
          </Badge>
        );
      case "Rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-lg">
            {status}
          </Badge>
        );
    }
  };

  const renderFulfillmentBadge = (rec: IntercompanyManpowerRecord) => {
    if (rec.isFulfilled) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          {rec.hiredCount}/{rec.noManpowerNeeded} (100%)
        </span>
      );
    }
    if (rec.hiredCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          {rec.hiredCount}/{rec.noManpowerNeeded} ({rec.fulfillmentRate}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted border border-border/60 px-2 py-0.5 rounded-md">
        0/{rec.noManpowerNeeded} (Open)
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-0">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[320px]">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead
                onClick={() => onSort("requestNo")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Request #
                  {getSortIcon("requestNo")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("position")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Position & Dept
                  {getSortIcon("position")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("companyName")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Company
                  {getSortIcon("companyName")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("division")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Division
                  {getSortIcon("division")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("noManpowerNeeded")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Headcount & Progress
                  {getSortIcon("noManpowerNeeded")}
                </div>
              </TableHead>

              <TableHead className="text-xs font-semibold text-foreground">
                Purpose & Type
              </TableHead>

              <TableHead
                onClick={() => onSort("rate")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Rate / Budget
                  {getSortIcon("rate")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("status")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon("status")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("createdAt")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Date Filed
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>

              <TableHead className="text-xs font-semibold text-foreground text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <FileQuestion className="h-8 w-8 text-muted-foreground/60 stroke-1" />
                    <p className="text-sm font-medium">No manpower requisitions found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting search filters or selecting all companies.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => (
                <TableRow
                  key={rec.id}
                  className="hover:bg-muted/40 transition-colors border-b border-border/60"
                >
                  {/* Request No */}
                  <TableCell className="py-3 font-mono text-xs font-bold text-foreground">
                    {rec.requestNo}
                  </TableCell>

                  {/* Position & Department */}
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground truncate max-w-[190px]">
                        {rec.position}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[190px]">
                        {rec.department}
                      </span>
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                        {rec.companyName}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {rec.companyCode}
                      </span>
                    </div>
                  </TableCell>

                  {/* Division */}
                  <TableCell className="py-3 text-xs text-foreground font-medium truncate max-w-[120px]">
                    {rec.division}
                  </TableCell>

                  {/* Headcount & Progress */}
                  <TableCell className="py-3 whitespace-nowrap">
                    {renderFulfillmentBadge(rec)}
                  </TableCell>

                  {/* Purpose & Type */}
                  <TableCell className="py-3">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[11px] font-semibold text-foreground">
                        {rec.purpose}
                        {rec.replacementName ? ` (${rec.replacementName})` : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {rec.employmentType}
                      </span>
                    </div>
                  </TableCell>

                  {/* Rate / Budget */}
                  <TableCell className="py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-foreground">
                        {rec.rateFormatted}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Est: ₱{rec.totalEstimatedBudget.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 whitespace-nowrap">
                    {renderStatusBadge(rec.status)}
                  </TableCell>

                  {/* Date Filed */}
                  <TableCell className="py-3 text-xs font-mono text-foreground whitespace-nowrap">
                    {rec.createdAtFormatted}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {rec.recommendations.length > 0 && (
                        <span
                          title={`${rec.recommendations.length} candidate recommendations attached`}
                          className="text-xs text-primary font-semibold flex items-center gap-0.5"
                        >
                          <Users className="h-3 w-3" />
                          {rec.recommendations.length}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRecord(rec)}
                        className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-xl"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Dossier
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-card">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              onPageSizeChange(Number(val));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-18 text-xs bg-background border-input rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>per page • Total {totalItems.toLocaleString()} records</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 w-8 p-0 border-border rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 text-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 p-0 border-border rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

