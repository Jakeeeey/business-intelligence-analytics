"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerLeadTimeRow } from "../types";

type Props = {
  rows: CustomerLeadTimeRow[];
  loading: boolean;
  loadedOnce?: boolean;
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const str = String(dateStr).trim();
  // Parse "YYYY-MM-DD HH:mm:ss" format
  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/,
  );
  if (match) {
    const d = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(match[6] ?? 0),
    );
    if (!isNaN(d.getTime())) {
      try {
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return d.toDateString();
      }
    }
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d.toDateString();
  }
}

type SortKey = "soNo" | "poNo" | "totalDays" | "customerName" | null;

export function CustomerLeadTimeTable({
  rows,
  loading,
  loadedOnce = false,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const PER_PAGE = 15;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.customerCode || "").toLowerCase().includes(q) ||
        String(r.customerName || "").toLowerCase().includes(q) ||
        String(r.soNo || "").toLowerCase().includes(q) ||
        String(r.poNo || "").toLowerCase().includes(q) ||
        String(r.totalDays ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    if (!sortBy) return arr;
    arr.sort((a, b) => {
      if (sortBy === "totalDays") {
        const av = a.totalDays ?? -Infinity;
        const bv = b.totalDays ?? -Infinity;
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (sortBy === "soNo" || sortBy === "poNo" || sortBy === "customerName") {
        const av = String(a[sortBy] || "");
        const bv = String(b[sortBy] || "");
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  // Reset page on data/filter/sort change
  React.useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortDir, rows.length]);

  const onSort = (col: NonNullable<SortKey>) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sortIcon = (col: NonNullable<SortKey>) =>
    sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  if (loading) {
    return (
      <Card>
        <div>
          <div className="flex items-center gap-4 mb-3 p-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>SO No.</TableHead>
                <TableHead>PO No.</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Picked (Conso)</TableHead>
                <TableHead>Dispatched</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Total Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="whitespace-nowrap">
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-lg font-semibold mb-2">
            {loadedOnce
              ? "No data to display for this customer"
              : "No data to display. "}
          </div>
          <div className="text-sm text-muted-foreground">
            {loadedOnce
              ? "Please select other customer or date range, then click Apply."
              : "Please select a date range, then click Apply."}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginatedRows =
    sorted.length > PER_PAGE
      ? sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)
      : sorted;

  return (
    <Card className="p-6">
      <div>
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search customer, SO No., PO No...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="border rounded-2xl">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => onSort("customerName")}
                >
                  Customer{sortIcon("customerName")}
                </TableHead>
                <TableHead
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => onSort("soNo")}
                >
                  SO No.{sortIcon("soNo")}
                </TableHead>
                <TableHead
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => onSort("poNo")}
                >
                  PO No.{sortIcon("poNo")}
                </TableHead>
                <TableHead className="whitespace-nowrap">Purchased Date</TableHead>
                <TableHead className="whitespace-nowrap">Created Date</TableHead>
                <TableHead className="whitespace-nowrap">Approved Date</TableHead>
                <TableHead className="whitespace-nowrap">Picked (Conso) Date</TableHead>
                <TableHead className="whitespace-nowrap">Dispatched Date</TableHead>
                <TableHead className="whitespace-nowrap">Delivered Date</TableHead>
                <TableHead
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => onSort("totalDays")}
                >
                  Total Days{sortIcon("totalDays")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, idx) => (
                <TableRow key={`${row.soNo}::${row.poNo}::${idx}`}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{row.customerName || "—"}</span>
                      <span className="text-xs text-muted-foreground">{row.customerCode || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.soNo || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.poNo || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.purchasedDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.createdDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.approvedDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.pickedConsoDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.dispatchedDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.deliveredDate)}</TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    {row.totalDays != null ? row.totalDays : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sorted.length > PER_PAGE ? (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {`Showing ${Math.min((page - 1) * PER_PAGE + 1, sorted.length)} - ${Math.min(
                page * PER_PAGE,
                sorted.length,
              )} of ${sorted.length}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
