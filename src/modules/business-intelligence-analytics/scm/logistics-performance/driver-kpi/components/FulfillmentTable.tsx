"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { ChevronRight, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupByDispatch } from "../utils/calculations";
import { formatCurrency, formatDateTime } from "../utils/formatters";

export default function FulfillmentTable() {
  const { data, filters, setFilters } = useDriverKPI();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const [localSearch, setLocalSearch] = useState<string>(
    filters.searchCustomer ?? "",
  );
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setFilters({ searchCustomer: localSearch || undefined });
    }, 400);
    return () => window.clearTimeout(debounceRef.current);
  }, [localSearch, setFilters]);

  const driverNamesKey = (filters.driverNames || []).join(",");
  useEffect(() => {
    const id = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(id);
  }, [filters.startDate, filters.endDate, driverNamesKey, filters.searchCustomer]);

  const groups = groupByDispatch(data || []).filter((g) => {
    const q = (filters.searchCustomer || "").toLowerCase().trim();
    if (!q) return true;

    const dispatchMatch =
      String(g.dispatchDocumentNo || "")
        .toLowerCase()
        .includes(q) ||
      String(g.truck || "")
        .toLowerCase()
        .includes(q);
    if (dispatchMatch) return true;

    return g.customers.some((c) => {
      const hay = [
        c.customerName,
        c.storeName,
        c.customerCode,
        c.brgy,
        c.city,
        c.province,
        c.contactNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  });

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

  const sortedGroups = useMemo(() => {
    const arr = groups.slice();
    if (!sortKey) return arr;
    arr.sort((a, b) => {
      let va: unknown = undefined;
      let vb: unknown = undefined;
      switch (sortKey) {
        case "dp":
          va = a.dispatchDocumentNo;
          vb = b.dispatchDocumentNo;
          break;
        case "dispatch":
          va = a.dispatchTime;
          vb = b.dispatchTime;
          break;
        case "arrival":
          va = a.arrivalTime;
          vb = b.arrivalTime;
          break;
        case "customers":
          va = a.totalCustomers;
          vb = b.totalCustomers;
          break;
        case "fulfilled":
          va = a.fulfilledCount;
          vb = b.fulfilledCount;
          break;
        case "unfulfilled":
          va = a.unfulfilledCount;
          vb = b.unfulfilledCount;
          break;
        case "performance":
          va = a.fulfillmentPercent;
          vb = b.fulfillmentPercent;
          break;
        case "fulfilledAmount":
          va = a.fulfilledAmount;
          vb = b.fulfilledAmount;
          break;
        case "unfulfilledAmount":
          va = a.unfulfilledAmount;
          vb = b.unfulfilledAmount;
          break;
        case "truck":
          va = a.truck;
          vb = b.truck;
          break;
        default:
          va = undefined;
          vb = undefined;
      }

      // normalize null/undefined
      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === "asc" ? 1 : -1;
      if (vb == null) return sortDir === "asc" ? -1 : 1;

      // dates
      if (sortKey === "dispatch" || sortKey === "arrival") {
        const na = new Date(String(va)).getTime();
        const nb = new Date(String(vb)).getTime();
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return sortDir === "asc" ? 1 : -1;
        if (isNaN(nb)) return sortDir === "asc" ? -1 : 1;
        return sortDir === "asc" ? na - nb : nb - na;
      }

      // numeric
      if (
        [
          "customers",
          "fulfilled",
          "unfulfilled",
          "performance",
          "fulfilledAmount",
          "unfulfilledAmount",
        ].includes(sortKey)
      ) {
        const na = Number(va as unknown as number ?? 0);
        const nb = Number(vb as unknown as number ?? 0);
        return sortDir === "asc" ? na - nb : nb - na;
      }

      // string fallback
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return arr;
  }, [groups, sortKey, sortDir]);

  return (
    <Card>
      <CardContent className="p-6 py-0 ">
        <div className="flex items-center justify-between pb-4 ">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-medium ">Fulfillment Performance</h3>
              <span className="text-muted-foreground">
                Tracks delivery success rates and revenue realization per
                dispatch, highlighting fulfillment efficiency and service gaps
                across operations.
              </span>
            </div>

            <div className="flex items-center  gap-2">
              <div className="w-80">
                <input
                  placeholder="Search DP No, customer, address, truck..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="h-9 w-full rounded-md border px-3 text-sm"
                />
              </div>
              <div className="text-sm text-muted-foreground ">
                {groups.length} records
              </div>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/50 border-b">
              <TableRow className="bg-muted/40">
                <TableHead className="w-10"/>
                <TableHead className="w-25">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort("dp")}
                  >
                    DP No.
                    {sortKey === "dp" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}
                  </button>
                </TableHead>
                <TableHead className="w-45">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("dispatch")}>Dispatch{sortKey === "dispatch" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-45">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("arrival")}>Arrival{sortKey === "arrival" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-30">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("customers")}>Customers{sortKey === "customers" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-30">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("fulfilled")}>Fulfilled{sortKey === "fulfilled" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-30">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("unfulfilled")}>Unfulfilled{sortKey === "unfulfilled" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-40">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("performance")}>Performance Rate{sortKey === "performance" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-45">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("fulfilledAmount")}>Fulfilled Amount{sortKey === "fulfilledAmount" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
               <TableHead className="w-45">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("unfulfilledAmount")}>Unfulfilled Amount{sortKey === "unfulfilledAmount" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
                <TableHead className="w-30">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("truck")}>Truck{sortKey === "truck" && (sortDir === "asc" ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />)}</button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const localTotal = sortedGroups.length;
                const safeLimit = limit > 0 ? limit : 20;
                const startIndex = (page - 1) * safeLimit;
                const endIndex = Math.min(startIndex + safeLimit, localTotal);
                const pageGroups = sortedGroups.slice(startIndex, endIndex);

                return pageGroups.map((g) => (
                  <React.Fragment key={g.dispatchDocumentNo}>
                    <TableRow
                      className={`border-t hover:bg-muted/50 cursor-pointer ${g.unfulfilledCount > 0 || (typeof g.fulfillmentPercent === "number" && g.fulfillmentPercent < 100) ? "bg-rose-50 dark:bg-rose-900/20" : ""}`}
                      onClick={() =>
                        setExpanded((s) => ({
                          ...s,
                          [g.dispatchDocumentNo]: !s[g.dispatchDocumentNo],
                        }))
                      }
                    >
                      <TableCell className="w-8 px-2 py-3">
                        <button
                          type="button"
                          aria-label={expanded[g.dispatchDocumentNo] ? "Collapse row" : "Expand row"}
                          aria-expanded={!!expanded[g.dispatchDocumentNo]}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((s) => ({
                              ...s,
                              [g.dispatchDocumentNo]: !s[g.dispatchDocumentNo],
                            }));
                          }}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-muted/5"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expanded[g.dispatchDocumentNo] ? "rotate-90" : "rotate-0"}`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs py-3">
                        {g.dispatchDocumentNo}
                      </TableCell>
                      <TableCell className="py-3">{formatDateTime(g.dispatchTime)}</TableCell>
                      <TableCell className="py-3">{formatDateTime(g.arrivalTime)}</TableCell>
                      <TableCell className="py-3">{g.totalCustomers}</TableCell>
                      <TableCell className="py-3">{g.fulfilledCount}</TableCell>
                      <TableCell className="py-3">{g.unfulfilledCount}</TableCell>
                      <TableCell className="py-3">{g.fulfillmentPercent}%</TableCell>
                      <TableCell className="py-3">{formatCurrency(g.fulfilledAmount)}</TableCell>
                      <TableCell className="py-3">{formatCurrency(g.unfulfilledAmount)}</TableCell>
                      <TableCell className="py-3">{g.truck}</TableCell>
                    </TableRow>

                    {expanded[g.dispatchDocumentNo] && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-muted/30">
                          <div className="p-2">
                            <div className="bg-background rounded-md border border-border/50 overflow-hidden">
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
                                  {g.customers
                                    .sort((a, b) => (a.visitSequence ?? 0) - (b.visitSequence ?? 0))
                                    .map((c, i) => (
                                      <TableRow
                                        key={i}
                                        className={`border-t ${String(c.fulfillmentStatus).toLowerCase() !== "fulfilled" ? "bg-rose-50 dark:bg-rose-900/20" : ""}`}
                                      >
                                        <TableCell className="py-2">{c.visitSequence}</TableCell>
                                        <TableCell className="py-2">{c.customerName}</TableCell>
                                        <TableCell className="py-2">{[c.brgy, c.city, c.province].filter(Boolean).join(", ")}</TableCell>
                                        <TableCell className="py-2">
                                          <span className={`px-2 py-1 rounded-full text-xs ${String(c.fulfillmentStatus).toLowerCase() === "fulfilled" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100"}`}>
                                            {c.fulfillmentStatus}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-2">{formatCurrency(c.totalAmount)}</TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
        {/* pagination */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page</span>
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
            {(() => {
              const localTotal = groups.length;
              const safeLimit = limit > 0 ? limit : 20;
              const startIndex = (page - 1) * safeLimit;
              const endIndex = Math.min(startIndex + safeLimit, localTotal);
              return (
                <span>
                  Showing {localTotal === 0 ? 0 : startIndex + 1} - {endIndex} of {localTotal}
                </span>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                Previous
              </Button>

              {(() => {
                const localTotal = groups.length;
                const safeLimit = limit > 0 ? limit : 20;
                const totalPages = Math.max(1, Math.ceil(localTotal / safeLimit));
                return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  return (
                    <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </Button>
                  );
                });
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage(Math.min(Math.max(1, Math.ceil(groups.length / (limit > 0 ? limit : 20))), page + 1))
                }
                disabled={page >= Math.max(1, Math.ceil(groups.length / (limit > 0 ? limit : 20)))}
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
