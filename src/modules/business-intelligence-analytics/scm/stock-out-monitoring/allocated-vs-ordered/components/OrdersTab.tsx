"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderAllocationSummary } from "../types";

type Props = {
  orderSummaries: OrderAllocationSummary[];
};

function numFmt(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}
function pctFmt(n: number) {
  return `${n.toFixed(1)}%`;
}
function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function OrdersTab({ orderSummaries }: Props) {
  const [sortKey, setSortKey] =
    React.useState<keyof OrderAllocationSummary>("orderDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [showFullyConsolidated] =
    React.useState<boolean>(true);

  const handleSort = React.useCallback(
    (key: keyof OrderAllocationSummary) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const sorted = React.useMemo(() => {
    // Apply search and toggle filters before sorting
    let data = orderSummaries;
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter(
        (o) =>
          String(o.orderNo).toLowerCase().includes(q) ||
          (o.supplierName || "").toLowerCase().includes(q),
      );
    }
    if (!showFullyConsolidated) {
      data = data.filter(
        (o) =>
          !(
            o.allocationRate >= 99.999 ||
            (o.allocationGap === 0 && o.totalOrdered > 0)
          ),
      );
    }
    return [...data].sort((a, b) => {
      const va = a[sortKey] as number | string | boolean;
      const vb = b[sortKey] as number | string | boolean;
      if (typeof va === "boolean") {
        return sortDir === "asc"
          ? Number(va) - Number(vb)
          : Number(vb) - Number(va);
      }
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [orderSummaries, sortKey, sortDir, appliedSearch, showFullyConsolidated]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedItems = React.useMemo(
    () =>
      sorted.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [sorted, currentPage, itemsPerPage],
  );

  // Debounce appliedSearch from searchQuery
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const sortIcon = (col: keyof OrderAllocationSummary) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (orderSummaries.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No order data available. Generate a report to see results.
        </CardContent>
      </Card>
    );
  }

  const shortageCount = orderSummaries.filter((o) => o.isShortage).length;

  return (
    <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              All Orders — {orderSummaries.length} orders
            </CardTitle>
            <div className="flex items-center gap-2">
              {shortageCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {shortageCount} shortage{shortageCount > 1 ? "s" : ""}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Sorted by:{" "}
                <span className="font-medium">{String(sortKey)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search order no or supplier "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64"
            />
            {searchQuery ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setAppliedSearch("");
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            ) : null}

            {/* <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">
                Show fully allocated
              </span>
              <Switch
                checked={showFullyConsolidated}
                onCheckedChange={(v) => {
                  setShowFullyConsolidated(Boolean(v));
                  setCurrentPage(1);
                }}
              />
            </div> */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ tableLayout: "fixed", minWidth: 980 }}
          >
            <colgroup>
              <col style={{ width: 150 }} /> {/* Order No */}
              <col style={{ width: 110 }} /> {/* Date */}
              <col style={{ width: 120 }} /> {/* Status */}
              <col style={{ width: 280 }} /> {/* Supplier */}
              <col style={{ width: 80 }} /> {/* Products */}
              <col style={{ width: 80 }} /> {/* Ordered */}
              <col style={{ width: 80 }} /> {/* Allocated */}
              <col style={{ width: 60 }} /> {/* Gap */}
              <col style={{ width: 60 }} /> {/* Rate */}
              <col style={{ width: 100 }} /> {/* Net Amount */}
            </colgroup>
            <thead>
              <tr className="border-b dark:border-zinc-700 bg-muted/30">
                <th
                  className="py-3 pl-4 pr-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("orderNo")}
                >
                  Order No. {sortIcon("orderNo")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                  onClick={() => handleSort("orderDate")}
                >
                  Date {sortIcon("orderDate")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("orderStatus")}
                >
                  Status {sortIcon("orderStatus")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("supplierName")}
                >
                  Supplier {sortIcon("supplierName")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("productCount")}
                >
                  Products {sortIcon("productCount")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("totalOrdered")}
                >
                  Ordered {sortIcon("totalOrdered")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("totalAllocated")}
                >
                  Allocated {sortIcon("totalAllocated")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("allocationGap")}
                >
                  Gap {sortIcon("allocationGap")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("allocationRate")}
                >
                  Rate {sortIcon("allocationRate")}
                </th>
                <th
                  className="py-3 pr-4 pl-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("netAmount")}
                >
                  Net Amount {sortIcon("netAmount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((row) => (
                <tr
                  key={row.orderId}
                  className={[
                    "border-b dark:border-zinc-800 hover:bg-muted/30 transition-colors",
                    row.isShortage
                      ? "bg-rose-50/40 dark:bg-rose-950/20"
                      : "bg-emerald-50/20 dark:bg-emerald-950/5",
                  ].join(" ")}
                >
                  <td className="py-2.5 pl-4 pr-2 font-medium">
                    {row.orderNo}
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground text-xs whitespace-nowrap">
                    {fmtDate(row.orderDate)}
                  </td>
                  <td className="py-2.5 px-2">
                    <Badge variant="outline" className="text-xs">
                      {row.orderStatus}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-2 max-w-55">
                    <span className="block truncate">{row.supplierName}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-muted-foreground">
                    {row.productCount}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    {numFmt(row.totalOrdered)}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {numFmt(row.totalAllocated)}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    {row.allocationGap > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        {numFmt(row.allocationGap)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                        —
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <Badge
                      variant="outline"
                      className={[
                        "text-xs font-medium",
                        row.allocationRate >= 90
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : row.allocationRate >= 70
                            ? "border-amber-500 text-amber-600 dark:text-amber-400"
                            : "border-rose-500 text-rose-600 dark:text-rose-400",
                      ].join(" ")}
                    >
                      {pctFmt(row.allocationRate)}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 pl-2 text-right tabular-nums">
                    ₱{numFmt(row.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <select
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
              {sorted.length} items
            </span>
          </div>
          <div className="flex gap-1">
            <button
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`inline-flex items-center justify-center rounded-md border px-3 h-8 text-sm dark:border-zinc-700 ${currentPage === pageNum ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background"}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm dark:border-zinc-700 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
