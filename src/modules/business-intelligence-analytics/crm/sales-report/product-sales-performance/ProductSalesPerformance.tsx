// src/modules/business-intelligence-analytics/sales-report/product-sales-performance/ProductSalesPerformance.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
// import { RefreshCw, AlertTriangle } from "lucide-react";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductSalesPerformance } from "./hooks/useProductSalesPerformance";
import { Filters } from "./components/Filters";
import { KPICards } from "./components/KpiCards";
import { OverviewTab } from "./components/OverviewTab";
import { ProductTab } from "./components/ProductTab";
import { SupplierTab } from "./components/SupplierTab";
import { LocationTab } from "./components/LocationTab";

export default function ProductSalesPerformance() {
  const hook = useProductSalesPerformance();
  const [activeTab, setActiveTab] = React.useState("overview");

  React.useEffect(() => {
    // Auto-load data on mount
    if (!hook.loadedOnce) {
      hook.loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Filters
        filters={hook.filters}
        onChange={hook.setFilters}
        onLoad={hook.loadData}
        loading={hook.loading}
        uniqueSuppliers={hook.uniqueSuppliers}
        uniqueProducts={hook.uniqueProducts}
        uniqueCities={hook.uniqueCities}
        uniqueProvinces={hook.uniqueProvinces}
        uniqueDivisions={hook.uniqueDivisions}
        uniqueOperations={hook.uniqueOperations}
        uniqueSalesmen={hook.uniqueSalesmen}
      />

      {/* Failed Fetch Banner */}
      {/* {hook.fetchFailed && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Failed to fetch updated data. Showing last available data. Please select a filter or date range again to retry.
          </span>
        </div>
      )} */}

      {/* Loading State (when no data yet) */}
      {hook.loading && !hook.loadedOnce && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                Loading product performance data...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fresh Data Loading Indicator (when showing cached data)
      {hook.isLoadingFresh && hook.loadedOnce && (
        <div className="flex items-center justify-center gap-2 py-2">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Updating data...</span>
        </div>
      )} */}

      {/* KPIs */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <KPICards kpis={hook.kpis} />
      )}

      {/* Tabs */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 "
        >
          <TabsList className="grid w-full grid-cols-4  dark:border-zinc-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab
              revenueByPeriod={hook.revenueByPeriod}
              topProducts={hook.topProducts}
              topSuppliers={hook.topSuppliers}
              filteredData={hook.filteredData}
              onNavigateToTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="product" className="space-y-4 ">
            <ProductTab
              topProducts={hook.topProducts}
              productTrends={hook.productTrends}
              filteredData={hook.filteredData}
            />
          </TabsContent>

          <TabsContent value="supplier" className="space-y-4">
            <SupplierTab
              supplierPerformance={hook.supplierPerformance}
              topSuppliers={hook.topSuppliers}
              filteredData={hook.filteredData}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <LocationTab filteredData={hook.filteredData} />
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!hook.loading && hook.loadedOnce && hook.filteredData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">No data found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or date range
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!hook.loading && !hook.loadedOnce && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Welcome to Product Sales Performance Dashboard
            </p>
            <p className="text-sm text-muted-foreground">
              {/* Click &quot;Load Data&quot; to get started */}
              Select a Filter or Select a date range to load data and view
              insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
