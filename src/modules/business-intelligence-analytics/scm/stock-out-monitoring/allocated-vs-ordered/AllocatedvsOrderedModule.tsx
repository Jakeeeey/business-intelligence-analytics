"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PackageSearch } from "lucide-react";
import { useAllocatedvsOrdered } from "./hooks/useAllocatedvsOrdered";
import { Filters } from "./components/Filters";
import { KpiCards } from "./components/KpiCards";
import { OverviewTab } from "./components/OverviewTab";
import { TopProductsTab } from "./components/TopProductsTab";
import { SuppliersTab } from "./components/SuppliersTab";
import { OrdersTab } from "./components/OrdersTab";

export default function AllocatedvsOrderedModule() {
  const hook = useAllocatedvsOrdered();
  const [activeTab, setActiveTab] = React.useState("overview");

  /* ─── States ──────────────────────────────────────────────── */

  // First-load full-page spinner
  if (hook.loading && !hook.loadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <Spinner className="h-8 w-8" />
        <p className="text-sm">Loading allocated vs ordered data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <Filters
        filters={hook.filters}
        onChange={hook.setFilters}
        uniqueSuppliers={hook.uniqueSuppliers}
        uniqueBrands={hook.uniqueBrands}
        uniqueCategories={hook.uniqueCategories}
        uniqueStatuses={hook.uniqueStatuses}
        supplierCounts={hook.supplierCounts}
        brandCounts={hook.brandCounts}
        categoryCounts={hook.categoryCounts}
        statusCounts={hook.statusCounts}
      />

      {/* Data loaded */}
      {hook.loadedOnce && (
        <>
          {/* Refresh spinner bar */}
          {hook.loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Spinner className="h-4 w-4" />
              Refreshing data…
            </div>
          )}

          {/* KPI Cards */}
          <KpiCards kpis={hook.kpis} />

          {/* Empty state after filtering */}
          {hook.filteredData.length === 0 && !hook.loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <PackageSearch className="h-10 w-10 opacity-30" />
              <p className="text-sm">No records match the current filters.</p>
            </div>
          )}

          {/* Tab navigation */}
          {hook.filteredData.length > 0 && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4 ">
                <TabsTrigger value="overview">Allocation Overview</TabsTrigger>
                <TabsTrigger value="suppliers">Supplier Allocation</TabsTrigger>
                <TabsTrigger value="products">Product Allocation</TabsTrigger>
                <TabsTrigger value="orders">Allocation Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab
                  allocationByPeriod={hook.allocationByPeriod}
                  allocationStatusDistribution={
                    hook.allocationStatusDistribution
                  }
                  productSummaries={hook.productSummaries}
                  supplierSummaries={hook.supplierSummaries}
                  granularity={hook.granularity}
                  setGranularity={hook.setGranularity}
                  onNavigateToTab={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="suppliers">
                <SuppliersTab
                  supplierSummaries={hook.supplierSummaries}
                  allRecords={hook.filteredData}
                />
              </TabsContent>

              <TabsContent value="products">
                <TopProductsTab
                  productSummaries={hook.productSummaries}
                  filteredData={hook.filteredData}
                />
              </TabsContent>

              <TabsContent value="orders">
                <OrdersTab
                  orderSummaries={hook.orderSummaries}
                  filteredData={hook.filteredData}
                />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
