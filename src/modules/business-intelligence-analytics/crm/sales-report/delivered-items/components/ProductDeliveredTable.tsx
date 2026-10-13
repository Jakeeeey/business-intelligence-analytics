// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/components/ProductDeliveredTable.tsx
"use client";

import * as React from "react";
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
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, FileText, PackageCheck } from "lucide-react";
import type { ProductDeliveredSummary } from "../types";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

type SortField = "qty" | "amount" | "name" | "customers";

type Props = {
  data: ProductDeliveredSummary[];
  onExport?: () => void;
  onExportPdf?: () => void;
};

export function ProductDeliveredTableComponent({ data, onExport, onExportPdf }: Props) {
  const [sortField, setSortField] = React.useState<SortField>("qty");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortField === "qty") {
        comparison = a.totalQuantity - b.totalQuantity;
      } else if (sortField === "amount") {
        comparison = a.totalAmount - b.totalAmount;
      } else if (sortField === "name") {
        comparison = a.productName.localeCompare(b.productName);
      } else if (sortField === "customers") {
        comparison = a.customersCount - b.customersCount;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-4 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Delivered Products Summary
          </h3>
          <p className="text-xs text-muted-foreground">
            Total quantity and sales volume delivered per product SKU
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPdf}
              className="h-8 gap-1.5 px-2.5 text-xs font-normal border-border/80 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground"
            >
              <FileText className="h-3 w-3 text-rose-500" />
              <span>Export PDF</span>
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 gap-1.5 px-2.5 text-xs font-normal border-border/80 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Download className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs dark:border-zinc-700 dark:bg-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:border-zinc-800 dark:bg-zinc-900">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 dark:bg-zinc-800/40">
            <TableRow className="border-border/60 dark:border-zinc-800">
              <TableHead className="w-[45%] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Product Name
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Supplier
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("qty")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Quantity Delivered
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("amount")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Total Revenue
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("customers")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Customers Reached
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  <PackageCheck className="mx-auto mb-2 h-7 w-7 opacity-40" />
                  No delivered products found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.productName}
                  className="border-border/50 hover:bg-muted/40 transition-colors dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                >
                  <TableCell className="py-3">
                    <div className="font-medium text-foreground text-xs">
                      {row.productName}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {row.supplier}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold px-2 py-0.5 text-xs"
                    >
                      {numFmt.format(row.totalQuantity)} units
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 font-semibold text-xs text-foreground tabular-nums">
                    {phpFmt.format(row.totalAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted/60 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {row.customersCount} customer{row.customersCount !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/70 p-3.5 dark:border-zinc-800 text-xs text-muted-foreground">
        <div>
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} products
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-8 w-8 p-0 dark:border-zinc-700 dark:bg-zinc-800/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 w-8 p-0 dark:border-zinc-700 dark:bg-zinc-800/80"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
