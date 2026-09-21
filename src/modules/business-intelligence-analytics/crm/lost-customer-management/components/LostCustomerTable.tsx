"use client";

import React, { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  User,
  Eye,
  Building,
  Phone,
  Mail,
  Calendar,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LostCustomerRecord, SortField, SortOrder } from "../types";

interface LostCustomerTableProps {
  data: LostCustomerRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectCustomer: (customer: LostCustomerRecord) => void;
  loading: boolean;
}

function getInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTaggingBadge(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("lost")) {
    return (
      <Badge
        variant="outline"
        className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  if (t.includes("dormant")) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  if (t.includes("risk")) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2 py-0.5"
      >
        {tag}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold px-2 py-0.5"
    >
      {tag}
    </Badge>
  );
}

function formatDaysInactive(days: number) {
  let approx = "";
  if (days >= 365) {
    const yrs = (days / 365).toFixed(1);
    approx = ` (~${yrs} yrs)`;
  } else if (days >= 30) {
    const mos = Math.round(days / 30);
    approx = ` (~${mos} mos)`;
  }

  if (days >= 180) {
    return (
      <span className="font-bold text-red-600 dark:text-red-400">
        {days} days
        <span className="font-normal text-[10px] text-red-500/80">{approx}</span>
      </span>
    );
  }
  if (days >= 90) {
    return (
      <span className="font-bold text-orange-600 dark:text-orange-400">
        {days} days
        <span className="font-normal text-[10px] text-orange-500/80">{approx}</span>
      </span>
    );
  }
  if (days >= 60) {
    return (
      <span className="font-bold text-amber-600 dark:text-amber-400">
        {days} days
        <span className="font-normal text-[10px] text-amber-500/80">{approx}</span>
      </span>
    );
  }
  return (
    <span className="font-medium text-foreground">
      {days} days
      <span className="font-normal text-[10px] text-muted-foreground">{approx}</span>
    </span>
  );
}

export function LostCustomerTable({
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
  onSelectCustomer,
  loading,
}: LostCustomerTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
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
    <Card className="border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[11px] tracking-wider font-semibold">
              <th
                onClick={() => onSort("customerCode")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Customer Code</span>
                  {renderSortIcon("customerCode")}
                </div>
              </th>

              <th
                onClick={() => onSort("customerName")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Customer Name & Account</span>
                  {renderSortIcon("customerName")}
                </div>
              </th>

              <th
                onClick={() => onSort("tagging")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Tagging</span>
                  {renderSortIcon("tagging")}
                </div>
              </th>

              <th
                onClick={() => onSort("minDaysNoSales")}
                className="cursor-pointer py-3.5 px-4 text-right select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Days Inactive</span>
                  {renderSortIcon("minDaysNoSales")}
                </div>
              </th>

              <th
                onClick={() => onSort("lastSalesDate")}
                className="cursor-pointer py-3.5 px-4 select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center">
                  <span>Last Sales Date</span>
                  {renderSortIcon("lastSalesDate")}
                </div>
              </th>

              <th
                onClick={() => onSort("totalHistoricalSales")}
                className="cursor-pointer py-3.5 px-4 text-right select-none hover:text-foreground transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Historical Sales (PHP)</span>
                  {renderSortIcon("totalHistoricalSales")}
                </div>
              </th>

              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading customer accounts...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No lost or dormant customer records match your filter criteria.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectCustomer(c)}
                >
                  {/* Code with copy button */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                      <span>{c.customerCode}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, c.customerCode)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground"
                        title="Copy customer code"
                      >
                        {copiedCode === c.customerCode ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Name & Avatar & Subtitle */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                        {getInitials(c.customerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {c.customerName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {c.branchName && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {c.branchName}
                            </span>
                          )}
                          {c.salesmanName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {c.salesmanName}
                            </span>
                          )}
                          {c.contactNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.contactNumber}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tagging */}
                  <td className="py-3 px-4">
                    {getTaggingBadge(c.tagging)}
                  </td>

                  {/* Days Inactive */}
                  <td className="py-3 px-4 text-right">
                    {formatDaysInactive(c.minDaysNoSales)}
                  </td>

                  {/* Last Sales Date */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      <span>{c.lastSalesDate || "No orders recorded"}</span>
                    </div>
                  </td>

                  {/* Historical Sales */}
                  <td className="py-3 px-4 text-right font-semibold text-foreground">
                    ₱
                    {c.totalHistoricalSales.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Action */}
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomer(c);
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
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
              {endRecord.toLocaleString()} of {totalCount.toLocaleString()} accounts
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
