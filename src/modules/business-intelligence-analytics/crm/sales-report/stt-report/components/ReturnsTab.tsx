// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/ReturnsTab.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReturnRecord } from "../types";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("en-US");

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

function getPageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const nums: (number | "…")[] = [1];
  if (page > 3) nums.push("…");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  )
    nums.push(i);
  if (page < totalPages - 2) nums.push("…");
  nums.push(totalPages);
  return nums;
}

type ReturnsTabProps = {
  returnRecords: ReturnRecord[];
};

const SortIndicator = ({
  k,
  sortKey,
  sortDir,
}: {
  k: keyof ReturnRecord;
  sortKey: keyof ReturnRecord;
  sortDir: "asc" | "desc";
}) => (
  <span className="inline-block w-3 ml-0.5 text-xs select-none">
    {sortKey === k ? (
      sortDir === "asc" ? (
        "↑"
      ) : (
        "↓"
      )
    ) : (
      <span className="opacity-0">↓</span>
    )}
  </span>
);

function ReturnsTabComponent({ returnRecords }: ReturnsTabProps) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] =
    React.useState<keyof ReturnRecord>("returnTotalAmount");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [animKey, setAnimKey] = React.useState(0);

  const toggleSort = (key: keyof ReturnRecord) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
    setAnimKey((k) => k + 1);
  };

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? returnRecords.filter(
          (r) =>
            (r.invoiceNo ?? "").toLowerCase().includes(q) ||
            (r.customerName ?? "").toLowerCase().includes(q) ||
            (r.productName ?? "").toLowerCase().includes(q) ||
            (r.productSupplier ?? "").toLowerCase().includes(q) ||
            (r.salesman ?? "").toLowerCase().includes(q),
        )
      : returnRecords;

    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [returnRecords, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => setPage(1), [search, pageSize]);

  const totalReturnAmt = React.useMemo(
    () => filtered.reduce((s, r) => s + r.returnTotalAmount, 0),
    [filtered],
  );
  const totalReturnQty = React.useMemo(
    () => filtered.reduce((s, r) => s + r.returnQuantity, 0),
    [filtered],
  );

  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const pageNums = getPageNumbers(page, totalPages);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      {returnRecords.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <Card className="dark:border-zinc-700 ">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Total Return Records
              </p>
              <p className="text-xl font-bold mt-1">
                {numFmt.format(filtered.length)}
              </p>
            </CardContent>
          </Card>
          <Card className="dark:border-zinc-700 ">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Total Return Quantity
              </p>
              <p className="text-xl font-bold mt-1">
                {numFmt.format(totalReturnQty)}
              </p>
            </CardContent>
          </Card>
          <Card className="dark:border-zinc-700 ">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Total Return Amount
              </p>
              <p className="text-xl font-bold mt-1">
                {phpFmt.format(totalReturnAmt)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="dark:border-zinc-700 ">
        <CardHeader>
          <CardTitle>Product Returns</CardTitle>
          <CardDescription>
            {filtered.length === 0
              ? "No return records in the current filter"
              : `${filtered.length} return line${filtered.length !== 1 ? "s" : ""} — click headers to sort`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3 pt-2">
            <Input
              placeholder="Search invoice, customer, product, supplier, salesman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm dark:border-zinc-700"
            />
          </div>

          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-225">
              <TableHeader>
                <TableRow className="dark:border-zinc-700">
                  <TableHead
                    className="w-30 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("invoiceNo")}
                  >
                    Invoice No
                    <SortIndicator
                      k="invoiceNo"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-20 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("invoiceDate")}
                  >
                    Date
                    <SortIndicator
                      k="invoiceDate"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-37.5 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("customerName")}
                  >
                    Customer
                    <SortIndicator
                      k="customerName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-42.5 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("productName")}
                  >
                    Product
                    <SortIndicator
                      k="productName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-30 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("productSupplier")}
                  >
                    Supplier
                    <SortIndicator
                      k="productSupplier"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-25 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("salesman")}
                  >
                    Salesman
                    <SortIndicator
                      k="salesman"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-15 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnQuantity")}
                  >
                    Rtn Qty
                    <SortIndicator
                      k="returnQuantity"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnTotalAmount")}
                  >
                    Rtn Amount
                    <SortIndicator
                      k="returnTotalAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnDiscountAmount")}
                  >
                    Rtn Discount
                    <SortIndicator
                      k="returnDiscountAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                  <TableHead
                    className="w-22 cursor-pointer hover:text-foreground text-right"
                    onClick={() => toggleSort("returnNetAmount")}
                  >
                    Net Return
                    <SortIndicator
                      k="returnNetAmount"
                      sortKey={sortKey}
                      sortDir={sortDir}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                key={animKey}
                className="animate-in fade-in-0 duration-200"
              >
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {returnRecords.length === 0
                        ? "No returns found in the selected period"
                        : "No results match your search"}
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map((r, i) => (
                  <TableRow
                    key={`${r.invoiceId}-${r.productName}-${i}`}
                    className="dark:border-zinc-700"
                  >
                    <TableCell className="font-mono text-sm font-medium overflow-hidden">
                      <p className="truncate">{r.invoiceNo}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.invoiceDate)}
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate" title={r.customerName}>
                        {r.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate text-sm" title={r.productName}>
                        {r.productName}
                      </p>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p
                        className="truncate text-sm text-muted-foreground"
                        title={r.productSupplier}
                      >
                        {r.productSupplier}
                      </p>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate text-sm" title={r.salesman}>
                        {r.salesman}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-orange-600 dark:text-orange-400">
                      {numFmt.format(r.returnQuantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400">
                      {phpFmt.format(r.returnTotalAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {phpFmt.format(r.returnDiscountAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {phpFmt.format(r.returnNetAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Standard Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-zinc-700 gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>per page</span>
              </div>
              <span>
                Showing {from} to {to} of {filtered.length} results
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs dark:border-zinc-700"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                Previous
              </Button>
              {pageNums.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-muted-foreground text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs dark:border-zinc-700"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs dark:border-zinc-700"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const ReturnsTab = React.memo(ReturnsTabComponent);
