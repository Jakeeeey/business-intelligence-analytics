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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IntercompanyResignationRecord,
  ResignationStatus,
} from "../types";
import { SortField, SortOrder } from "../hooks/useIntercompanyResignations";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Paperclip,
  Eye,
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ResignationTableProps {
  records: IntercompanyResignationRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelectRecord: (record: IntercompanyResignationRecord) => void;
}

export function ResignationTable({
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
}: ResignationTableProps) {
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

  const renderStatusBadge = (status: ResignationStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "COMPLETED":
      case "RECORDED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium text-[11px] gap-1 px-2 py-0.5 rounded-lg"
          >
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "REJECTED":
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
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border text-[11px] px-2 py-0.5 rounded-lg"
          >
            {status}
          </Badge>
        );
    }
  };

  const renderNoticeBadge = (record: IntercompanyResignationRecord) => {
    const days = record.noticeDays;
    if (days >= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          {days}d (Compliant)
        </span>
      );
    }
    if (days >= 15) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          {days}d Notice
        </span>
      );
    }
    if (days > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
          {days}d (Short)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
        Immediate
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
                onClick={() => onSort("name")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Employee
                  {getSortIcon("name")}
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
                onClick={() => onSort("department")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Department & Role
                  {getSortIcon("department")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("filingDate")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Filing Date
                  {getSortIcon("filingDate")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("resignationDate")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Effective Last Day
                  {getSortIcon("resignationDate")}
                </div>
              </TableHead>

              <TableHead
                onClick={() => onSort("noticeDays")}
                className="cursor-pointer text-xs font-semibold text-foreground select-none"
              >
                <div className="flex items-center">
                  Notice Period
                  {getSortIcon("noticeDays")}
                </div>
              </TableHead>

              <TableHead className="text-xs font-semibold text-foreground">
                Reason & Driver
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

              <TableHead className="text-xs font-semibold text-foreground text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <FileQuestion className="h-8 w-8 text-muted-foreground/60 stroke-1" />
                    <p className="text-sm font-medium">No resignation records found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting search filters or selecting all companies.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => {
                const initials =
                  `${rec.firstName?.[0] || ""}${rec.lastName?.[0] || ""}`.toUpperCase() || "E";

                return (
                  <TableRow
                    key={rec.id}
                    className="hover:bg-muted/40 transition-colors border-b border-border/60"
                  >
                    {/* Employee Profile */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-xl border border-border">
                          {rec.avatar && <AvatarImage src={rec.avatar} alt={rec.name} />}
                          <AvatarFallback className="rounded-xl text-[11px] font-bold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate max-w-[170px]">
                            {rec.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[170px]">
                            {rec.employeeId} {rec.email !== "-" ? `• ${rec.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Company */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                          {rec.companyName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {rec.companyCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Department & Role */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-medium">
                          {rec.department}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {rec.position}
                          {rec.tenureFormatted ? ` • ${rec.tenureFormatted}` : ""}
                        </span>
                      </div>
                    </TableCell>

                    {/* Filing Date */}
                    <TableCell className="py-3 text-xs font-mono text-foreground whitespace-nowrap">
                      {rec.filingDateFormatted}
                    </TableCell>

                    {/* Resignation Date */}
                    <TableCell className="py-3 text-xs font-mono text-foreground font-medium whitespace-nowrap">
                      {rec.resignationDateFormatted}
                    </TableCell>

                    {/* Notice Period */}
                    <TableCell className="py-3 whitespace-nowrap">
                      {renderNoticeBadge(rec)}
                    </TableCell>

                    {/* Reason & Driver */}
                    <TableCell className="py-3 max-w-[200px]">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[11px] font-semibold text-foreground truncate">
                          {rec.reasonCategory}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate" title={rec.reason}>
                          {rec.reason}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3 whitespace-nowrap">
                      {renderStatusBadge(rec.status)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.attachmentUrl && (
                          <span
                            title="Has attachment file"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectRecord(rec)}
                          className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-xl"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

