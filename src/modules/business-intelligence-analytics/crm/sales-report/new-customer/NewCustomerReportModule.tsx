"use client";

import React from "react";
import {
    AlertCircle,
    Loader2,
    Users,
    BarChart3,
    MapPin,
    LayoutGrid,
    Table as TableIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNewCustomerReport } from "./hooks/useNewCustomerReport";
import { NewCustomerFilters } from "./components/NewCustomerFilters";
import { NewCustomerKpis } from "./components/NewCustomerKpis";
import { NewCustomerCharts } from "./components/NewCustomerCharts";
import { NewCustomerTable } from "./components/NewCustomerTable";
import { NewCustomerGrid } from "./components/NewCustomerGrid";
import { NewCustomerGeographic } from "./components/NewCustomerGeographic";
import { NewCustomerDetailModal } from "./components/NewCustomerDetailModal";
import { exportNewCustomersCsv } from "./utils/exportCsv";

export default function NewCustomerReportModule() {
    const {
        filters,
        setFilters,
        setDatePreset,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        loading,
        error,
        kpis,
        filterOptions,
        filteredItems,
        paginatedItems,
        totalCount,
        provinceSummaries,
        registrationTrends,
        salesmanLeaderboard,
        sortField,
        sortOrder,
        handleSort,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        selectedCustomer,
        setSelectedCustomer,
        loadData,
        resetFilters,
    } = useNewCustomerReport();

    const handleExport = () => {
        exportNewCustomersCsv(
            filteredItems,
            `new_customers_report_${filters.startDate || "all"}_to_${filters.endDate || "all"}.csv`
        );
    };

    return (
        <div className="space-y-5">
            {/* Filter Section with Quick Presets */}
            <NewCustomerFilters
                filters={filters}
                onChange={setFilters}
                onPresetChange={setDatePreset}
                onReset={resetFilters}
                onReload={loadData}
                onExport={handleExport}
                loading={loading}
                filterOptions={filterOptions}
                totalFilteredCount={totalCount}
            />

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-center p-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Querying customer database...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top KPI Cards */}
            {!loading && <NewCustomerKpis kpis={kpis} />}

            {/* Navigation Tabs (Registry | Analytics | Geographic) */}
            {!loading && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
                        <TabsList className="bg-muted/60 p-1 rounded-xl">
                            <TabsTrigger
                                value="registry"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                                <Users className="h-3.5 w-3.5" />
                                <span>Customer Registry ({totalCount.toLocaleString()})</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="analytics"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                                <BarChart3 className="h-3.5 w-3.5" />
                                <span>Analytics & Trends</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="geographic"
                                className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                <span>Geographic Reach ({provinceSummaries.length})</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* View Switcher (Only visible when on Registry tab) */}
                        {activeTab === "registry" && (
                            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
                                <Button
                                    variant={viewMode === "table" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("table")}
                                    className={`h-7 px-2 text-xs gap-1 ${
                                        viewMode === "table" ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                                    }`}
                                    title="Table View"
                                >
                                    <TableIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Table</span>
                                </Button>

                                <Button
                                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className={`h-7 px-2 text-xs gap-1 ${
                                        viewMode === "grid" ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                                    }`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Cards</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Tab 1: Customer Registry */}
                    <TabsContent value="registry" className="space-y-4 m-0 outline-none">
                        {viewMode === "table" ? (
                            <NewCustomerTable
                                data={paginatedItems}
                                totalCount={totalCount}
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                onSelectCustomer={setSelectedCustomer}
                                loading={loading}
                            />
                        ) : (
                            <NewCustomerGrid
                                data={paginatedItems}
                                onSelectCustomer={setSelectedCustomer}
                                loading={loading}
                            />
                        )}
                    </TabsContent>

                    {/* Tab 2: Analytics & Trends */}
                    <TabsContent value="analytics" className="space-y-4 m-0 outline-none">
                        <NewCustomerCharts
                            items={filteredItems}
                            trends={registrationTrends}
                            leaderboard={salesmanLeaderboard}
                        />
                    </TabsContent>

                    {/* Tab 3: Geographic Reach */}
                    <TabsContent value="geographic" className="space-y-4 m-0 outline-none">
                        <NewCustomerGeographic
                            summaries={provinceSummaries}
                            selectedProvince={filters.province}
                            onSelectProvince={(prov) => {
                                setFilters((prev) => ({ ...prev, province: prov, city: "ALL" }));
                                setActiveTab("registry");
                            }}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* Customer Detail Profile Modal */}
            <NewCustomerDetailModal
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    );
}
