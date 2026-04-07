"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DriverKPIProvider, useDriverKPI } from "./hooks/useDriverKPI";
import { groupByDispatch } from "./utils/calculations";
import Filter from "./components/Filter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import KPICards from "./components/KPICards";
import LogisticsTable from "./components/LogisticsTable";
// import FulfillmentTable from "./components/FulfillmentTableExpand";
import FulfillmentTable from "./components/FulfillmentTableModal";
import TruckHistoryTable from "./components/TruckHistoryTable";
import { Separator } from "@/components/ui/separator";
// Toaster is provided globally in app/layout.tsx
// import { lstatSync } from "fs";

function DriverKPIModuleContent() {
  // useDriverKPI is used inside child components
  const { loading = false, filters, setFilters, data } = useDriverKPI();
  const [searchQuery, setSearchQuery] = useState<string>(
    filters.searchCustomer ?? "",
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortOrder, setSortOrder] = useState<string[] | null>(null);
  const driverNamesKey = (filters.driverNames || []).join(",");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFilters({ searchCustomer: searchQuery || undefined });
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchQuery, setFilters]);

  useEffect(() => {
    const v = filters.searchCustomer ?? "";
    let raf = 0 as number | undefined;
    // schedule async update so we don't synchronously override in-progress typing
    raf = requestAnimationFrame(() => {
      setSearchQuery((prev) => (prev === v ? prev : v));
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [filters.searchCustomer]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Reset to first page when core filters change.
    setPage(1);
  }, [
    filters.startDate,
    filters.endDate,
    driverNamesKey,
    filters.searchCustomer,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const groups = useMemo(() => groupByDispatch(data || []), [data]);
  const totalRecords = groups.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startIndex = Math.max(0, (page - 1) * limit);
  const endIndex = Math.min(startIndex + limit, totalRecords);

  // Compute a canonical document order (array of dispatchDocumentNo) so both
  // Logistics and Fulfillment tables can render rows/groups in the same order
  // regardless of which table's column was used to trigger the sort.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const ensureNull = () => {
      if (sortOrder !== null) setSortOrder(null);
    };

    if (!sortKey) {
      ensureNull();
      return;
    }

    try {
      const groups = groupByDispatch(data || []);
      const computed = groups.map((g) => {
        let v: unknown = null;
        switch (sortKey) {
          case "dp":
            v = g.dispatchDocumentNo ?? "";
            break;
          case "estimatedDispatch": {
            const times = (g.customers || [])
              .map((c) => c.estimatedTimeOfDispatch)
              .filter(Boolean)
              .map((t) => new Date(String(t)).getTime())
              .filter((n) => !Number.isNaN(n));
            v = times.length ? Math.min(...times) : null;
            break;
          }
          case "actualDispatch":
          case "dispatch":
            v = g.dispatchTime
              ? new Date(String(g.dispatchTime)).getTime()
              : null;
            break;
          case "dispatchVariance": {
            const first = (g.customers || [])[0];
            if (first) {
              const e = first.estimatedTimeOfDispatch;
              const a = first.timeOfDispatch;
              if (e && a)
                v = Math.round(
                  (new Date(String(a)).getTime() -
                    new Date(String(e)).getTime()) /
                    60000,
                );
              else if (typeof first.dispatchVarianceHours === "number")
                v = Math.round(first.dispatchVarianceHours * 60);
              else v = null;
            } else v = null;
            break;
          }
          case "estimatedArrival": {
            const times = (g.customers || [])
              .map((c) => c.estimatedTimeOfArrival)
              .filter(Boolean)
              .map((t) => new Date(String(t)).getTime())
              .filter((n) => !Number.isNaN(n));
            v = times.length ? Math.max(...times) : null;
            break;
          }
          case "actualArrival":
          case "arrival":
            v = g.arrivalTime
              ? new Date(String(g.arrivalTime)).getTime()
              : null;
            break;
          case "arrivalVariance": {
            const last = (g.customers || [])[g.customers.length - 1];
            if (last) {
              const e = last.estimatedTimeOfArrival;
              const a = last.returnTimeOfArrival;
              if (e && a)
                v = Math.round(
                  (new Date(String(a)).getTime() -
                    new Date(String(e)).getTime()) /
                    60000,
                );
              else if (typeof last.arrivalVarianceHours === "number")
                v = Math.round(last.arrivalVarianceHours * 60);
              else v = null;
            } else v = null;
            break;
          }
          case "customers":
            v = g.totalCustomers ?? 0;
            break;
          case "fulfilled":
            v = g.fulfilledCount ?? 0;
            break;
          case "unfulfilled":
            v = g.unfulfilledCount ?? 0;
            break;
          case "performance":
            v =
              typeof g.fulfillmentPercent === "number"
                ? g.fulfillmentPercent
                : 0;
            break;
          case "fulfilledAmount":
            v = typeof g.fulfilledAmount === "number" ? g.fulfilledAmount : 0;
            break;
          case "unfulfilledAmount":
            v =
              typeof g.unfulfilledAmount === "number" ? g.unfulfilledAmount : 0;
            break;
          case "truck":
            v = g.truck ?? "";
            break;
          default:
            v = null;
        }
        return { dp: g.dispatchDocumentNo, val: v };
      });

      computed.sort((a, b) => {
        const va = a.val;
        const vb = b.val;
        if (va == null && vb == null) return 0;
        if (va == null) return sortDir === "asc" ? 1 : -1;
        if (vb == null) return sortDir === "asc" ? -1 : 1;
        const na = Number(va as unknown as number);
        const nb = Number(vb as unknown as number);
        const bothNumbers = !Number.isNaN(na) && !Number.isNaN(nb);
        if (bothNumbers) return sortDir === "asc" ? na - nb : nb - na;
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });

      const newOrder = computed.map((c) => c.dp);
      const same =
        sortOrder !== null &&
        sortOrder.length === newOrder.length &&
        sortOrder.every((v, i) => v === newOrder[i]);
      if (!same) setSortOrder(newOrder);
    } catch {
      ensureNull();
    }
  }, [sortKey, sortDir, data, sortOrder]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Driver Performance
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
            />
            Exception Monitoring — Vertex Operations
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <Filter />
        </div>
      </div>

      <Separator />

      <KPICards />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-100 flex gap-2">
          <Input
            placeholder="Search DP No, customer, address, truck..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full"
          />
          <div className="flex items-center gap-2 w-25">
            <div className="text-sm text-muted-foreground">
              {groups.length} records
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-sm text-muted-foreground">
            {Math.min(endIndex, totalRecords)} of {totalRecords}
          </span>
          <div className="flex items-center gap-2">
            {/* <span className="text-sm text-muted-foreground">
              Items per page
            </span> */}
            <Select
              value={String(limit)}
              onValueChange={(v: string) => {
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
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  type="button"
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
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-stretch">
        <div className="h-full">
          <LogisticsTable
            page={page}
            limit={limit}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            sortOrder={sortOrder}
          />
        </div>
        <div className="h-full">
          <FulfillmentTable
            page={page}
            limit={limit}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            sortOrder={sortOrder}
          />
        </div>
      </section>

      <TruckHistoryTable />
    </div>
  );
}

export default function DriverKPIModule() {
  return (
    <DriverKPIProvider>
      <DriverKPIModuleContent />
    </DriverKPIProvider>
  );
}
