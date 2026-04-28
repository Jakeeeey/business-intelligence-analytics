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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { LeadTimeRow, LeadTimeStatus } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor } from "../utils/getStatusColor";

type Props = {
  rows: LeadTimeRow[];
  loading: boolean;
  loadedOnce?: boolean;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d.toDateString();
  }
}

function getCellBgClass(status?: LeadTimeStatus | null) {
  return getStatusColor(status as string | undefined);
}

function statusToLabel(s?: string | null) {
  const st = String(s ?? "").toLowerCase();
  if (st === "on-time" || st === "on time" || st === "ontime") return "On time";
  if (st === "warning" || st === "warn" || st === "amber") return "Warning";
  if (st === "delayed" || st === "delay" || st === "late") return "Delayed";
  return "Pending";
}

export function LeadTimeTable({ rows, loading, loadedOnce = false }: Props) {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"poNo" | "poDate" | "soNo" | null>(
    null,
  );
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.poNo || "")
          .toLowerCase()
          .includes(q) ||
        String(r.soNo || "")
          .toLowerCase()
          .includes(q) ||
        (String(r.approval ?? "") || "").toLowerCase().includes(q) ||
        (String(r.dispatch ?? "") || "").toLowerCase().includes(q) ||
        (String(r.delivered ?? "") || "").toLowerCase().includes(q) ||
        (String(r.approvalStatus || "") || "").toLowerCase().includes(q) ||
        (String(r.fulfillmentStatus || "") || "").toLowerCase().includes(q) ||
        (String(r.deliveryStatus || "") || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    if (!sortBy) return arr;
    arr.sort((a, b) => {
      if (sortBy === "poDate") {
        const at = new Date(a.poDate).getTime();
        const bt = new Date(b.poDate).getTime();
        if (isNaN(at) && isNaN(bt)) return 0;
        if (isNaN(at)) return 1;
        if (isNaN(bt)) return -1;
        return sortDir === "asc" ? at - bt : bt - at;
      }
      if (sortBy === "poNo") {
        const an = Number(a.poNo);
        const bn = Number(b.poNo);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) {
          return sortDir === "asc" ? an - bn : bn - an;
        }
        return sortDir === "asc"
          ? String(a.poNo).localeCompare(String(b.poNo))
          : String(b.poNo).localeCompare(String(a.poNo));
      }
      if (sortBy === "soNo") {
        const an = Number(a.soNo as unknown as number);
        const bn = Number(b.soNo as unknown as number);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) {
          return sortDir === "asc" ? an - bn : bn - an;
        }
        return sortDir === "asc"
          ? String(a.soNo ?? "").localeCompare(String(b.soNo ?? ""))
          : String(b.soNo ?? "").localeCompare(String(a.soNo ?? ""));
      }
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const onSort = (col: "poNo" | "poDate" | "soNo") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const displayNumber = (n: number | null | undefined) =>
    n == null ? "-" : String(n);

  if (loading) {
    return (
      <Card>
        <div>
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-10 w-64" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO No.</TableHead>
                <TableHead>SO No.</TableHead>
                <TableHead>PO Date</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Dispatch</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="whitespace-nowrap">
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
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

  return (
    <Card className="p-6">
      <div>
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center gap-3 justify-end">
            {/* <span className="text-sm font-medium">Status:</span> */}
            <div className="flex items-center gap-2 pr-7">
              {[
                { key: "pending", label: statusToLabel("pending") },
                { key: "on-time", label: statusToLabel("on-time") },
                { key: "warning", label: statusToLabel("warning") },
                { key: "delayed", label: statusToLabel("delayed") },
              ].map((s) => (
                <span
                  key={s.key}
                  className={`inline-flex items-center px-3 py-0.5 rounded-md text-xs  ${getStatusColor(
                    s.key,
                  )} ${s.key === "pending" ? "border border-border " : ""}`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Search PO No., SO No., or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table className="border rounded-2xl">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort("poNo")}
              >
                PO No.{" "}
                {sortBy === "poNo" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort("soNo")}
              >
                SO No.{" "}
                {sortBy === "soNo" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort("poDate")}
              >
                PO Date{" "}
                {sortBy === "poDate" ? (sortDir === "asc" ? "▲" : "▼") : null}
              </TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Dispatch</TableHead>
              <TableHead>Delivered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={`${row.poNo}::${row.soNo}::${row.poDate}`}>
                <TableCell>{row.poNo}</TableCell>
                <TableCell>{row.soNo ?? "-"}</TableCell>
                <TableCell>{formatDate(row.poDate)}</TableCell>
                <TableCell
                  className={`${getCellBgClass(row.approvalStatus)} text-left`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{displayNumber(row.approval)}</div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      {statusToLabel(row.approvalStatus)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell
                  className={`${getCellBgClass(row.fulfillmentStatus)} text-left`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{displayNumber(row.dispatch)}</div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      {statusToLabel(row.fulfillmentStatus)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell
                  className={`${getCellBgClass(row.deliveryStatus)} text-left`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{displayNumber(row.delivered)}</div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      {statusToLabel(row.deliveryStatus)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
