// src/modules/business-intelligence-analytics/sales-report/product-returns-performance/ProductReturnsPerformanceModule.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
// import { RefreshCw, AlertTriangle } from "lucide-react";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { useProductReturnsPerformance } from "./hooks/useProductReturnsPerformance";
import { Filters } from "./components/Filters";
import { KPICards } from "./components/KpiCards";
import { OverviewTab } from "./components/OverviewTab";
import { ProductTab } from "./components/ProductTab";
import { SupplierTab } from "./components/SupplierTab";
import { LocationTab } from "./components/LocationTab";

export default function ProductReturnsPerformanceModule() {
  const hook = useProductReturnsPerformance();
  const [activeTab, setActiveTab] = React.useState("overview");
  React.useEffect(() => {
    // Auto-load data on mount
    if (!hook.loadedOnce) {
      hook.loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 bg-card">
      {/* Filters */}
      <Filters
        filters={hook.filters}
        onChange={hook.setFilters}
        onLoad={hook.loadData}
        // onGenerateReport={hook.generateReport}
        loading={hook.loading}
        // reportGenerated={hook.reportGenerated}
        rawData={hook.rawData}
        dateFrom={hook.filters.dateFrom}
        dateTo={hook.filters.dateTo}
        uniqueSuppliers={hook.uniqueSuppliers}
        uniqueProducts={hook.uniqueProducts}
        productBrandMap={hook.productBrandMap}
        uniqueBrands={hook.uniqueBrands}
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

      {/* Loading State (first load, no data yet) */}
      {hook.loading && !hook.loadedOnce && (
        <Card className="bg-card">
          <CardContent className="flex items-center justify-center p-8 bg-card">
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                Loading product return performance data…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background Refresh Indicator
      {hook.isLoadingFresh && hook.loadedOnce && (
        <div className="flex items-center justify-center gap-2 py-2 ">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Updating data...</span>
        </div>
      )} */}

      {/* KPI Cards */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <KPICards kpis={hook.kpis} />
      )}

      {/* Main Tabs */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 "
        >
          <TabsList className="grid w-full grid-cols-4 dark:bg-white/18 dark:border-zinc-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab
              returnsByPeriod={hook.returnsByPeriod}
              topProducts={hook.topProducts}
              topSuppliers={hook.topSuppliers}
              filteredData={hook.filteredData}
              onNavigateToTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="product" className="space-y-4 ">
            <ProductTab
              allProducts={hook.allProducts}
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
            <LocationTab
              locationReturns={hook.locationReturns}
              filteredData={hook.filteredData}
            />
          </TabsContent>
        </Tabs>
      )}
      {/* Empty State */}
      {!hook.loading && hook.loadedOnce && hook.filteredData.length === 0 && (
        // {/* Empty State - shown after Generate Report returns no data */}
        // {!hook.loading &&
        //   hook.reportGenerated &&
        //   hook.filteredData.length === 0 && (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">No return data found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or date range
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial / filter-loaded state - before any report is generated */}
      {!hook.loading && !hook.loadedOnce && (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Welcome to Product Return Performance Dashboard
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
