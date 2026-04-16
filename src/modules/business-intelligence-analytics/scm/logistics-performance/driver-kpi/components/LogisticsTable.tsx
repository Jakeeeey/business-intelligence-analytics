"use client";

import React, { useMemo } from "react";
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
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
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

export default function LogisticsTable({
  page,
  limit,
  sortKey,
  sortDir,
  onToggleSort,
  sortOrder,
}: {
  page: number;
  limit: number;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  sortOrder?: string[] | null;
}) {
  const { data, filters } = useDriverKPI();

  // reset page when core filters change so users see first page of new results

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
    // If parent provided a canonical sort order for dispatch documents,
    // apply that ordering first so both tables remain in sync.
    if (sortOrder && sortOrder.length > 0) {
      const idx = new Map<string, number>();
      sortOrder.forEach((dp, i) => idx.set(dp, i));
      arr.sort((a, b) => {
        const ia = idx.has(a.dispatchDocumentNo ?? "")
          ? idx.get(a.dispatchDocumentNo ?? "")!
          : Number.MAX_SAFE_INTEGER;
        const ib = idx.has(b.dispatchDocumentNo ?? "")
          ? idx.get(b.dispatchDocumentNo ?? "")!
          : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return 0;
      });
      return arr;
    }

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
          va =
            varianceMinutes(a.estimatedTimeOfDispatch, a.timeOfDispatch) ??
            (typeof a.dispatchVarianceHours === "number"
              ? Math.round(a.dispatchVarianceHours * 60)
              : null);
          vb =
            varianceMinutes(b.estimatedTimeOfDispatch, b.timeOfDispatch) ??
            (typeof b.dispatchVarianceHours === "number"
              ? Math.round(b.dispatchVarianceHours * 60)
              : null);
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
          va =
            varianceMinutes(a.estimatedTimeOfArrival, a.returnTimeOfArrival) ??
            (typeof a.arrivalVarianceHours === "number"
              ? Math.round(a.arrivalVarianceHours * 60)
              : null);
          vb =
            varianceMinutes(b.estimatedTimeOfArrival, b.returnTimeOfArrival) ??
            (typeof b.arrivalVarianceHours === "number"
              ? Math.round(b.arrivalVarianceHours * 60)
              : null);
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
      if (
        [
          "estimatedDispatch",
          "actualDispatch",
          "estimatedArrival",
          "actualArrival",
        ].includes(sortKey!)
      ) {
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
  }, [rows, sortKey, sortDir, sortOrder]);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-4 py-0">
        <div className="flex items-center justify-between pb-4 ">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-medium">Logistics Performance</h3>
              <span className="text-muted-foreground">
                Monitors dispatch efficiency by comparing planned vs. actual
                timelines, highlighting delays and operational performance
                across all deliveries.
              </span>
            </div>

            {/* <div className="flex items-center gap-2 ">
              <div className="text-sm text-muted-foreground">
                {rows.length} records
              </div>
            </div> */}
          </div>
        </div>
        <div className="overflow-x-auto mt-3">
          <div className="bg-background rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm ring-1 ring-border">
                <TableRow className="bg-muted/40 h-10">
                  <TableHead className="w-25">
                    <button
                      type="button"
                      title="Dispatch Plan Number"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("dp")}
                    >
                      DP No.
                      {sortKey === "dp" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button
                      type="button"
                      title="Estimated Dispatch Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("estimatedDispatch")}
                    >
                      Est Disp
                      {sortKey === "estimatedDispatch" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-45">
                    <button
                      type="button"
                      title="Actual Dispatch Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("actualDispatch")}
                    >
                      Act Disp
                      {sortKey === "actualDispatch" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-30">
                    <button
                      type="button"
                      title="Dispatch Variance"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("dispatchVariance")}
                    >
                      Disp Var
                      {sortKey === "dispatchVariance" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-40">
                    <button
                      type="button"
                      title="Estimated Arrival Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("estimatedArrival")}
                    >
                      Est Arr
                      {sortKey === "estimatedArrival" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-40">
                    <button
                      type="button"
                      title="Actual Arrival Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("actualArrival")}
                    >
                      Act Arr
                      {sortKey === "actualArrival" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  <TableHead className="w-35">
                    <button
                      type="button"
                      title="Arrival Variance"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("arrivalVariance")}
                    >
                      Arr Var
                      {sortKey === "arrivalVariance" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
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
                        className={`border-t h-12.5 ${
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
      </CardContent>
    </Card>
  );
}
