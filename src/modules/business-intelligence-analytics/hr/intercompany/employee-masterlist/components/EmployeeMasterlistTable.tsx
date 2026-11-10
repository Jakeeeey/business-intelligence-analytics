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
  Users,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  IntercompanyEmployeeMasterlistRecord,
  EmployeeMasterlistSortField,
  EmployeeMasterlistSortOrder,
} from "../types";

interface EmployeeMasterlistTableProps {
  records: IntercompanyEmployeeMasterlistRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortField: EmployeeMasterlistSortField;
  sortOrder: EmployeeMasterlistSortOrder;
  onSort: (field: EmployeeMasterlistSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (record: IntercompanyEmployeeMasterlistRecord) => void;
  loading: boolean;
}

export function EmployeeMasterlistTable({
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
}: EmployeeMasterlistTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderSortIcon = (field: EmployeeMasterlistSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-cyan-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-cyan-500" />
    );
  };

  const renderEmploymentStatusBadge = (
    empStatus: string,
    rosterStatus: "Active" | "Separated"
  ) => {
    const s = empStatus.toLowerCase();
    let badgeClass =
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

    if (s.includes("regular")) {
      badgeClass =
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    } else if (s.includes("probation")) {
      badgeClass =
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    } else if (
      s.includes("resign") ||
      s.includes("terminat") ||
      s.includes("inactive") ||
      s.includes("separat")
    ) {
      badgeClass =
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
        >
          {empStatus}
        </span>
        {rosterStatus === "Separated" && (
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            Separated
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
            Intercompany Employee Masterlist Directory
          </h3>
          <span className="text-xs text-muted-foreground">
            ({totalRecords.toLocaleString()} Total Employees)
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
              {/* Employee ID */}
              <TableHead className="w-32">
                <button
                  type="button"
                  onClick={() => onSort("employeeId")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Employee ID {renderSortIcon("employeeId")}
                </button>
              </TableHead>

              {/* Employee Name */}
              <TableHead className="min-w-[210px]">
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Employee Name {renderSortIcon("name")}
                </button>
              </TableHead>

              {/* Company */}
              <TableHead className="min-w-[175px]">
                <button
                  type="button"
                  onClick={() => onSort("company")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Company {renderSortIcon("company")}
                </button>
              </TableHead>

              {/* Department */}
              <TableHead className="min-w-[160px]">
                <button
                  type="button"
                  onClick={() => onSort("department")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Department {renderSortIcon("department")}
                </button>
              </TableHead>

              {/* Position */}
              <TableHead className="min-w-[150px]">
                <button
                  type="button"
                  onClick={() => onSort("position")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Position & Role {renderSortIcon("position")}
                </button>
              </TableHead>

              {/* Employment Status */}
              <TableHead className="min-w-[130px]">
                <button
                  type="button"
                  onClick={() => onSort("employmentStatus")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Status {renderSortIcon("employmentStatus")}
                </button>
              </TableHead>

              {/* Date of Hire & Tenure */}
              <TableHead className="min-w-[140px]">
                <button
                  type="button"
                  onClick={() => onSort("tenureYears")}
                  className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Hire Date & Tenure {renderSortIcon("tenureYears")}
                </button>
              </TableHead>

              {/* Contact & Location */}
              <TableHead className="min-w-[180px] text-xs font-semibold text-muted-foreground">
                Contact & Location
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
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">No employee records found</p>
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
                  {/* Employee ID */}
                  <TableCell className="text-xs font-mono whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span>{r.employeeId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(r.employeeId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground"
                        title="Copy Employee ID"
                      >
                        {copiedId === r.employeeId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {r.biometricId && (
                      <p className="text-[10px] text-muted-foreground">
                        Bio: #{r.biometricId}
                      </p>
                    )}
                  </TableCell>

                  {/* Employee Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-500/20">
                        {(r.firstName.charAt(0) || "E").toUpperCase()}
                        {(r.lastName.charAt(0) || "M").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {r.name}
                          </p>
                          {r.isDepartmentHead && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold shrink-0"
                            >
                              Head
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {r.gender} • {r.civilStatus}
                          {r.age ? ` • ${r.age} yrs old` : ""}
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
                    <span className="text-xs font-semibold text-foreground">
                      {r.department}
                    </span>
                  </TableCell>

                  {/* Position */}
                  <TableCell>
                    <span className="text-xs text-foreground">{r.position}</span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {renderEmploymentStatusBadge(r.employmentStatus, r.rosterStatus)}
                  </TableCell>

                  {/* Date of Hire & Tenure */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs font-mono text-foreground">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{r.dateOfHire || "N/A"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {r.tenureYears > 0
                        ? `${r.tenureYears} yrs (${r.tenureMonths} mos)`
                        : r.dateOfHire
                        ? "< 1 yr tenure"
                        : "Tenure unrecorded"}
                    </p>
                  </TableCell>

                  {/* Contact & Location */}
                  <TableCell>
                    <div className="space-y-0.5 text-[11px]">
                      {(r.city || r.province) && (
                        <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[180px]">
                          <MapPin className="h-3 w-3 text-cyan-500 shrink-0" />
                          <span className="truncate">
                            {[r.city, r.province].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {r.email && (
                        <div
                          className="flex items-center gap-1 text-muted-foreground truncate max-w-[180px]"
                          title={r.email}
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{r.email}</span>
                        </div>
                      )}
                      {r.contact && (
                        <div className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{r.contact}</span>
                        </div>
                      )}
                      {!r.city && !r.province && !r.email && !r.contact && (
                        <span className="text-muted-foreground/50 text-[10px]">--</span>
                      )}
                    </div>
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
          <span className="font-semibold text-foreground">
            {totalRecords.toLocaleString()}
          </span>{" "}
          employees
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

