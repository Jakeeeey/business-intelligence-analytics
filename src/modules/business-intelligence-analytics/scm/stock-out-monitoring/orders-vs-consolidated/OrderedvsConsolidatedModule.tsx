"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PackageSearch } from "lucide-react";
import { useOrderedvsConsolidated } from "./hooks/useOrderedvsConsolidated";
import { Filters } from "./components/Filters";
import { KpiCards } from "./components/KpiCards";
import { OverviewTab } from "./components/OverviewTab";
import { TopProductsTab } from "./components/TopProductsTab";
import { SuppliersTab } from "./components/SuppliersTab";
import { OrdersTab } from "./components/OrdersTab";

export default function OrderedvsConsolidatedModule() {
  const hook = useOrderedvsConsolidated();
  const [activeTab, setActiveTab] = React.useState("overview");

  /* ─── First-load full-page spinner ──────────────────────────── */
  if (hook.loading && !hook.loadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <Spinner className="h-8 w-8" />
        <p className="text-sm">Loading orders vs consolidated data…</p>
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
          {/* Refresh indicator */}
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

          {/* Tabs */}
          {hook.filteredData.length > 0 && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4 dark:bg-white/18 dark:border-zinc-700">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="suppliers">Supplier Insights</TabsTrigger>
                <TabsTrigger value="products">Product Insights</TabsTrigger>
                <TabsTrigger value="orders">Order Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab
                  ordersByPeriod={hook.ordersByPeriod}
                  consolidationStatusDistribution={
                    hook.consolidationStatusDistribution
                  }
                  productSummaries={hook.productSummaries}
                  productTrends={hook.productTrends}
                  supplierSummaries={hook.supplierSummaries}
                  categorySummaries={hook.categorySummaries}
                  granularity={hook.granularity}
                  setGranularity={hook.setGranularity}
                  onNavigateToTab={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="suppliers">
                <SuppliersTab supplierSummaries={hook.supplierSummaries} />
              </TabsContent>

              <TabsContent value="products">
                <TopProductsTab productSummaries={hook.productSummaries} />
              </TabsContent>

              <TabsContent value="orders">
                <OrdersTab canonicalOrders={hook.canonicalOrders} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
