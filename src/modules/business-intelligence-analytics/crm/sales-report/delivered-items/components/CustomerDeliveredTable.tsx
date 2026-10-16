// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/components/CustomerDeliveredTable.tsx
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
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Package,
} from "lucide-react";
import type { CustomerDeliveredSummary } from "../types";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

type SortField = "items" | "amount" | "name" | "date";

type Props = {
  data: CustomerDeliveredSummary[];
  onSelectCustomer: (customerName: string) => void;
};

export function CustomerDeliveredTableComponent({ data, onSelectCustomer }: Props) {
  const [sortField, setSortField] = React.useState<SortField>("items");
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
      if (sortField === "items") {
        comparison = a.totalItemsDelivered - b.totalItemsDelivered;
      } else if (sortField === "amount") {
        comparison = a.totalDeliveredAmount - b.totalDeliveredAmount;
      } else if (sortField === "name") {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === "date") {
        comparison = (a.lastDeliveryDate || "").localeCompare(b.lastDeliveryDate || "");
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
            Customer Delivery Performance
          </h3>
          <p className="text-xs text-muted-foreground">
            Total items and sales value delivered breakdown per customer
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <TableHead className="w-[32%] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Customer & Location
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("items")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Items Delivered
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("amount")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Total Amount
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-center text-xs font-semibold">
                Products
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Top Delivered Product
              </TableHead>
              <TableHead className="text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("date")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Last Delivery
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  <Package className="mx-auto mb-2 h-7 w-7 opacity-40" />
                  No delivered items records found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.customerName}
                  className="border-border/50 hover:bg-muted/40 transition-colors dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                >
                  <TableCell className="py-3">
                    <div className="font-medium text-foreground text-xs leading-snug">
                      {row.customerName}
                    </div>
                    {(row.city || row.province) && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {[row.city, row.province].filter((x) => x && x !== "—").join(", ") || "—"}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold px-2 py-0.5 text-xs"
                    >
                      {numFmt.format(row.totalItemsDelivered)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 font-semibold text-xs text-foreground tabular-nums">
                    {phpFmt.format(row.totalDeliveredAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted/60 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {row.uniqueProductsCount} SKUs
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-foreground max-w-[200px]">
                    <div className="truncate font-medium">{row.topProduct}</div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {row.lastDeliveryDate}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectCustomer(row.customerName)}
                      className="h-7 gap-1 px-2.5 text-xs font-medium border-border/70 text-foreground hover:bg-muted dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                    >
                      <span>Items</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Button>
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
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} customers
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
