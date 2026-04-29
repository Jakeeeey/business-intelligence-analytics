"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { ChevronRight, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupByDispatch } from "../utils/calculations";
import { groupSortValue, compareValues, type SortKey } from "../utils/sort";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import type { VisitRecord } from "../types";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
type FulfillmentStatus = "fulfilled" | "fulfilled_with_returns" | "unfulfilled";

function normalizeFulfillmentStatus(raw: unknown): FulfillmentStatus {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (s === "fulfilled with returns") return "fulfilled_with_returns";
  if (s === "fulfilled") return "fulfilled";
  return "unfulfilled";
}

/** Returns true for statuses that count toward fulfillment (fulfilled + fulfilled_with_returns) */
function isFulfilled(status: FulfillmentStatus) {
  return status === "fulfilled" || status === "fulfilled_with_returns";
}

type FulfillmentTableProps = {
  page?: number;
  limit?: number;
  onPageChange?: (p: number) => void;
  onLimitChange?: (n: number) => void;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onToggleSort?: (k: string) => void;
  sortOrder?: string[] | null;
  expanded?: Record<string, boolean> | null;
  onToggleExpanded?: (dp: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export default function FulfillmentTable(props: FulfillmentTableProps) {
  const { data, filters } = useDriverKPI();
  const rows = useMemo(() => data ?? [], [data]);
  const groups = useMemo(() => groupByDispatch(rows), [rows]);

  // precompute sorted customers per group
  const groupCustomersSorted = useMemo(() => {
    const map = new Map<string, VisitRecord[]>();
    for (const g of groups) {
      const key = String(g.dispatchDocumentNo ?? "");
      const sorted = (g.customers || [])
        .slice()
        .sort(
          (a: VisitRecord, b: VisitRecord) =>
            (a.visitSequence ?? 0) - (b.visitSequence ?? 0),
        );
      map.set(key, sorted as VisitRecord[]);
    }
    return map;
  }, [groups]);

  // rendering-ready map: delay heavy inner render to avoid layout jank when expanding
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const rafRef = useRef<Record<string, number[]>>(
    {} as Record<string, number[]>,
  );

  // local expansion state for uncontrolled mode
  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const openObj = props.expanded ?? localExpanded;
    const openKeys = Object.keys(openObj || {}).filter((k) => openObj[k]);

    for (const dp of openKeys) {
      if (readyMap[dp]) continue;
      if (rafRef.current[dp]) continue;

      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => {
          setReadyMap((prev) => {
            if (prev[dp]) return prev;
            return { ...prev, [dp]: true };
          });
          delete rafRef.current[dp];
        });
        rafRef.current[dp] = [...(rafRef.current[dp] || []), id2];
      });
      rafRef.current[dp] = [...(rafRef.current[dp] || []), id1];
    }

    for (const k of Object.keys(readyMap)) {
      if (!openKeys.includes(k)) {
        const ids = rafRef.current[k] || [];
        ids.forEach((i) => cancelAnimationFrame(i));
        delete rafRef.current[k];
        setReadyMap((prev) => {
          const copy = { ...prev };
          delete copy[k];
          return copy;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.expanded, localExpanded]);

  const [localSearchQuery, setLocalSearchQuery] = useState<string>(
    props.searchQuery ?? filters.searchCustomer ?? "",
  );

  const searchQuery = props.searchQuery ?? localSearchQuery;

  React.useEffect(() => {
    if (typeof props.searchQuery !== "undefined") return;
    const v = filters.searchCustomer ?? "";
    if (v !== localSearchQuery) setLocalSearchQuery(v);
  }, [filters.searchCustomer, localSearchQuery, props.searchQuery]);

  const [localPage, setLocalPage] = useState<number>(props.page ?? 1);
  const [localLimit, setLocalLimit] = useState<number>(props.limit ?? 20);
  const page = props.page ?? localPage;
  const limit = props.limit ?? localLimit;

  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<"asc" | "desc">("asc");
  const sortKey = props.sortKey ?? localSortKey;
  const sortDir = props.sortDir ?? localSortDir;

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

  const DEFAULT_EXPANDED_LIMIT = 10;
  const [expandedPages, setExpandedPages] = useState<Record<string, number>>(
    {},
  );
  const [expandedLimits, setExpandedLimits] = useState<Record<string, number>>(
    {},
  );

  function changeExpandedPage(dp: string, p: number) {
    setExpandedPages((s) => ({ ...s, [dp]: p }));
  }

  function changeExpandedLimit(dp: string, n: number) {
    setExpandedLimits((s) => ({ ...s, [dp]: n }));
    setExpandedPages((s) => ({ ...s, [dp]: 1 }));
  }

  function handleToggleExpanded(dp: string) {
    const isOpen = !!(props.expanded ?? localExpanded)[dp];
    const willOpen = !isOpen;

    if (willOpen) {
      setExpandedPages((s) => ({ ...(s || {}), [dp]: 1 }));
      setExpandedLimits((s) => ({
        ...(s || {}),
        [dp]: DEFAULT_EXPANDED_LIMIT,
      }));
    } else {
      setExpandedPages((s) => {
        const copy = { ...(s || {}) };
        delete copy[dp];
        return copy;
      });
      setExpandedLimits((s) => {
        const copy = { ...(s || {}) };
        delete copy[dp];
        return copy;
      });
    }

    if (props.onToggleExpanded) props.onToggleExpanded(dp);
    else setLocalExpanded((s) => ({ ...s, [dp]: !s[dp] }));
  }

  React.useEffect(() => {
    if (!props.expanded) return;
    const keys = Object.keys(props.expanded || {});
    setExpandedPages((prev) => {
      const next = { ...(prev || {}) };
      for (const k of keys) {
        if (props.expanded && props.expanded[k]) {
          if (!next[k]) next[k] = 1;
        } else {
          if (next[k] !== undefined) delete next[k];
        }
      }
      return next;
    });
    setExpandedLimits((prev) => {
      const next = { ...(prev || {}) };
      for (const k of keys) {
        if (props.expanded && props.expanded[k]) {
          if (!next[k]) next[k] = DEFAULT_EXPANDED_LIMIT;
        } else {
          if (next[k] !== undefined) delete next[k];
        }
      }
      return next;
    });
  }, [props.expanded]);

  // ---------------------------------------------------------------------------
  // Derived: are ALL currently-visible groups expanded?
  // ---------------------------------------------------------------------------
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

  // page groups visible right now (used to determine expand-all state)
  const safeLimit = limit > 0 ? limit : 20;
  const startIndex = (page - 1) * safeLimit;
  const endIndex = Math.min(startIndex + safeLimit, filteredGroups.length);
  const pageGroups = filteredGroups.slice(startIndex, endIndex);

  const expandedState = props.expanded ?? localExpanded;
  const allExpanded =
    pageGroups.length > 0 &&
    pageGroups.every((g) => !!expandedState[g.dispatchDocumentNo]);
  const anyExpanded =
    pageGroups.length > 0 &&
    pageGroups.some((g) => !!expandedState[g.dispatchDocumentNo]);
  function toggleExpandAll() {
    if (anyExpanded) {
      // collapse all open keys
      const openKeys = props.expanded
        ? Object.keys(props.expanded).filter(
            (k) => props.expanded && props.expanded[k],
          )
        : Object.keys(localExpanded).filter((k) => localExpanded[k]);

      if (props.onToggleExpanded) {
        openKeys.forEach(
          (k) => props.onToggleExpanded && props.onToggleExpanded(k),
        );
      } else {
        setLocalExpanded({});
      }
      setExpandedPages({});
      setExpandedLimits({});
    } else {
      // expand all page groups
      pageGroups.forEach((g) => {
        const dp = g.dispatchDocumentNo;
        if (!expandedState[dp]) {
          setExpandedPages((s) => ({ ...s, [dp]: 1 }));
          setExpandedLimits((s) => ({ ...s, [dp]: DEFAULT_EXPANDED_LIMIT }));
          if (props.onToggleExpanded) props.onToggleExpanded(dp);
          else setLocalExpanded((s) => ({ ...s, [dp]: true }));
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination helper: generate page number buttons with ellipsis
  // ---------------------------------------------------------------------------
  function getPaginationPages(
    current: number,
    total: number,
  ): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = current - delta;
    const right = current + delta;

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) {
      pages.push(i);
    }
    if (right < total - 1) pages.push("...");
    pages.push(total);

    return pages;
  }

  // ---------------------------------------------------------------------------
  // Group-level row background: any unfulfilled customer → red; any fulfilled_with_returns → orange; else default
  // ---------------------------------------------------------------------------
  function groupRowClass(g: ReturnType<typeof groupByDispatch>[number]) {
    const customers = g.customers || [];
    const statuses = customers.map((c: VisitRecord) =>
      normalizeFulfillmentStatus(c.fulfillmentStatus),
    );
    const hasUnfulfilled = statuses.some(
      (s: FulfillmentStatus) => s === "unfulfilled",
    );
    const hasReturns = statuses.some(
      (s: FulfillmentStatus) => s === "fulfilled_with_returns",
    );
    if (hasUnfulfilled) return "bg-rose-50 dark:bg-rose-900/20";
    if (hasReturns) return "";
    return "";
  }

  // ---------------------------------------------------------------------------
  // Recalculate fulfilled/unfulfilled counts and percent treating FWR as fulfilled
  // ---------------------------------------------------------------------------
  function groupMetrics(g: ReturnType<typeof groupByDispatch>[number]) {
    const customers = g.customers || [];
    let fulfilledCount = 0;
    let unfulfilledCount = 0;
    let fulfilledAmount = 0;
    let unfulfilledAmount = 0;

    for (const c of customers as VisitRecord[]) {
      const status = normalizeFulfillmentStatus(c.fulfillmentStatus);
      const amount =
        typeof c.totalAmount === "number"
          ? c.totalAmount
          : Number(c.totalAmount ?? 0);
      if (isFulfilled(status)) {
        fulfilledCount++;
        fulfilledAmount += amount;
      } else {
        unfulfilledCount++;
        unfulfilledAmount += amount;
      }
    }

    const total = fulfilledCount + unfulfilledCount;
    const fulfillmentPercent =
      total > 0 ? Math.round((fulfilledCount / total) * 100) : 0;

    return {
      fulfilledCount,
      unfulfilledCount,
      fulfilledAmount,
      unfulfilledAmount,
      fulfillmentPercent,
      totalCustomers: total,
    };
  }

  return (
    <Card>
      <CardContent className="p-6 py-0 ">
        <div className="flex items-start justify-between pb-4 gap-4">
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h3 className="text-lg font-medium">Fulfillment Performance</h3>
              <span className="text-muted-foreground">
                Tracks delivery success rates and revenue realization per
                dispatch, highlighting fulfillment efficiency and service gaps
                across operations.
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={toggleExpandAll}
              aria-label={allExpanded ? "Collapse all rows" : "Expand all rows"}
            >
              {anyExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        </div>

        <div className="bg-background rounded-md border border-border/50 overflow-hidden">
          <div className="">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/50 border-b">
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10" />
                  <TableHead className="w-25">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
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
                      onClick={() => toggleSort("dispatch")}
                    >
                      Dispatch
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
                      onClick={() => toggleSort("arrival")}
                    >
                      Arrival
                      {sortKey === "arrival" &&
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
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("customers")}
                    >
                      Customers
                      {sortKey === "customers" &&
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
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("fulfilled")}
                    >
                      Fulfilled
                      {sortKey === "fulfilled" &&
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
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("unfulfilled")}
                    >
                      Unfulfilled
                      {sortKey === "unfulfilled" &&
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
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("performance")}
                    >
                      Performance Rate
                      {sortKey === "performance" &&
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
                      onClick={() => toggleSort("fulfilledAmount")}
                    >
                      Fulfilled Amount
                      {sortKey === "fulfilledAmount" &&
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
                      onClick={() => toggleSort("unfulfilledAmount")}
                    >
                      Unfulfilled Amount
                      {sortKey === "unfulfilledAmount" &&
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
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("truck")}
                    >
                      Truck
                      {sortKey === "truck" &&
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
                {pageGroups.map((g) => {
                  const metrics = groupMetrics(g);
                  const rowCls = groupRowClass(g);

                  return (
                    <React.Fragment key={g.dispatchDocumentNo}>
                      <TableRow
                        className={`border-t hover:bg-muted/50 cursor-pointer ${rowCls}`}
                        onClick={() =>
                          handleToggleExpanded(g.dispatchDocumentNo)
                        }
                      >
                        <TableCell className="w-8 px-2 py-3">
                          <button
                            type="button"
                            aria-label={
                              (props.expanded ?? localExpanded)[
                                g.dispatchDocumentNo
                              ]
                                ? "Collapse row"
                                : "Expand row"
                            }
                            aria-expanded={
                              !!(props.expanded ?? localExpanded)[
                                g.dispatchDocumentNo
                              ]
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpanded(g.dispatchDocumentNo);
                            }}
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/5"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${(props.expanded ?? localExpanded)[g.dispatchDocumentNo] ? "rotate-90" : "rotate-0"}`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs py-3">
                          {g.dispatchDocumentNo}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatDateTime(g.dispatchTime)}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatDateTime(g.arrivalTime)}
                        </TableCell>
                        <TableCell className="py-3">
                          {metrics.totalCustomers}
                        </TableCell>
                        <TableCell className="py-3">
                          {metrics.fulfilledCount}
                        </TableCell>
                        <TableCell className="py-3">
                          {metrics.unfulfilledCount}
                        </TableCell>
                        <TableCell className="py-3">
                          {metrics.fulfillmentPercent}%
                        </TableCell>
                        <TableCell className="py-3">
                          {formatCurrency(metrics.fulfilledAmount)}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatCurrency(metrics.unfulfilledAmount)}
                        </TableCell>
                        <TableCell className="py-3">{g.truck}</TableCell>
                      </TableRow>

                      {(props.expanded ?? localExpanded)[
                        g.dispatchDocumentNo
                      ] && (
                        <TableRow>
                          <TableCell colSpan={11} className="bg-muted/30">
                            <div className="p-2">
                              <div className="bg-background rounded-md border border-border/50 overflow-hidden">
                                {(() => {
                                  const dp = String(g.dispatchDocumentNo ?? "");
                                  const sorted =
                                    groupCustomersSorted.get(dp) ?? [];
                                  const total = sorted.length;
                                  const expLimit =
                                    expandedLimits[dp] ??
                                    DEFAULT_EXPANDED_LIMIT;
                                  const usePagination =
                                    total > DEFAULT_EXPANDED_LIMIT;
                                  const effectiveLimit = usePagination
                                    ? expLimit
                                    : Math.max(total, 1);
                                  const totalPages = Math.max(
                                    1,
                                    Math.ceil(total / effectiveLimit),
                                  );
                                  const expPageRaw = expandedPages[dp] ?? 1;
                                  const expPage = usePagination
                                    ? Math.min(
                                        Math.max(1, expPageRaw),
                                        totalPages,
                                      )
                                    : 1;
                                  const startIdx =
                                    (expPage - 1) * effectiveLimit;
                                  const endIdx = Math.min(
                                    startIdx + effectiveLimit,
                                    total,
                                  );
                                  const pageCustomers = sorted.slice(
                                    startIdx,
                                    endIdx,
                                  );

                                  if (!readyMap[dp]) {
                                    return (
                                      <>
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-muted/40 border-b">
                                              <TableHead>No.</TableHead>
                                              <TableHead>Customer</TableHead>
                                              <TableHead>Address</TableHead>
                                              <TableHead>Status</TableHead>
                                              <TableHead>Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                        </Table>
                                        <div className="py-6 flex items-center justify-center">
                                          <Spinner />
                                        </div>
                                      </>
                                    );
                                  }

                                  return (
                                    <>
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/40 border-b">
                                            <TableHead>No.</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Amount</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {pageCustomers.map((c, i) => {
                                            const status =
                                              normalizeFulfillmentStatus(
                                                c.fulfillmentStatus,
                                              );
                                            const customerRowCls =
                                              status === "unfulfilled"
                                                ? "bg-rose-50 dark:bg-rose-900/20"
                                                : status ===
                                                    "fulfilled_with_returns"
                                                  ? "bg-orange-50 dark:bg-orange-900/20"
                                                  : "bg-emerald-50/40 dark:bg-emerald-900/10";

                                            const badgeCls =
                                              status === "fulfilled"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                                                : status ===
                                                    "fulfilled_with_returns"
                                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-100"
                                                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100 uppercase";

                                            return (
                                              <TableRow
                                                key={`${dp}-${startIdx + i}`}
                                                className={`border-t ${customerRowCls}`}
                                              >
                                                <TableCell className="py-2">
                                                  {c.visitSequence}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                  {c.customerName}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                  {[c.brgy, c.city, c.province]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeCls}`}
                                                  >
                                                    {c.fulfillmentStatus}
                                                  </span>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                  {formatCurrency(
                                                    c.totalAmount,
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>

                                      {usePagination && (
                                        <div className="border-t px-3 py-2">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm text-muted-foreground">
                                                Items per page
                                              </span>
                                              <Select
                                                value={String(expLimit)}
                                                onValueChange={(v) =>
                                                  changeExpandedLimit(
                                                    dp,
                                                    Number(v),
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="w-20 h-8">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectGroup>
                                                    {[5, 10, 20].map((n) => (
                                                      <SelectItem
                                                        key={n}
                                                        value={String(n)}
                                                      >
                                                        {n}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectGroup>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                              Showing{" "}
                                              {total === 0 ? 0 : startIdx + 1} -{" "}
                                              {endIdx} of {total}
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  changeExpandedPage(
                                                    dp,
                                                    Math.max(1, expPage - 1),
                                                  )
                                                }
                                                disabled={expPage <= 1}
                                              >
                                                Previous
                                              </Button>
                                              {getPaginationPages(
                                                expPage,
                                                totalPages,
                                              ).map((p, idx) =>
                                                p === "..." ? (
                                                  <span
                                                    key={`ellipsis-${idx}`}
                                                    className="px-1 text-sm text-muted-foreground"
                                                  >
                                                    …
                                                  </span>
                                                ) : (
                                                  <Button
                                                    key={p}
                                                    variant={
                                                      expPage === p
                                                        ? "default"
                                                        : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                      changeExpandedPage(
                                                        dp,
                                                        p as number,
                                                      )
                                                    }
                                                  >
                                                    {p}
                                                  </Button>
                                                ),
                                              )}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  changeExpandedPage(
                                                    dp,
                                                    Math.min(
                                                      totalPages,
                                                      expPage + 1,
                                                    ),
                                                  )
                                                }
                                                disabled={expPage >= totalPages}
                                              >
                                                Next
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Outer pagination */}
        <div className="mt-3 flex items-center justify-between">
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
            {(() => {
              const localTotal = filteredGroups.length;
              const sl = limit > 0 ? limit : 20;
              const si = (page - 1) * sl;
              const ei = Math.min(si + sl, localTotal);
              return (
                <span>
                  Showing {localTotal === 0 ? 0 : si + 1} - {ei} of {localTotal}
                </span>
              );
            })()}
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

              {(() => {
                const localTotal = filteredGroups.length;
                const sl = limit > 0 ? limit : 20;
                const totalPages = Math.max(1, Math.ceil(localTotal / sl));
                return getPaginationPages(page, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => changePage(p as number)}
                    >
                      {p}
                    </Button>
                  ),
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  changePage(
                    Math.min(
                      Math.max(
                        1,
                        Math.ceil(
                          filteredGroups.length / (limit > 0 ? limit : 20),
                        ),
                      ),
                      page + 1,
                    ),
                  )
                }
                disabled={
                  page >=
                  Math.max(
                    1,
                    Math.ceil(filteredGroups.length / (limit > 0 ? limit : 20)),
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
