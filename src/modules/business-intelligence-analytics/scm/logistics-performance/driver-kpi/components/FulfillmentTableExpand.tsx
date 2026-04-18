"use client";

import React, { useState, useMemo } from "react";
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
import { ChevronRight, ChevronUpIcon, ChevronDownIcon } from "lucide-react";

import { groupByDispatch } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";
import type { VisitRecord } from "../types";

export default function FulfillmentTable({
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // const [selectedDispatch, setSelectedDispatch] = useState<string | null>(null);

  // Memoized subcomponent to render customers table for an expanded group.
  const CustomersTable = React.useMemo(() => {
    return React.memo(function CustomersTable({
      customers,
    }: {
      customers: VisitRecord[];
    }) {
      const rows = useMemo(
        () =>
          (customers || [])
            .slice()
            .sort((a, b) => (a.visitSequence ?? 0) - (b.visitSequence ?? 0)),
        [customers],
      );
      return (
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
                {rows.map((c, i) => (
                  <TableRow
                    key={i}
                    className={`border-t ${String(c.fulfillmentStatus).toLowerCase() !== "fulfilled" ? "bg-rose-50 dark:bg-rose-900/20" : ""}`}
                  >
                    <TableCell className="py-2">{c.visitSequence}</TableCell>
                    <TableCell className="py-2">{c.customerName}</TableCell>
                    <TableCell className="py-2">
                      {[c.brgy, c.city, c.province].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${String(c.fulfillmentStatus).toLowerCase() === "fulfilled" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100"}`}
                      >
                        {c.fulfillmentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      {formatCurrency(c.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    });
  }, []);
  // Memoize grouping + client-side search so we don't recompute on every render
  const groups = useMemo(() => {
    const q = (filters.searchCustomer || "").toLowerCase().trim();
    const all = groupByDispatch(data || []);
    if (!q) return all;
    return all.filter((g) => {
      const dispatchMatch =
        String(g.dispatchDocumentNo ?? "")
          .toLowerCase()
          .includes(q) ||
        String(g.truck ?? "")
          .toLowerCase()
          .includes(q);
      if (dispatchMatch) return true;
      return (g.customers || []).some((c) => {
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
  }, [data, filters.searchCustomer]);

  const sortedGroups = useMemo(() => {
    const arr = groups.slice();
    // If parent provided a canonical sort order, use it to order groups so
    // both tables stay in sync.
    if ((sortOrder as string[] | null) && (sortOrder as string[]).length > 0) {
      const idx = new Map<string, number>();
      (sortOrder as string[]).forEach((dp, i) => idx.set(dp, i));
      arr.sort((a, b) => {
        const ia = idx.has(a.dispatchDocumentNo)
          ? idx.get(a.dispatchDocumentNo)!
          : Number.MAX_SAFE_INTEGER;
        const ib = idx.has(b.dispatchDocumentNo)
          ? idx.get(b.dispatchDocumentNo)!
          : Number.MAX_SAFE_INTEGER;
        return ia - ib;
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
        const na = Number((va as unknown as number) ?? 0);
        const nb = Number((vb as unknown as number) ?? 0);
        return sortDir === "asc" ? na - nb : nb - na;
      }

      // string fallback
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return arr;
  }, [groups, sortKey, sortDir, sortOrder]);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6 py-0 ">
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
          </div>
        </div>
        <div className="overflow-x-auto mt-3">
          <div className="bg-background rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm ring-1 ring-border">
                <TableRow className="bg-muted/40 h-10">
                  <TableHead className="w-10" />
                  <TableHead className="w-25">
                    <button
                      type="button"
                      title="Dispatch Plan Number"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("dp")}
                    >
                      DP
                      {sortKey === "dp" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead>
                  {/* <TableHead className="w-45">
                    <button
                      type="button"
                      title="Dispatch Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("dispatch")}
                    >
                      Disp.
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
                      title="Arrival Time"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("arrival")}
                    >
                      Arr.
                      {sortKey === "arrival" &&
                        (sortDir === "asc" ? (
                          <ChevronUpIcon className="size-4" />
                        ) : (
                          <ChevronDownIcon className="size-4" />
                        ))}
                    </button>
                  </TableHead> */}
                  <TableHead className="w-30">
                    <button
                      type="button"
                      title="Total Customers"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("customers")}
                    >
                      Cust.
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
                      title="Fulfilled Count"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("fulfilled")}
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
                      title="Unfulfilled Count"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("unfulfilled")}
                    >
                      Unful.
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
                      title="Performance Percentage"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("performance")}
                    >
                      Perf %
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
                      title="Fulfilled Amount"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("fulfilledAmount")}
                    >
                      Fulfilled Amt
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
                      title="Unfulfilled Amount"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("unfulfilledAmount")}
                    >
                      Unful. Amt
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
                      title="Truck"
                      className="inline-flex items-center gap-1"
                      onClick={() => onToggleSort("truck")}
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
                {(() => {
                  const localTotal = sortedGroups.length;
                  const safeLimit = limit > 0 ? limit : 20;
                  const startIndex = (page - 1) * safeLimit;
                  const endIndex = Math.min(startIndex + safeLimit, localTotal);
                  const pageGroups = sortedGroups.slice(startIndex, endIndex);

                  return pageGroups.map((g) => (
                    <React.Fragment key={g.dispatchDocumentNo}>
                      <TableRow
                        className={`border-t h-12.5 hover:bg-muted/50 cursor-pointer ${g.unfulfilledCount > 0 || (typeof g.fulfillmentPercent === "number" && g.fulfillmentPercent < 100) ? "bg-rose-50 dark:bg-rose-900/20" : ""}`}
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
                            aria-label={
                              expanded[g.dispatchDocumentNo]
                                ? "Collapse row"
                                : "Expand row"
                            }
                            aria-expanded={!!expanded[g.dispatchDocumentNo]}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded((s) => ({
                                ...s,
                                [g.dispatchDocumentNo]:
                                  !s[g.dispatchDocumentNo],
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
                        {/* <TableCell className="py-3">
                          {formatDateTime(g.dispatchTime)}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatDateTime(g.arrivalTime)}
                        </TableCell> */}
                        <TableCell className="py-3">
                          {g.totalCustomers}
                        </TableCell>
                        <TableCell className="py-3">
                          {g.fulfilledCount}
                        </TableCell>
                        <TableCell className="py-3">
                          {g.unfulfilledCount}
                        </TableCell>
                        <TableCell className="py-3">
                          {g.fulfillmentPercent}%
                        </TableCell>
                        <TableCell className="py-3">
                          {formatCurrency(g.fulfilledAmount)}
                        </TableCell>
                        <TableCell className="py-3">
                          {formatCurrency(g.unfulfilledAmount)}
                        </TableCell>
                        <TableCell className="py-3">{g.truck}</TableCell>
                      </TableRow>

                      {expanded[g.dispatchDocumentNo] && (
                        <TableRow>
                          <TableCell colSpan={11} className="bg-muted/30">
                            <CustomersTable customers={g.customers} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
