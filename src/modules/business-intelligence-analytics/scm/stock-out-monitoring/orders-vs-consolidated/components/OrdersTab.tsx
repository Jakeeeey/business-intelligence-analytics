"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CanonicalOrder } from "../types";

type Props = { canonicalOrders: CanonicalOrder[] };

function numFmt(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 2 });
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

export function OrdersTab({ canonicalOrders }: Props) {
  const [sortKey, setSortKey] =
    React.useState<keyof CanonicalOrder>("orderDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  /* ─── Local filter state ── */
  const [supplierFilter, setSupplierFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [showFullyConsolidated, setShowFullyConsolidated] =
    React.useState<boolean>(true);

  // const uniqueOrderSuppliers = React.useMemo(
  //   () =>
  //     [...new Set(canonicalOrders.map((o) => o.supplierName))]
  //       .filter(Boolean)
  //       .sort(),
  //   [canonicalOrders],
  // );
  // const uniqueOrderStatuses = React.useMemo(
  //   () =>
  //     [...new Set(canonicalOrders.map((o) => o.orderStatus))]
  //       .filter(Boolean)
  //       .sort(),
  //   [canonicalOrders],
  // );

  const filteredOrders = React.useMemo(() => {
    let data = canonicalOrders;
    if (supplierFilter !== "all")
      data = data.filter((o) => o.supplierName === supplierFilter);
    if (statusFilter !== "all")
      data = data.filter((o) => o.orderStatus === statusFilter);
    // Apply search if provided
    if (appliedSearch && appliedSearch.trim() !== "") {
      const q = appliedSearch.trim().toLowerCase();
      data = data.filter(
        (o) =>
          String(o.orderNo).toLowerCase().includes(q) ||
          (o.supplierName || "").toLowerCase().includes(q),
      );
    }
    // Exclude fully consolidated orders when toggle is off
    if (!showFullyConsolidated) {
      data = data.filter((o) => !o.isConsolidated);
    }
    return data;
  }, [
    canonicalOrders,
    supplierFilter,
    statusFilter,
    appliedSearch,
    showFullyConsolidated,
  ]);

  const handleSort = (key: keyof CanonicalOrder) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const sorted = React.useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
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
  }, [filteredOrders, sortKey, sortDir]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDir, supplierFilter, statusFilter]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedItems = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Debounce appliedSearch from searchQuery
  React.useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const sortIcon = (col: keyof CanonicalOrder) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (canonicalOrders.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No order data available. Generate a report to see results.
        </CardContent>
      </Card>
    );
  }

  const pendingCount = canonicalOrders.filter((o) => !o.isConsolidated).length;

  return (
    <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              All Orders — {sorted.length} of {canonicalOrders.length} orders
            </CardTitle>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                >
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>
          {/* Filter dropdowns + search + consolidated toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search orders..."
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

            {/* <select
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="all">All Suppliers</option>
              {uniqueOrderSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm dark:border-zinc-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {uniqueOrderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select> */}
            {(supplierFilter !== "all" || statusFilter !== "all") && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline"
                onClick={() => {
                  setSupplierFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear
              </button>
            )}

            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">
                Show fully consolidated
              </span>
              <Switch
                checked={showFullyConsolidated}
                onCheckedChange={(v) => {
                  setShowFullyConsolidated(Boolean(v));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ tableLayout: "fixed", minWidth: 800 }}
          >
            <colgroup>
              <col style={{ width: 130 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 145 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr className="border-b dark:border-zinc-700 bg-muted/30">
                <th
                  className="py-3 pl-4 pr-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("orderNo")}
                >
                  Order No. {sortIcon("orderNo")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("orderDate")}
                >
                  Date {sortIcon("orderDate")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("orderStatus")}
                >
                  Status {sortIcon("orderStatus")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("isConsolidated")}
                >
                  Consolidated? {sortIcon("isConsolidated")}
                </th>
                <th
                  className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("supplierName")}
                >
                  Supplier {sortIcon("supplierName")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("productCount")}
                >
                  Products {sortIcon("productCount")}
                </th>
                <th
                  className="py-3 px-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("totalOrdered")}
                >
                  Qty Ordered {sortIcon("totalOrdered")}
                </th>
                <th
                  className="py-3 pr-4 pl-2 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground"
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
                    !row.isConsolidated
                      ? "bg-amber-50/30 dark:bg-amber-950/15"
                      : "bg-emerald-50/10 dark:bg-emerald-950/5",
                  ].join(" ")}
                >
                  <td className="py-2.5 pl-4 pr-2 font-medium">
                    <span className="block truncate">{row.orderNo}</span>
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground text-xs whitespace-nowrap">
                    {fmtDate(row.orderDate)}
                  </td>
                  <td className="py-2.5 px-2">
                    <Badge variant="outline" className="text-xs">
                      <span className="block truncate max-w-30">
                        {row.orderStatus}
                      </span>
                    </Badge>
                  </td>
                  <td className="py-2.5 px-2">
                    {row.isConsolidated ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                      >
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="block truncate" title={row.supplierName}>
                      {row.supplierName}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-muted-foreground">
                    {row.productCount}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    {numFmt(row.totalOrdered)}
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
