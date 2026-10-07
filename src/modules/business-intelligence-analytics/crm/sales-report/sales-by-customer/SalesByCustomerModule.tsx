"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSalesByCustomer } from "./hooks/useSalesByCustomer";
import { CustomerFilters } from "./components/CustomerFilters";
import { CustomerKpis } from "./components/CustomerKpis";
import { CustomerCharts } from "./components/CustomerCharts";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerDetailModal } from "./components/CustomerDetailModal";
import { exportCustomerSalesCsv } from "./utils/exportCsv";

export default function SalesByCustomerModule() {
    const {
        filters,
        setFilters,
        loading,
        error,
        kpis,
        filterOptions,
        customerSummaries,
        paginatedSummaries,
        totalCustomersCount,
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
        customerDetailData,
        loadData,
        resetFilters,
    } = useSalesByCustomer();

    const handleExport = () => {
        exportCustomerSalesCsv(
            customerSummaries,
            `sales_by_customer_${filters.startDate}_to_${filters.endDate}.csv`
        );
    };

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <CustomerFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                onReload={loadData}
                onExport={handleExport}
                loading={loading}
                filterOptions={filterOptions}
            />

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <Card className="border-border bg-card">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Fetching customer sales performance data...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPI Cards */}
            {!loading && <CustomerKpis kpis={kpis} />}

            {/* Charts Section */}
            {!loading && customerSummaries.length > 0 && (
                <CustomerCharts customerSummaries={customerSummaries} />
            )}

            {/* Main Customer Sales Table */}
            {!loading && (
                <CustomerTable
                    data={paginatedSummaries}
                    totalCount={totalCustomersCount}
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
            )}

            {/* Customer Detail Drilldown Modal */}
            <CustomerDetailModal
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                data={customerDetailData}
            />
        </div>
    );
}
