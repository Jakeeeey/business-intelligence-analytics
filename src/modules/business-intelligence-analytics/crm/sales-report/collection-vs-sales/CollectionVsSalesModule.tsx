"use client";

import React from "react";
import {
    AlertCircle,
    Loader2,
    BarChart3,
    Users,
    Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollectionVsSales } from "./hooks/useCollectionVsSales";
import { CollectionVsSalesFilters } from "./components/CollectionVsSalesFilters";
import { CollectionVsSalesKpis } from "./components/CollectionVsSalesKpis";
import { CollectionVsSalesCharts } from "./components/CollectionVsSalesCharts";
import { SalesmanComparisonTable } from "./components/SalesmanComparisonTable";
import { CollectionReceiptsTable } from "./components/CollectionReceiptsTable";
import { CollectionReceiptDetailModal } from "./components/CollectionReceiptDetailModal";
import {
    exportSalesmenComparisonCsv,
    exportReceiptsCsv,
} from "./utils/exportCsv";

export default function CollectionVsSalesModule() {
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
        selectedReceipt,
        setSelectedReceipt,
        sortedSalesmen,
        salesmanSortField,
        salesmanSortOrder,
        handleSalesmanSort,
        filteredReceipts,
        paginatedReceipts,
        receiptsPage,
        setReceiptsPage,
        receiptsPageSize,
        setReceiptsPageSize,
        totalReceiptsPages,
        receiptsSortField,
        receiptsSortOrder,
        handleReceiptsSort,
        loadData,
        resetFilters,
    } = useCollectionVsSales();

    const handleExport = () => {
        if (activeTab === "salesmen") {
            exportSalesmenComparisonCsv(
                sortedSalesmen,
                `collection_vs_sales_salesmen_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
            );
        } else {
            exportReceiptsCsv(
                filteredReceipts,
                `collection_receipts_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
            );
        }
    };

    return (
        <div className="space-y-5">
            {/* Filter Section */}
            <CollectionVsSalesFilters
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
                                Computing Collection vs Sales analytics...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top KPI Cards */}
            {reportData && <CollectionVsSalesKpis kpis={reportData.kpis} />}

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
                                <span>Comparison Overview</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="salesmen"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <Users className="h-3.5 w-3.5" />
                                <span>Sales Rep Performance ({sortedSalesmen.length})</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="receipts"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                            >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Collection Receipts ({reportData.totalReceiptsCount.toLocaleString()})</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Overview & Analytics */}
                    <TabsContent value="overview" className="space-y-4 m-0 outline-none">
                        <CollectionVsSalesCharts
                            timeline={reportData.timeline}
                            salesmen={reportData.salesmenComparison}
                            paymentMethods={reportData.paymentMethods}
                        />
                    </TabsContent>

                    {/* Tab 2: Salesmen Breakdown */}
                    <TabsContent value="salesmen" className="space-y-4 m-0 outline-none">
                        <SalesmanComparisonTable
                            data={sortedSalesmen}
                            sortField={salesmanSortField}
                            sortOrder={salesmanSortOrder}
                            onSort={handleSalesmanSort}
                            onSelectSalesman={(id) => {
                                setFilters((prev) => ({ ...prev, salesmanId: String(id) }));
                                setActiveTab("receipts");
                            }}
                        />
                    </TabsContent>

                    {/* Tab 3: Detailed Collection Receipts */}
                    <TabsContent value="receipts" className="space-y-4 m-0 outline-none">
                        <CollectionReceiptsTable
                            data={paginatedReceipts}
                            totalCount={filteredReceipts.length}
                            currentPage={receiptsPage}
                            pageSize={receiptsPageSize}
                            totalPages={totalReceiptsPages}
                            sortField={receiptsSortField}
                            sortOrder={receiptsSortOrder}
                            onSort={handleReceiptsSort}
                            onPageChange={setReceiptsPage}
                            onPageSizeChange={setReceiptsPageSize}
                            onSelectReceipt={setSelectedReceipt}
                            loading={loading}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* Receipt Detail Modal */}
            <CollectionReceiptDetailModal
                receipt={selectedReceipt}
                open={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
            />
        </div>
    );
}
