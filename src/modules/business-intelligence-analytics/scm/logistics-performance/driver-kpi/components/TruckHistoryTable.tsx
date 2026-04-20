"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDriverKPI } from "../hooks/useDriverKPI";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupByDispatch } from "../utils/calculations";
import { formatDateTime, formatDurationFromMinutes } from "../utils/formatters";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";

export default function TruckHistoryTable() {
  const { data, filters } = useDriverKPI();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const driverNamesKey = (filters.driverNames || []).join(",");
  useEffect(() => {
    const id = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(id);
  }, [filters.startDate, filters.endDate, driverNamesKey, filters.searchCustomer]);

  // Use dispatch-level rows: every dispatch record matters (no dedup by truck)
  const dispatches = groupByDispatch(data || []);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedDispatches = useMemo(() => {
    const arr = dispatches.slice();
    if (!sortKey) {
      // default: sort by dispatchTime desc
      return arr.sort((a, b) => {
        const ta = a.dispatchTime ? new Date(a.dispatchTime).getTime() : 0;
        const tb = b.dispatchTime ? new Date(b.dispatchTime).getTime() : 0;
        return tb - ta;
      });
    }

    arr.sort((a, b) => {
      const firstA = a.customers?.[0];
      const firstB = b.customers?.[0];
      let va: unknown = undefined;
      let vb: unknown = undefined;
      switch (sortKey) {
        case "truckName":
          va = firstA?.truckName ?? "";
          vb = firstB?.truckName ?? "";
          break;
        case "plateNo":
          va = firstA?.truckPlateNo ?? a.truck ?? "";
          vb = firstB?.truckPlateNo ?? b.truck ?? "";
          break;
        case "type":
          va = firstA?.truckType ?? "";
          vb = firstB?.truckType ?? "";
          break;
        case "dispatchNo":
          va = a.dispatchDocumentNo ?? "";
          vb = b.dispatchDocumentNo ?? "";
          break;
        case "dispatchTime":
          va = a.dispatchTime ?? null;
          vb = b.dispatchTime ?? null;
          break;
        case "arrivalTime":
          va = a.arrivalTime ?? null;
          vb = b.arrivalTime ?? null;
          break;
        case "duration": {
          const dispatchTimeA = a.dispatchTime ? new Date(a.dispatchTime) : null;
          const arrivalTimeA = a.arrivalTime ? new Date(a.arrivalTime) : null;
          const dispatchTimeB = b.dispatchTime ? new Date(b.dispatchTime) : null;
          const arrivalTimeB = b.arrivalTime ? new Date(b.arrivalTime) : null;
          va = dispatchTimeA && arrivalTimeA ? Math.round((arrivalTimeA.getTime() - dispatchTimeA.getTime()) / 60000) : null;
          vb = dispatchTimeB && arrivalTimeB ? Math.round((arrivalTimeB.getTime() - dispatchTimeB.getTime()) / 60000) : null;
          break;
        }
        default:
          va = undefined;
          vb = undefined;
      }

      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === "asc" ? 1 : -1;
      if (vb == null) return sortDir === "asc" ? -1 : 1;

      if (sortKey === "dispatchTime" || sortKey === "arrivalTime") {
        const na = new Date(String(va)).getTime();
        const nb = new Date(String(vb)).getTime();
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return sortDir === "asc" ? 1 : -1;
        if (isNaN(nb)) return sortDir === "asc" ? -1 : 1;
        return sortDir === "asc" ? na - nb : nb - na;
      }

      if (sortKey === "duration") {
        const na = Number(va as number ?? 0);
        const nb = Number(vb as number ?? 0);
        return sortDir === "asc" ? na - nb : nb - na;
      }

      // string fallback
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });

    return arr;
  }, [dispatches, sortKey, sortDir]);

  // simple outlier threshold (hrs)
  const OUTLIER_HOURS = 8;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-medium ">Truck History</h3>
            <span className="text-muted-foreground">
              Provides a chronological record of all truck dispatch activities,
              enabling visibility into vehicle utilization, trip timelines, and
              operational movement.
            </span>
          </div>

          <div className="flex items-center ">
            <div className="w-80">
              {/* <input
                  placeholder="Search DP No, customer, address, truck..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="h-9 w-full rounded-md border px-3 text-sm"
                /> */}
            </div>
            <div className="text-sm text-muted-foreground">
              {/* {total} records */}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mt-3">
          <div className="bg-background rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm ring-1 ring-border">
                <TableRow className="bg-card">
                  <TableHead className="w-20">No.</TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("truckName")}>Truck Name{sortKey === "truckName" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("plateNo")}>Plate No.{sortKey === "plateNo" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("type")}>Type{sortKey === "type" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("dispatchNo")}>Dispatch No{sortKey === "dispatchNo" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("dispatchTime")}>Dispatch Time{sortKey === "dispatchTime" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("arrivalTime")}>Arrival Time{sortKey === "arrivalTime" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("duration")}>Duration{sortKey === "duration" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const safeLimit = limit > 0 ? limit : 20;
                  const startIndex = (page - 1) * safeLimit;
                  const endIndex = startIndex + safeLimit;
                  const pageRows = sortedDispatches.slice(startIndex, endIndex);

                  return pageRows.map((d, i) => {
                    const first = d.customers?.[0];
                    const dispatchTime = d.dispatchTime
                      ? new Date(d.dispatchTime)
                      : null;
                    const arrivalTime = d.arrivalTime
                      ? new Date(d.arrivalTime)
                      : null;

                    let durationMinutes: number | null = null;
                    if (dispatchTime && arrivalTime) {
                      const ms = arrivalTime.getTime() - dispatchTime.getTime();
                      if (ms > 0) durationMinutes = Math.round(ms / 60000);
                    }

                    const isLong =
                      durationMinutes !== null &&
                      durationMinutes / 60 > OUTLIER_HOURS;

                    return (
                      <TableRow
                        key={`${d.dispatchDocumentNo}-${startIndex + i}`}
                        className={`border-t ${isLong ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                      >
                        <TableCell>{startIndex + i + 1}</TableCell>
                        <TableCell>{first?.truckName ?? "-"}</TableCell>
                        <TableCell className="font-mono">
                          {first?.truckPlateNo ?? d.truck ?? "-"}
                        </TableCell>
                        <TableCell>{first?.truckType ?? "-"}</TableCell>
                        <TableCell>{d.dispatchDocumentNo}</TableCell>
                        <TableCell>
                          {dispatchTime
                            ? formatDateTime(dispatchTime.toISOString())
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {arrivalTime ? (
                            formatDateTime(arrivalTime.toISOString())
                          ) : (
                            <span className="text-muted-foreground">
                              In Progress
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {durationMinutes !== null
                                ? formatDurationFromMinutes(durationMinutes)
                                : "-"}
                            </span>
                            {isLong && (
                              <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                                Long
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      {/* pagination */}
      <div className="p-4 pt-0 flex items-center justify-between">
        {(() => {
          const sorted = dispatches.slice().sort((a, b) => {
            const ta = a.dispatchTime ? new Date(a.dispatchTime).getTime() : 0;
            const tb = b.dispatchTime ? new Date(b.dispatchTime).getTime() : 0;
            return tb - ta;
          });
          const localTotal = sorted.length;
          const safeLimit = limit > 0 ? limit : 20;
          const totalPages = Math.max(1, Math.ceil(localTotal / safeLimit));
          const startIndex = (page - 1) * safeLimit;
          const endIndex = Math.min(startIndex + safeLimit, localTotal);

          return (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Items per page
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    const n = Number(v);
                    setLimit(n);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {[5, 10, 20, 30, 40, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {localTotal === 0 ? 0 : startIndex + 1} - {endIndex} of{" "}
                {localTotal}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && <span className="px-1 text-sm">...</span>}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </Card>
  );
}
