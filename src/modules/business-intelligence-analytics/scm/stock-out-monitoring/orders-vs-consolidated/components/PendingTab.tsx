"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { CanonicalOrder } from "../types";

type Props = { pendingOrders: CanonicalOrder[] };

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

/** How many calendar days since the order date */
function daysAgo(orderDate: string): number {
  const dt = new Date(orderDate + "T00:00:00");
  if (isNaN(dt.getTime())) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - dt.getTime()) / 86_400_000);
}

export function PendingTab({ pendingOrders }: Props) {
  const [sortKey, setSortKey] =
    React.useState<keyof CanonicalOrder>("orderDate");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc"); // oldest first by default
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const handleSort = (key: keyof CanonicalOrder) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = React.useMemo(() => {
    return [...pendingOrders].sort((a, b) => {
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
  }, [pendingOrders, sortKey, sortDir]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedItems = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const sortIcon = (col: keyof CanonicalOrder) => (
    <span className="ml-1 opacity-50 text-xs">
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  if (pendingOrders.length === 0) {
    return (
      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <div className="text-4xl">✅</div>
          <p className="font-medium">No pending orders</p>
          <p className="text-sm text-muted-foreground">
            All orders in the selected period have been consolidated.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalNetAmount = pendingOrders.reduce((s, o) => s + o.netAmount, 0);
  const totalQty = pendingOrders.reduce((s, o) => s + o.totalOrdered, 0);
  const staleCount = pendingOrders.filter(
    (o) => daysAgo(o.orderDate) > 3,
  ).length;

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
        <Clock className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {pendingOrders.length} pending order
            {pendingOrders.length > 1 ? "s" : ""}
          </span>{" "}
          awaiting consolidation — total qty{" "}
          <span className="font-semibold">{numFmt(totalQty)}</span>, net amount{" "}
          <span className="font-semibold">₱{numFmt(totalNetAmount)}</span>
          {staleCount > 0 && (
            <>
              {" "}
              •{" "}
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {staleCount} stale ({">"} 3 days)
              </span>
            </>
          )}
        </div>
      </div>

      <Card className="border-muted dark:border-zinc-700 dark:bg-white/13">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Pending Orders — {pendingOrders.length} items
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Sorted by: <span className="font-medium">{String(sortKey)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                  <th className="py-3 px-2 text-left font-medium text-muted-foreground">
                    Age
                  </th>
                  <th
                    className="py-3 px-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("orderStatus")}
                  >
                    Status {sortIcon("orderStatus")}
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
                    Quantity Ordered {sortIcon("totalOrdered")}
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
                {paginatedItems.map((row) => {
                  const age = daysAgo(row.orderDate);
                  const isStale = age > 3;
                  return (
                    <tr
                      key={row.orderId}
                      className={[
                        "border-b dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors",
                        isStale
                          ? "bg-rose-50/30 dark:bg-rose-950/15"
                          : "bg-amber-50/20 dark:bg-amber-950/10",
                      ].join(" ")}
                    >
                      <td className="py-2.5 pl-4 pr-2 font-medium">
                        {row.orderNo}
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(row.orderDate)}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={[
                            "text-xs",
                            isStale
                              ? "border-rose-400 text-rose-600 dark:text-rose-400"
                              : "border-amber-400 text-amber-600 dark:text-amber-400",
                          ].join(" ")}
                        >
                          {age}d
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className="text-xs">
                          {row.orderStatus}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 max-w-40">
                        <span className="block truncate">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
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
          {totalPages > 1 && (
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
