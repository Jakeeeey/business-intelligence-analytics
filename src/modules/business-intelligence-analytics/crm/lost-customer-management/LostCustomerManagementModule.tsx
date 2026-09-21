"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Users,
  UserX,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLostCustomerManagement } from "./hooks/useLostCustomerManagement";
import { LostCustomerFilters } from "./components/LostCustomerFilters";
import { LostCustomerKpis } from "./components/LostCustomerKpis";
import { LostCustomerCharts } from "./components/LostCustomerCharts";
import { LostCustomerTable } from "./components/LostCustomerTable";
import { LostCustomerDetailModal } from "./components/LostCustomerDetailModal";
import { exportLostCustomersCsv } from "./utils/exportCsv";

export default function LostCustomerManagementModule() {
  const {
    filters,
    setFilters,
    loading,
    error,
    filteredCustomers,
    paginatedCustomers,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortOrder,
    handleSort,
    selectedCustomer,
    setSelectedCustomer,
    uniqueTaggings,
    kpis,
    taggingDistribution,
    inactivityDistribution,
    topAtRiskCustomers,
    loadData,
    resetFilters,
  } = useLostCustomerManagement();

  const [activeTab, setActiveTab] = useState("accounts");

  const handleExport = () => {
    exportLostCustomersCsv(
      filteredCustomers,
      `lost_customers_${filters.tagging || "all"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="space-y-5.5 pt-1">
      {/* Top Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs border border-red-500/20">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Lost Customer Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor, analyze, and recover dormant, at-risk, and lost customer accounts across channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 shadow-2xs text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-foreground">{filteredCustomers.length.toLocaleString()}</span>
            <span>Accounts Monitored</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <LostCustomerFilters
        filters={filters}
        onChange={setFilters}
        uniqueTaggings={uniqueTaggings}
        onReset={resetFilters}
        onReload={loadData}
        onExport={handleExport}
        loading={loading}
        totalCount={filteredCustomers.length}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <LostCustomerKpis kpis={kpis} />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="accounts"
              className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Customer Accounts ({filteredCustomers.length.toLocaleString()})</span>
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Inactivity & Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Detailed Table */}
        <TabsContent value="accounts" className="space-y-4 m-0 outline-none">
          <LostCustomerTable
            data={paginatedCustomers}
            totalCount={filteredCustomers.length}
            currentPage={page}
            pageSize={pageSize}
            totalPages={totalPages}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSelectCustomer={setSelectedCustomer}
            loading={loading}
          />
        </TabsContent>

        {/* Tab 2: Visual Analytics */}
        <TabsContent value="analytics" className="space-y-4 m-0 outline-none">
          <LostCustomerCharts
            taggingDistribution={taggingDistribution}
            inactivityDistribution={inactivityDistribution}
            topAtRiskCustomers={topAtRiskCustomers}
            onSelectCustomer={setSelectedCustomer}
          />
        </TabsContent>
      </Tabs>

      {/* Drilldown Modal */}
      <LostCustomerDetailModal
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
