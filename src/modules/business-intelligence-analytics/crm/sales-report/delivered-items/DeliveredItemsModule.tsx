// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/DeliveredItemsModule.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Users, Boxes } from "lucide-react";
import { useDeliveredItems } from "./hooks/useDeliveredItems";
import { DeliveredItemsFiltersComponent } from "./components/DeliveredItemsFilters";
import { DeliveredItemsKpisComponent } from "./components/DeliveredItemsKpis";
import { CustomerDeliveredTableComponent } from "./components/CustomerDeliveredTable";
import { ProductDeliveredTableComponent } from "./components/ProductDeliveredTable";
import { DeliveryItemDetailModalComponent } from "./components/DeliveryItemDetailModal";
import {
  exportCustomerDeliveredCsv,
  exportItemizedDeliveryCsv,
  exportProductDeliveredCsv,
} from "./utils/exportCsv";
import {
  exportCustomerDeliveredPdf,
  exportProductDeliveredPdf,
} from "./utils/exportPdf";

export default function DeliveredItemsModule() {
  const {
    filters,
    setFilters,
    filteredRecords,
    availableCustomers,
    customerSummaries,
    productSummaries,
    kpis,
    loading,
    error,
    loadData,
    searchDatabaseCustomers,
    isSearchingDb,
    selectAllCustomers,
    clearAllCustomers,
    toggleCustomer,
    selectedCustomerModal,
    setSelectedCustomerModal,
    modalCustomerItems,
  } = useDeliveredItems();

  const [activeTab, setActiveTab] = React.useState<string>("customers");

  const handleExportCustomerSummary = () => {
    exportCustomerDeliveredCsv(
      customerSummaries,
      `delivered_items_by_customer_${filters.startDate}_to_${filters.endDate}.csv`
    );
  };

  const handleExportProductSummary = () => {
    exportProductDeliveredCsv(
      productSummaries,
      `delivered_items_by_product_${filters.startDate}_to_${filters.endDate}.csv`
    );
  };

  const handleExportItemized = () => {
    exportItemizedDeliveryCsv(
      filteredRecords,
      `delivered_items_itemized_${filters.startDate}_to_${filters.endDate}.csv`
    );
  };

  const handleExportPdf = () => {
    exportCustomerDeliveredPdf(
      customerSummaries,
      filters,
      kpis,
      `delivered_items_summary_${filters.startDate}_to_${filters.endDate}.pdf`
    );
  };

  const handleExportProductPdf = () => {
    exportProductDeliveredPdf(
      productSummaries,
      filters,
      kpis,
      `delivered_items_products_${filters.startDate}_to_${filters.endDate}.pdf`
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <DeliveredItemsFiltersComponent
        filters={filters}
        onChange={setFilters}
        availableCustomers={availableCustomers}
        onReload={loadData}
        onExportPdf={handleExportPdf}
        onExportProductPdf={handleExportProductPdf}
        onExportCustomerSummary={handleExportCustomerSummary}
        onExportProductSummary={handleExportProductSummary}
        onExportItemized={handleExportItemized}
        onSelectAllCustomers={selectAllCustomers}
        onClearAllCustomers={clearAllCustomers}
        onToggleCustomer={toggleCustomer}
        onSearchCustomers={searchDatabaseCustomers}
        isSearchingCustomers={isSearchingDb}
        loading={loading}
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive/40 dark:bg-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Card */}
      {loading && (
        <Card className="border-border/80 bg-card dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Fetching and aggregating delivered items report...
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Metric Cards */}
      {!loading && <DeliveredItemsKpisComponent kpis={kpis} />}

      {/* Main Tabs (Customer breakdown vs Product breakdown) */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="grid w-full grid-cols-2 max-w-[360px] border border-border/80 bg-muted/60 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="customers"
              className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-100"
            >
              <Users className="h-3.5 w-3.5" />
              <span>By Customer ({customerSummaries.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="gap-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-100"
            >
              <Boxes className="h-3.5 w-3.5" />
              <span>By Product ({productSummaries.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-3 mt-0">
            <CustomerDeliveredTableComponent
              data={customerSummaries}
              onSelectCustomer={(cName) => setSelectedCustomerModal(cName)}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-3 mt-0">
            <ProductDeliveredTableComponent
              data={productSummaries}
              onExport={handleExportProductSummary}
              onExportPdf={handleExportProductPdf}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Customer Itemized Detail Drilldown Modal */}
      <DeliveryItemDetailModalComponent
        customerName={selectedCustomerModal}
        items={modalCustomerItems}
        onClose={() => setSelectedCustomerModal(null)}
      />
    </div>
  );
}
