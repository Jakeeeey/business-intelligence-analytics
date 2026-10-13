"use client";

import React, { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmployeeRecord,
  SortField,
  SortOrder,
} from "../types";

interface EmployeeDirectoryTableProps {
  data: EmployeeRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  statusFilter: string;
  statuses: string[];
  onSort: (field: SortField) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("regular")) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold px-2 py-0.5"
      >
        {status}
      </Badge>
    );
  }
  if (s.includes("probation")) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold px-2 py-0.5"
      >
        {status}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[11px] font-semibold px-2 py-0.5"
    >
      {status}
    </Badge>
  );
}

export function EmployeeDirectoryTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  sortField,
  sortOrder,
  searchQuery,
  statusFilter,
  statuses,
  onSort,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
  loading,
}: EmployeeDirectoryTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
    );
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden space-y-0">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            Personnel Directory & Employee Roster
          </span>
          <span className="text-xs text-muted-foreground">
            ({totalCount.toLocaleString()} active employees)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, ID, position, city..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 text-xs bg-background border-border"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-8 text-xs w-36 bg-background border-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {statuses.map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <th
                onClick={() => onSort("employeeId")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Employee ID</span>
                  {renderSortIcon("employeeId")}
                </div>
              </th>

              <th
                onClick={() => onSort("name")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Personnel Name</span>
                  {renderSortIcon("name")}
                </div>
              </th>

              <th
                onClick={() => onSort("position")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Position & Role</span>
                  {renderSortIcon("position")}
                </div>
              </th>

              <th
                onClick={() => onSort("department")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Department</span>
                  {renderSortIcon("department")}
                </div>
              </th>

              <th
                onClick={() => onSort("dateOfHire")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Date of Hire & Tenure</span>
                  {renderSortIcon("dateOfHire")}
                </div>
              </th>

              <th
                onClick={() => onSort("employmentStatus")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {renderSortIcon("employmentStatus")}
                </div>
              </th>

              <th className="py-3.5 px-4 text-right">Location & Contact</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading real employee records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No employee records match your filter criteria.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* ID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                      <span>{row.employeeId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(row.employeeId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground"
                        title="Copy ID"
                      >
                        {copiedId === row.employeeId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                        {getInitials(row.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{row.name}</span>
                          {row.isDepartmentHead && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 bg-primary/10 text-primary font-bold"
                            >
                              Head
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{row.gender}</span>
                          <span>•</span>
                          <span>{row.civilStatus}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="py-3 px-4 font-medium text-foreground">
                    {row.position}
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{row.department}</span>
                    </div>
                  </td>

                  {/* Date of Hire & Tenure */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{row.dateOfHire || "N/A"}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {row.tenureYears > 0 ? `${row.tenureYears} yrs tenure` : "< 1 yr tenure"}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(row.employmentStatus)}
                  </td>

                  {/* Location & Contact */}
                  <td className="py-3 px-4 text-right">
                    {(row.city || row.province) && (
                      <div className="flex items-center justify-end gap-1 text-foreground font-medium">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{[row.city, row.province].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground mt-0.5">
                      {row.email && (
                        <span className="flex items-center gap-1" title={row.email}>
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{row.email}</span>
                        </span>
                      )}
                      {row.contact && (
                        <span className="flex items-center gap-1" title={row.contact}>
                          <Phone className="h-3 w-3" />
                          <span>{row.contact}</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-7.5 w-16 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="10" className="text-xs">
                10
              </SelectItem>
              <SelectItem value="25" className="text-xs">
                25
              </SelectItem>
              <SelectItem value="50" className="text-xs">
                50
              </SelectItem>
              <SelectItem value="100" className="text-xs">
                100
              </SelectItem>
            </SelectContent>
          </Select>

          {totalCount > 0 && (
            <span className="ml-2">
              Showing {startRecord.toLocaleString()} -{" "}
              {endRecord.toLocaleString()} of {totalCount.toLocaleString()} employees
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="h-7.5 w-7.5 p-0 border-border hover:bg-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs font-semibold px-2 text-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="h-7.5 w-7.5 p-0 border-border hover:bg-muted"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
