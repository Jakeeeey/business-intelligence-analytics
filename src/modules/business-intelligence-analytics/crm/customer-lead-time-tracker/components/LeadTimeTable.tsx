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
import type { LeadTimeRow } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  rows: LeadTimeRow[];
  loading: boolean;
  loadedOnce?: boolean;
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  try {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d.toDateString();
  }
}

function getDaysDiff(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return null;
  const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function CellWithTooltip({
  date,
  purchasedDate,
  status,
}: {
  date: string | null;
  purchasedDate: string | null;
  status: string | null;
}) {
  const diff = getDaysDiff(purchasedDate, date);
  const statusStr = (status || "Pending").toUpperCase();
  const daysText = diff !== null ? `${diff} Day${diff === 1 ? "" : "s"}` : "—";
  
  if (!date) {
    return <span>—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help w-full hover:underline underline-offset-2 decoration-muted-foreground/50">
        {formatDate(date)}
      </TooltipTrigger>
      <TooltipContent className="bg-popover text-popover-foreground border shadow-md">
        <div className="flex flex-col gap-1 text-xs text-left">
          <div><span className="font-semibold">Total Days:</span> {daysText}</div>
          <div><span className="font-semibold">Status:</span> {statusStr}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function getCellBgClass(status?: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "on-time") return "bg-green-500/10 dark:bg-green-500/20";
  if (s === "warning") return "bg-orange-500/10 dark:bg-orange-500/20";
  if (s === "delayed") return "bg-red-500/10 dark:bg-red-500/20";
  return "";
}

function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const s = (status || "").toLowerCase();
  
  let className = "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";
  if (s === "on-time") className = "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800";
  else if (s === "warning") className = "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-800";
  else if (s === "delayed") className = "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800";

  return <Badge className={className} variant="outline">{(label || status || "Pending").toUpperCase()}</Badge>;
}

export function LeadTimeTable({ rows, loading, loadedOnce = false }: Props) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const PER_PAGE = 15;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.poNo || "").toLowerCase().includes(q) ||
        String(r.soNo || "").toLowerCase().includes(q) ||
        String(r.customerName || "").toLowerCase().includes(q) ||
        String(r.customerCode || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  React.useEffect(() => {
    setPage(1);
  }, [search, rows.length]);

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>PO No</TableHead>
                <TableHead>SO No</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Picked/Conso</TableHead>
                <TableHead>Dispatched</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead className="text-right">Total Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
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
              ? "No data to display for this product"
              : "No data to display. "}
          </div>
          <div className="text-sm text-muted-foreground">
            {loadedOnce
              ? "Please select other product or date range, then click Apply."
              : "Please select a product and date range, then click Apply."}
          </div>
        </CardContent>
      </Card>
    );
  }

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Card className="p-6">
      <div>
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search PO No., SO No., Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TooltipProvider>
        <Table className="border rounded-2xl">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>PO No</TableHead>
              <TableHead>SO No</TableHead>
              <TableHead className="text-center">Purchased</TableHead>
              <TableHead className="text-center">Created</TableHead>
              <TableHead className="text-center">Approved</TableHead>
              <TableHead className="text-center">Picked/Conso</TableHead>
              <TableHead className="text-center">Dispatched</TableHead>
              <TableHead className="text-center">Delivered</TableHead>
              <TableHead className="text-right">Total Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row) => (
              <TableRow key={`${row.poNo}::${row.soNo}`}>
                <TableCell className="font-medium whitespace-nowrap">
                  {row.customerName}
                  <div className="text-xs text-muted-foreground">
                    {row.customerCode}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.poNo || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{row.soNo || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground text-center">{formatDate(row.purchasedDate)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground text-center">{formatDate(row.createdDate)}</TableCell>
                <TableCell className={`whitespace-nowrap text-xs text-muted-foreground text-center ${getCellBgClass(row.approvalStatus)}`}>
                  <CellWithTooltip date={row.approvedDate} purchasedDate={row.purchasedDate} status={row.approvalStatus} />
                </TableCell>
                <TableCell className={`whitespace-nowrap text-xs text-muted-foreground text-center ${getCellBgClass(row.fulfillmentStatus)}`}>
                  <CellWithTooltip date={row.pickedConsoDate} purchasedDate={row.purchasedDate} status={row.fulfillmentStatus} />
                </TableCell>
                <TableCell className={`whitespace-nowrap text-xs text-muted-foreground text-center ${getCellBgClass(row.deliveryStatus)}`}>
                  <CellWithTooltip date={row.dispatchedDate} purchasedDate={row.purchasedDate} status={row.deliveryStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground text-center">
                  <div className="flex flex-col gap-1 items-center">
                    <span>{formatDate(row.deliveredDate)}</span>
                    <StatusBadge status={row.status} label={row.status} />
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {row.totalDays != null ? `${row.totalDays}d` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>

        {filtered.length > PER_PAGE ? (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {`Showing ${(page - 1) * PER_PAGE + 1} - ${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <div className="text-sm">Page {page} of {Math.ceil(filtered.length / PER_PAGE)}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))} disabled={page === Math.ceil(filtered.length / PER_PAGE)}>Next</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.ceil(filtered.length / PER_PAGE))} disabled={page === Math.ceil(filtered.length / PER_PAGE)}>Last</Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
