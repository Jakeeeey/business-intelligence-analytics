// src/modules/business-intelligence-analytics/sales-report/stt-report/STTReportModule.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSTTReport } from "./hooks/useSTTReport";
import { Filters } from "./components/Filters";
import { KpiCards } from "./components/KpiCards";
import { OverviewTab } from "./components/OverviewTab";
import { SalesmanTab } from "./components/SalesmanTab";
import { ProductTab } from "./components/ProductTab";
import { InvoicesTab } from "./components/InvoicesTab";
import { ReturnsTab } from "./components/ReturnsTab";
import { TopCustomersTab } from "./components/TopCustomersTab";

export default function STTReportModule() {
  const hook = useSTTReport();
  const [activeTab, setActiveTab] = React.useState("overview");

  return (
    <div className="space-y-4 bg-card">
      {/* Filters */}
      <Filters
        filters={hook.filters}
        onChange={hook.setFilters}
        onLoad={hook.generateReport}
        loading={hook.loading}
        uniqueBranches={hook.uniqueBranches}
        uniqueSalesmen={hook.uniqueSalesmen}
        uniqueStatuses={hook.uniqueStatuses}
        uniqueSuppliers={hook.uniqueSuppliers}
        rawData={hook.rawData}
        dateFrom={hook.filters.dateFrom}
        dateTo={hook.filters.dateTo}
      />

      {/* Loading State (first load, no data yet) */}
      {hook.loading && !hook.loadedOnce && (
        <Card className="bg-card">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                Loading Report Data...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State (refreshing existing data) */}
      {hook.loading && hook.loadedOnce && (
        <Card className="bg-card">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <Spinner className="h-5 w-5" />
              <p className="text-sm text-muted-foreground">
                Updating report...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <KpiCards kpis={hook.kpis} />
      )}

      {/* Main Tabs */}
      {hook.loadedOnce && hook.filteredData.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-6 dark:bg-white/18 dark:border-zinc-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="salesman">Salesman</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab
              salesByPeriod={hook.salesByPeriod}
              getSalesByPeriod={hook.getSalesByPeriod}
              topSalesmen={hook.topSalesmen}
              topProducts={hook.topProducts}
              topCustomers={hook.topCustomers}
              statusDistribution={hook.statusDistribution}
              branchSummaries={hook.branchSummaries}
              onNavigateToTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="salesman" className="space-y-4">
            <SalesmanTab salesmanSummaries={hook.salesmanSummaries} />
          </TabsContent>

          <TabsContent value="product" className="space-y-4">
            <ProductTab productSummaries={hook.productSummaries} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <TopCustomersTab customerSummaries={hook.customerSummaries} />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <InvoicesTab
              invoiceSummaries={hook.invoiceSummaries}
              dateFrom={hook.filters.dateFrom}
              dateTo={hook.filters.dateTo}
            />
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            <ReturnsTab returnRecords={hook.returnRecords} />
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!hook.loading && hook.loadedOnce && hook.filteredData.length === 0 && (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">No Data Found</p>
            <p className="text-sm text-muted-foreground">
              No records match your current filter criteria. Try adjusting your
              date range or filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!hook.loading && !hook.loadedOnce && (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Welcome to the Sales Report Summary Dashboard
            </p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Report&quot; to load data. Changing filters
              will not update visuals until you click Generate Report again;
              this keeps the current charts visible while you adjust selections.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
