"use client";

import React from "react";
import {
    AlertCircle,
    Loader2,
    BarChart3,
    Building2,
    ShoppingBag,
    Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePurchaseReport } from "./hooks/usePurchaseReport";
import { PurchaseReportFilters } from "./components/PurchaseReportFilters";
import { PurchaseReportKpis } from "./components/PurchaseReportKpis";
import { PurchaseReportCharts } from "./components/PurchaseReportCharts";
import { SupplierBreakdownTable } from "./components/SupplierBreakdownTable";
import { ProductBreakdownTable } from "./components/ProductBreakdownTable";
import { PurchaseOrderTable } from "./components/PurchaseOrderTable";
import { PurchaseOrderDetailModal } from "./components/PurchaseOrderDetailModal";
import {
    exportPurchaseOrdersCsv,
    exportSupplierBreakdownCsv,
    exportProductBreakdownCsv,
} from "./utils/exportCsv";

export default function PurchaseReportModule() {
    const {
        filters,
        setFilters,
        datePreset,
        setDatePreset,
        activeTab,
        setActiveTab,
        loading,
        error,
        lookups,
        reportData,
        selectedPo,
        setSelectedPo,
        filteredOrders,
        paginatedOrders,
        poPage,
        setPoPage,
        poPageSize,
        setPoPageSize,
        totalPoPages,
        poSortField,
        poSortOrder,
        handlePoSort,
        sortedSuppliers,
        supplierSortField,
        supplierSortOrder,
        handleSupplierSort,
        sortedProducts,
        paginatedProducts,
        productPage,
        setProductPage,
        productPageSize,
        setProductPageSize,
        totalProductPages,
        productSortField,
        productSortOrder,
        handleProductSort,
        loadData,
        resetFilters,
    } = usePurchaseReport();

    const handleExport = () => {
        if (activeTab === "suppliers") {
            exportSupplierBreakdownCsv(
                sortedSuppliers,
                `supplier_purchases_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
            );
        } else if (activeTab === "products") {
            exportProductBreakdownCsv(
                sortedProducts,
                `product_purchases_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
            );
        } else {
            exportPurchaseOrdersCsv(
                filteredOrders,
                `purchase_orders_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
            );
        }
    };

    return (
        <div className="space-y-5">
            {/* Filters */}
            <PurchaseReportFilters
                filters={filters}
                onChange={setFilters}
                datePreset={datePreset}
                onPresetChange={setDatePreset}
                onReset={resetFilters}
                onReload={loadData}
                onExport={handleExport}
                loading={loading}
                lookups={lookups}
            />

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && !reportData && (
                <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-center p-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Querying Purchase Order & Receiving database...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top KPI Cards */}
            {reportData && <PurchaseReportKpis kpis={reportData.kpis} />}

            {/* Navigation Tabs */}
            {reportData && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
                        <TabsList className="bg-muted/60 p-1 rounded-xl">
                            <TabsTrigger
                                value="overview"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <BarChart3 className="h-3.5 w-3.5" />
                                <span>Overview & Analytics</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="suppliers"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <Building2 className="h-3.5 w-3.5" />
                                <span>Supplier Breakdown ({sortedSuppliers.length})</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="products"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <Package className="h-3.5 w-3.5" />
                                <span>Products ({reportData.productBreakdown?.length || 0})</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="orders"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>Purchase Orders ({reportData.totalCount.toLocaleString()})</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Overview & Analytics */}
                    <TabsContent value="overview" className="space-y-4 m-0 outline-none">
                        <PurchaseReportCharts
                            timeline={reportData.timeline}
                            suppliers={reportData.supplierBreakdown}
                            products={reportData.productBreakdown}
                            branches={reportData.branchDistribution}
                        />
                    </TabsContent>

                    {/* Tab 2: Supplier Breakdown */}
                    <TabsContent value="suppliers" className="space-y-4 m-0 outline-none">
                        <SupplierBreakdownTable
                            data={sortedSuppliers}
                            sortField={supplierSortField}
                            sortOrder={supplierSortOrder}
                            onSort={handleSupplierSort}
                            onSelectSupplier={(id) => {
                                setFilters((prev) => ({ ...prev, supplierId: String(id) }));
                                setActiveTab("orders");
                            }}
                        />
                    </TabsContent>

                    {/* Tab 3: Products Breakdown */}
                    <TabsContent value="products" className="space-y-4 m-0 outline-none">
                        <ProductBreakdownTable
                            data={paginatedProducts}
                            totalCount={sortedProducts.length}
                            currentPage={productPage}
                            pageSize={productPageSize}
                            totalPages={totalProductPages}
                            sortField={productSortField}
                            sortOrder={productSortOrder}
                            onSort={handleProductSort}
                            onPageChange={setProductPage}
                            onPageSizeChange={setProductPageSize}
                            onSelectProduct={(id) => {
                                setFilters((prev) => ({ ...prev, productId: String(id) }));
                                setActiveTab("orders");
                            }}
                        />
                    </TabsContent>

                    {/* Tab 3: Detailed Purchase Orders */}
                    <TabsContent value="orders" className="space-y-4 m-0 outline-none">
                        <PurchaseOrderTable
                            data={paginatedOrders}
                            totalCount={filteredOrders.length}
                            currentPage={poPage}
                            pageSize={poPageSize}
                            totalPages={totalPoPages}
                            sortField={poSortField}
                            sortOrder={poSortOrder}
                            onSort={handlePoSort}
                            onPageChange={setPoPage}
                            onPageSizeChange={setPoPageSize}
                            onSelectPo={setSelectedPo}
                            loading={loading}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* Drilldown Modal */}
            <PurchaseOrderDetailModal
                po={selectedPo}
                open={!!selectedPo}
                onClose={() => setSelectedPo(null)}
            />
        </div>
    );
}
