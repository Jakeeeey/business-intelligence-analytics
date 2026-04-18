"use client";

import React, { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { DriverKPIProvider, useDriverKPI } from "./hooks/useDriverKPI";
import { Truck, Package } from "lucide-react";
import Filter from "./components/Filter";
import { groupByDispatch } from "./utils/calculations";
import { groupSortValue, compareValues, type SortKey } from "./utils/sort";

import KPICards from "./components/KPICards";
import LogisticsTable from "./components/LogisticsTable";
import FulfillmentTable from "./components/FulfillmentTable";
import TruckHistoryTable from "./components/TruckHistoryTable";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

function LastSyncTime() {
  const { lastSync } = useDriverKPI();

  if (!lastSync) {
    return <p className="text-xs font-mono text-muted-foreground">—</p>;
  }

  let formatted = lastSync;
  try {
    const d = new Date(lastSync);
    if (!isNaN(d.getTime())) formatted = format(d, "HH:mm:ss");
  } catch {}

  return <p className="text-xs font-mono text-muted-foreground">{formatted}</p>;
}

function DriverKPIModuleContent() {
  const { loading = false, data } = useDriverKPI();

  // =========================
  // GLOBAL TABLE STATE
  // =========================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [activeTab, setActiveTab] = useState<"logistics" | "fulfillment">(
    "fulfillment",
  );

  const handleTabChange = (v: string) => {
    setActiveTab(v as "logistics" | "fulfillment");
  };

  const [sortState, setSortState] = useState<{
    key: string | null;
    dir: "asc" | "desc";
  }>({ key: null, dir: "asc" });
  const sortKey = sortState.key;
  const sortDir = sortState.dir;

  const [expandedFulfillment, setExpandedFulfillment] = useState<
    Record<string, boolean>
  >({});

  const [tableSearch, setTableSearch] = useState("");

  // =========================
  // CALLBACKS (STABLE)
  // =========================
  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleSearchChange = useCallback((q: string) => {
    setTableSearch(q);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((n: number) => {
    setLimit(n);
    setPage(1);
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSortState((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  }, []);

  // =========================
  // SORT SYNC ENGINE
  // =========================
  const sortOrder = useMemo(() => {
    if (!sortKey) return null;

    try {
      const groups = groupByDispatch(data || []);
      return groups
        .map((g) => ({
          dp: g.dispatchDocumentNo,
          val: groupSortValue(g, sortKey as SortKey),
        }))
        .sort((a, b) => compareValues(a.val, b.val, sortDir))
        .map((c) => c.dp);
    } catch {
      // silent fail for resilience
      return null;
    }
  }, [sortKey, sortDir, data]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-20">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground  tracking-tight">
            Driver Performance
          </h1>

          <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
              }`}
            />
            Exception Monitoring — Vertex Operations
          </p>
        </div>

        <Filter />
      </div>

      <Separator />

      <KPICards />

      {/* =========================
          TABS SYSTEM (FIXED)
      ========================= */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between w-full">
          <TabsList className="inline-flex h-10 items-center gap-2 w-70 font-bold">
            <TabsTrigger value="logistics" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Logistics
            </TabsTrigger>

            <TabsTrigger
              value="fulfillment"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Fulfillment
            </TabsTrigger>
          </TabsList>

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Last Sync
            </p>
            <LastSyncTime />
          </div>
        </div>

        {/* LOGISTICS */}
        <TabsContent value="logistics">
          <div className="pt-4">
            <LogisticsTable
              page={page}
              limit={limit}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              sortOrder={sortOrder}
              searchQuery={tableSearch}
              onSearchChange={handleSearchChange}
            />
          </div>
        </TabsContent>

        {/* FULFILLMENT */}
        <TabsContent value="fulfillment">
          <div className="pt-4">
            <FulfillmentTable
              page={page}
              limit={limit}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              sortOrder={sortOrder}
              expanded={expandedFulfillment}
              onToggleExpanded={(dp: string) =>
                setExpandedFulfillment((s) => ({
                  ...s,
                  [dp]: !s[dp],
                }))
              }
              searchQuery={tableSearch}
              onSearchChange={handleSearchChange}
            />
          </div>
        </TabsContent>
      </Tabs>

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
