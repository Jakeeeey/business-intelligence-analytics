"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
import { groupByDispatch } from "../utils/calculations";
import { groupSortValue, compareValues, type SortKey } from "../utils/sort";
import { formatDateTime, formatDurationFromMinutes } from "../utils/formatters";

export type LogisticsTableProps = {
  page?: number;
  limit?: number;
  onPageChange?: (p: number) => void;
  onLimitChange?: (n: number) => void;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (key: string) => void;
  sortOrder?: string[] | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export default function LogisticsTable(props: LogisticsTableProps) {
  const { data, filters } = useDriverKPI();
  const rows = useMemo(() => data ?? [], [data]);

  const groups = useMemo(() => groupByDispatch(rows), [rows]);

  const [localPage, setLocalPage] = useState<number>(props.page ?? 1);
  const [localLimit, setLocalLimit] = useState<number>(props.limit ?? 20);
  const page = props.page ?? localPage;
  const limit = props.limit ?? localLimit;

  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<"asc" | "desc">("asc");
  const sortKey = props.sortKey ?? localSortKey;
  const sortDir = props.sortDir ?? localSortDir;

  const [localSearchQuery, setLocalSearchQuery] = useState<string>(
    props.searchQuery ?? filters.searchCustomer ?? "",
  );

  const searchQuery = props.searchQuery ?? localSearchQuery;

  // keep local input in sync when filters change externally (only when uncontrolled)
  useEffect(() => {
    if (typeof props.searchQuery !== "undefined") return;
    const v = filters.searchCustomer ?? "";
    if (v !== localSearchQuery) setLocalSearchQuery(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchCustomer]);

  function toggleSort(key: string) {
    if (props.onToggleSort) {
      props.onToggleSort(key);
      return;
    }
    if (sortKey === key) setLocalSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setLocalSortKey(key);
      setLocalSortDir("asc");
    }
  }

  function changePage(p: number) {
    if (props.onPageChange) props.onPageChange(p);
    else setLocalPage(p);
  }
  function changeLimit(n: number) {
    if (props.onLimitChange) props.onLimitChange(n);
    else {
      setLocalLimit(n);
      setLocalPage(1);
    }
  }

  const sortedGroups = useMemo(() => {
    const arr = groups.slice();
    if (sortKey) {
      arr.sort((a, b) => {
        const va = groupSortValue(a, sortKey as SortKey);
        const vb = groupSortValue(b, sortKey as SortKey);
        return compareValues(va, vb, sortDir ?? "asc");
      });
      return arr;
    }

    if (props.sortOrder && props.sortOrder.length) {
      const index = new Map<string, number>();
      props.sortOrder.forEach((dp, i) => index.set(dp, i));
      arr.sort((a, b) => {
        const ia = index.has(a.dispatchDocumentNo ?? "")
          ? index.get(a.dispatchDocumentNo ?? "")!
          : Number.MAX_SAFE_INTEGER;
        const ib = index.has(b.dispatchDocumentNo ?? "")
          ? index.get(b.dispatchDocumentNo ?? "")!
          : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return (a.dispatchDocumentNo ?? "").localeCompare(
          b.dispatchDocumentNo ?? "",
        );
      });
      return arr;
    }

    return arr;
  }, [groups, sortKey, sortDir, props.sortOrder]);

  const filteredGroups = useMemo(() => {
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return sortedGroups;
    return sortedGroups.filter((g) => {
      if ((g.dispatchDocumentNo ?? "").toLowerCase().includes(q)) return true;
      if ((g.truck ?? "").toLowerCase().includes(q)) return true;
      const customers = g.customers || [];
      for (const c of customers) {
        const hay = [
          c.customerName,
          c.storeName,
          c.customerCode,
          c.invoiceNo,
          c.contactNumber,
          c.brgy,
          c.city,
          c.province,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (hay.includes(q)) return true;
      }
      return false;
    });
  }, [sortedGroups, searchQuery]);

  return (
    <Card>
      <CardContent className="p-6 py-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h3 className="text-lg font-medium">Logistics Performance</h3>
              <span className="text-muted-foreground">
                Monitors dispatch efficiency by comparing planned vs. actual
                timelines, highlighting delays and operational performance
                across all deliveries.
              </span>
            </div>

            <div className="mt-4 mb-2">
              <div className="flex items-center gap-4">
                <div className="w-80">
                  <Input
                    placeholder="Search DP No, customer, address, truck..."
                    value={searchQuery}
                    onChange={(e) =>
                      props.onSearchChange
                        ? props.onSearchChange(e.target.value)
                        : setLocalSearchQuery(e.target.value)
                    }
                    className="h-9 rounded-md"
                  />
                </div>
                <div className="hidden md:block text-sm text-muted-foreground">
                  {filteredGroups.length} records
                </div>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <div className="rounded-full bg-muted/10 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {filteredGroups.length} total records
            </div>
          </div> */}
        </div>

        <div className="overflow-x-auto mt-3">
          <div className="bg-background rounded-md border border-border/50 overflow-hidden">
            <div className="">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/50 border-b">
                  <TableRow className="bg-muted/40 ">
                    <TableHead className="w-25 pl-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 "
                        onClick={() => toggleSort("dp")}
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("estimatedDispatch")}
                      >
                        Estimated Dispatch
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("dispatch")}
                      >
                        Actual Dispatch
                        {sortKey === "dispatch" &&
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("dispatchVariance")}
                      >
                        Dispatch Variance
                        {sortKey === "dispatchVariance" &&
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("estimatedArrival")}
                      >
                        Estimated Arrival
                        {sortKey === "estimatedArrival" &&
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("arrival")}
                      >
                        Actual Arrival
                        {sortKey === "arrival" &&
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
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort("arrivalVariance")}
                      >
                        Arrival Variance
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
                    const localTotal = filteredGroups.length;
                    const startIndex = (page - 1) * safeLimit;
                    const endIndex = Math.min(
                      startIndex + safeLimit,
                      localTotal,
                    );
                    const pageGroups = filteredGroups.slice(
                      startIndex,
                      endIndex,
                    );

                    return pageGroups.map((g, idx) => {
                      // derive display values from group
                      const estDispatchTs = groupSortValue(
                        g,
                        "estimatedDispatch",
                      );
                      const estDispatchStr = estDispatchTs
                        ? new Date(Number(estDispatchTs)).toISOString()
                        : null;
                      const actDispatchStr = g.dispatchTime ?? null;
                      const dispatchVar = groupSortValue(
                        g,
                        "dispatchVariance",
                      ) as number | null;

                      const estArrivalTs = groupSortValue(
                        g,
                        "estimatedArrival",
                      );
                      const estArrivalStr = estArrivalTs
                        ? new Date(Number(estArrivalTs)).toISOString()
                        : null;
                      const actArrivalStr = g.arrivalTime ?? null;
                      const arrivalVarFinal = groupSortValue(
                        g,
                        "arrivalVariance",
                      ) as number | null;

                      const arrivalBadge =
                        arrivalVarFinal === null ||
                        arrivalVarFinal === undefined
                          ? { txt: "-", cls: "" }
                          : arrivalVarFinal > DELAY_THRESHOLDS.CRITICAL_MINUTES
                            ? {
                                txt: formatDurationFromMinutes(arrivalVarFinal),
                                cls: "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-100 px-2 py-0.5 rounded",
                              }
                            : arrivalVarFinal > DELAY_THRESHOLDS.MINOR_MINUTES
                              ? {
                                  txt: formatDurationFromMinutes(
                                    arrivalVarFinal,
                                  ),
                                  cls: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-100 px-2 py-0.5 rounded",
                                }
                              : {
                                  txt: formatDurationFromMinutes(
                                    arrivalVarFinal,
                                  ),
                                  cls: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-100 px-2 py-0.5 rounded",
                                };

                      return (
                        <TableRow
                          key={`${g.dispatchPlanId ?? g.dispatchDocumentNo}-${startIndex + idx}`}
                          className={` border-t  ${g.unfulfilledCount > 0 || (typeof g.fulfillmentPercent === "number" && g.fulfillmentPercent < 100) ? "bg-rose-50 dark:bg-rose-900/20" : ""}`}
                        >
                          <TableCell className="font-mono text-xs pl-4 py-3">
                            {g.dispatchDocumentNo}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            {estDispatchStr
                              ? formatDateTime(estDispatchStr)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            {formatDateTime(actDispatchStr)}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            {formatDurationFromMinutes(dispatchVar)}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            {estArrivalStr
                              ? formatDateTime(estArrivalStr)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            {formatDateTime(actArrivalStr)}
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
        </div>
        {/* pagination */}
        <div className="mt-3 flex items-center justify-between">
          {(() => {
            const localTotal = filteredGroups.length;
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
                      changeLimit(n);
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
                      onClick={() => changePage(Math.max(1, page - 1))}
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
                          onClick={() => changePage(pageNum)}
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
                      onClick={() => changePage(Math.min(totalPages, page + 1))}
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
