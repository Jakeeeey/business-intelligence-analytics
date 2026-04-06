"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DELAY_THRESHOLDS } from "../utils/constants";
import { formatDateTime, formatDurationFromMinutes } from "../utils/formatters";

function varianceMinutes(estimated?: string | null, actual?: string | null) {
  if (!estimated || !actual) return null;
  const e = new Date(estimated).getTime();
  const a = new Date(actual).getTime();
  if (isNaN(e) || isNaN(a)) return null;
  return Math.round((a - e) / 60000);
}

// function formatDurationFromMinutes(minutes: number | null | undefined) {
//   if (minutes === null || minutes === undefined) return "-";
//   const m = Math.round(minutes);
//   const sign = m < 0 ? "-" : "";
//   const abs = Math.abs(m);
//   if (abs >= 1440) {
//     const days = Math.floor(abs / 1440);
//     const rem = abs % 1440;
//     const h = Math.floor(rem / 60);
//     const mm = rem % 60;
//     return `${sign}${days}d ${h}h ${mm}m`;
//   }
//   if (abs >= 60) {
//     const h = Math.floor(abs / 60);
//     const mm = abs % 60;
//     return `${sign}${h}h ${mm}m`;
//   }
//   return `${sign}${abs} min`;
// }

export default function LogisticsTable() {
  const { data, filters, setFilters } = useDriverKPI();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

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

  // reset page when core filters change so users see first page of new results
  const driverNamesKey = (filters.driverNames || []).join(",");
  useEffect(() => {
    const id = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(id);
  }, [filters.startDate, filters.endDate, driverNamesKey, filters.searchCustomer]);

  const [localSearch, setLocalSearch] = useState<string>(
    filters.searchCustomer ?? "",
  );
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // debounce applying the search to global filters to avoid too many calls
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setFilters({ searchCustomer: localSearch || undefined });
    }, 400);
    return () => window.clearTimeout(debounceRef.current);
  }, [localSearch, setFilters]);

  // deduplicate identical visit records (same DP + timestamps) to avoid repeated rows
  const dedupedData = (() => {
    const seen = new Set<string>();
    const out: typeof data = [];
    for (const r of data || []) {
      const key = `${r.dispatchPlanId ?? ""}|${r.dispatchDocumentNo ?? ""}|${r.estimatedTimeOfDispatch ?? ""}|${r.timeOfDispatch ?? ""}|${r.estimatedTimeOfArrival ?? ""}|${r.returnTimeOfArrival ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(r);
      }
    }
    return out;
  })();

  

  const rows = (dedupedData || []).filter((r) => {
    if (filters.fulfillmentStatus)
      return (
        String(r.fulfillmentStatus).toLowerCase() ===
        String(filters.fulfillmentStatus).toLowerCase()
      );

    const q = (filters.searchCustomer || "").toLowerCase().trim();
    if (q) {
      const hay = [
        r.dispatchDocumentNo,
        r.dispatchPlanId?.toString(),
        r.customerName,
        r.storeName,
        r.customerCode,
        r.brgy,
        r.city,
        r.province,
        r.truckName,
        r.truckPlateNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    }

    return true;
  });

  const sortedRows = useMemo(() => {
    const arr = rows.slice();
    if (!sortKey) return arr;
    arr.sort((a, b) => {
      let va: unknown = undefined;
      let vb: unknown = undefined;
      switch (sortKey) {
        case "dp":
          va = a.dispatchDocumentNo;
          vb = b.dispatchDocumentNo;
          break;
        case "estimatedDispatch":
          va = a.estimatedTimeOfDispatch;
          vb = b.estimatedTimeOfDispatch;
          break;
        case "actualDispatch":
          va = a.timeOfDispatch;
          vb = b.timeOfDispatch;
          break;
        case "dispatchVariance": {
          va = varianceMinutes(a.estimatedTimeOfDispatch, a.timeOfDispatch) ?? (typeof a.dispatchVarianceHours === "number" ? Math.round(a.dispatchVarianceHours * 60) : null);
          vb = varianceMinutes(b.estimatedTimeOfDispatch, b.timeOfDispatch) ?? (typeof b.dispatchVarianceHours === "number" ? Math.round(b.dispatchVarianceHours * 60) : null);
          break;
        }
        case "estimatedArrival":
          va = a.estimatedTimeOfArrival;
          vb = b.estimatedTimeOfArrival;
          break;
        case "actualArrival":
          va = a.returnTimeOfArrival;
          vb = b.returnTimeOfArrival;
          break;
        case "arrivalVariance": {
          va = varianceMinutes(a.estimatedTimeOfArrival, a.returnTimeOfArrival) ?? (typeof a.arrivalVarianceHours === "number" ? Math.round(a.arrivalVarianceHours * 60) : null);
          vb = varianceMinutes(b.estimatedTimeOfArrival, b.returnTimeOfArrival) ?? (typeof b.arrivalVarianceHours === "number" ? Math.round(b.arrivalVarianceHours * 60) : null);
          break;
        }
        default:
          va = undefined;
          vb = undefined;
      }

      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === "asc" ? 1 : -1;
      if (vb == null) return sortDir === "asc" ? -1 : 1;

      // dates
      if (["estimatedDispatch", "actualDispatch", "estimatedArrival", "actualArrival"].includes(sortKey!)) {
        const na = new Date(String(va)).getTime();
        const nb = new Date(String(vb)).getTime();
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return sortDir === "asc" ? 1 : -1;
        if (isNaN(nb)) return sortDir === "asc" ? -1 : 1;
        return sortDir === "asc" ? na - nb : nb - na;
      }

      // numeric or string fallback
      const numA = Number(String(va ?? ""));
      const numB = Number(String(vb ?? ""));
      const bothNumbers = !Number.isNaN(numA) && !Number.isNaN(numB);
      if (bothNumbers) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      const sa = String(va ?? "").toLowerCase();
      const sb = String(vb ?? "").toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  return (
    <Card>
      <CardContent className="p-4 py-0">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-medium">Logistics Performance</h3>
            <span className="text-muted-foreground">Monitors dispatch efficiency by comparing planned vs. actual timelines, highlighting delays and operational performance across all deliveries.</span>
          </div>

          <div className="flex items-center gap-2 ">
            <div className="w-80">
              <input
                placeholder="Search DP No, customer, address, truck..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="h-9 w-full rounded-md border px-3 text-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {rows.length} records
              {/* <span className="mx-2">•</span>
              Last sync: {lastSync ? formatDateTime(lastSync) : "-"} */}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mt-3">
          <div className="bg-background rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm ring-1 ring-border">
                <TableRow className="bg-card">
                  <TableHead className="w-25">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("dp")}>DP No.{sortKey === "dp" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("estimatedDispatch")}>Estimated Dispatch{sortKey === "estimatedDispatch" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("actualDispatch")}>Actual Dispatch{sortKey === "actualDispatch" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("dispatchVariance")}>Dispatch Variance{sortKey === "dispatchVariance" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("estimatedArrival")}>Estimated Arrival{sortKey === "estimatedArrival" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("actualArrival")}>Actual Arrival{sortKey === "actualArrival" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("arrivalVariance")}>Arrival Variance{sortKey === "arrivalVariance" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* client-side pagination */}
                {(() => {
                  const safeLimit = limit > 0 ? limit : 20;
                  const startIndex = (page - 1) * safeLimit;
                  const endIndex = startIndex + safeLimit;
                  const pageRows = sortedRows.slice(startIndex, endIndex);

                  return pageRows.map((r, idx) => {
                    let dispatchVar = varianceMinutes(
                      r.estimatedTimeOfDispatch,
                      r.timeOfDispatch,
                    );
                    // fallback: some upstream responses provide *_VarianceHours as a numeric hours value
                    if (
                      (dispatchVar === null || dispatchVar === undefined) &&
                      typeof r.dispatchVarianceHours === "number"
                    ) {
                      dispatchVar = Math.round(r.dispatchVarianceHours * 60);
                    }
                    const arrivalVar = varianceMinutes(
                      r.estimatedTimeOfArrival,
                      r.returnTimeOfArrival,
                    );
                    let arrivalVarFinal = arrivalVar;
                    // fallback for upstream arrival variance given as hours
                    if (
                      (arrivalVarFinal === null ||
                        arrivalVarFinal === undefined) &&
                      typeof r.arrivalVarianceHours === "number"
                    ) {
                      arrivalVarFinal = Math.round(r.arrivalVarianceHours * 60);
                    }
                    const arrivalBadge =
                      arrivalVarFinal === null || arrivalVarFinal === undefined
                        ? { txt: "-", cls: "" }
                        : arrivalVarFinal > DELAY_THRESHOLDS.CRITICAL_MINUTES
                          ? {
                              txt: formatDurationFromMinutes(arrivalVarFinal),
                              cls: "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-100 px-2 py-0.5 rounded",
                            }
                          : arrivalVarFinal > DELAY_THRESHOLDS.MINOR_MINUTES
                            ? {
                                txt: formatDurationFromMinutes(arrivalVarFinal),
                                cls: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-100 px-2 py-0.5 rounded",
                              }
                            : {
                                txt: formatDurationFromMinutes(arrivalVarFinal),
                                cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-100 px-2 py-0.5 rounded",
                              };

                    return (
                      <TableRow
                        key={`${r.dispatchPlanId}-${startIndex + idx}`}
                        className={`border-t ${
                            String(r.fulfillmentStatus || "")
                              .toLowerCase()
                              .includes("unful") ||
                            String(r.fulfillmentStatus || "")
                              .toLowerCase()
                              .includes("fail") ||
                            String(r.fulfillmentStatus || "")
                              .toLowerCase()
                              .includes("cancel") ||
                            String(r.fulfillmentStatus || "")
                              .toLowerCase()
                              .includes("partial")
                              ? "bg-rose-50 dark:bg-rose-900/20"
                              : ""
                          }`}
                      >
                        <TableCell className="font-mono text-xs py-3">
                          {r.dispatchDocumentNo}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          {formatDateTime(r.estimatedTimeOfDispatch)}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          {formatDateTime(r.timeOfDispatch)}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          {formatDurationFromMinutes(dispatchVar)}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          {formatDateTime(r.estimatedTimeOfArrival)}
                        </TableCell>
                        <TableCell className="text-sm py-3">
                          {formatDateTime(r.returnTimeOfArrival)}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={arrivalBadge.cls}>
                            {arrivalBadge.txt}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* pagination */}
        <div className="mt-3 flex items-center justify-between">
          {(() => {
            const localTotal = rows.length;
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
                  Showing {localTotal === 0 ? 0 : startIndex + 1} - {endIndex}{" "}
                  of {localTotal}
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

                    {totalPages > 5 && (
                      <span className="px-1 text-sm">...</span>
                    )}

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
      </CardContent>
    </Card>
  );
}
