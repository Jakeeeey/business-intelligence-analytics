"use client";

import * as React from "react";
import { FiltersBar } from "./components/FiltersBar";
import { BookingMetricsGrid } from "./components/BookingMetricsGrid";
import { SiteSalesMetricsList } from "./components/SiteSalesMetricsList";
import { SupplierSalesModal } from "./components/SupplierSalesModal";
import { FrequencyDetailModal } from "./components/FrequencyDetailModal";
import { NewAccountsDetailModal } from "./components/NewAccountsDetailModal";
import { ProductiveOutletDetailModal } from "./components/ProductiveOutletDetailModal";
import { BasketCountDetailModal } from "./components/BasketCountDetailModal";
import { LineSalesDetailModal } from "./components/LineSalesDetailModal";
import { TacticalSkuDetailModal } from "./components/TacticalSkuDetailModal";
import { ReachDetailModal } from "./components/ReachDetailModal";
import { useSalesmanMetric } from "./hooks/useSalesmanMetric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalesmanMetricModule() {
  const {
    salesmen,
    localFilters,
    appliedFilters,
    loading,
    rows,
    handleSalesmanChange,
    handleFiscalPeriodChange,
    handleApplyFilters,
    handleRefresh,
    handleClearFilters,
    hasActiveFilters,
    // Search
    searchQuery,
    setSearchQuery,

    // Modal States & Setters
    modalOpen, setModalOpen, selectedSalesmanId, selectedSalesmanName,
    freqModalOpen, setFreqModalOpen, freqSalesmanId, freqSalesmanCode, freqSalesmanName,
    reachModalOpen, setReachModalOpen, reachSalesmanId, reachSalesmanCode, reachSalesmanName,
    newAccModalOpen, setNewAccModalOpen, newAccSalesmanId, newAccSalesmanCode, newAccSalesmanName,
    poModalOpen, setPoModalOpen, poSalesmanId, poSalesmanName,
    bcModalOpen, setBcModalOpen, bcSalesmanId, bcSalesmanName,
    lsModalOpen, setLsModalOpen, lsSalesmanId, lsSalesmanName,
    tskuModalOpen, setTskuModalOpen, tskuSalesmanId, tskuSalesmanName,

    // Actions
    handleViewSupplierBreakdown,
    handleViewFrequencyDetail,
    handleViewReachBreakdown,
    handleViewNewAccountsDetail,
    handleViewProductiveOutletDetail,
    handleViewBasketCountDetail,
    handleViewLineSalesDetail,
    handleViewTacticalSkuDetail,
  } = useSalesmanMetric();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Salesman Metric</h1>
        <p className="text-sm text-muted-foreground">
          View key metrics performance, reach, frequency, and targets for salesmen.
        </p>
      </div>

      {/* 1. Filters Section */}
      <FiltersBar
        salesmen={salesmen}
        selectedSalesmanId={localFilters.salesmanId}
        fiscalPeriod={localFilters.fiscalPeriod}
        onChangeSalesman={handleSalesmanChange}
        onChangeFiscalPeriod={handleFiscalPeriodChange}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onApplyFilters={handleApplyFilters}
        onRefresh={handleRefresh}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        loading={loading}
      />

      {/* 2. Booking Metrics */}
      <BookingMetricsGrid
        rows={rows}
        loading={loading}
        onViewSupplierBreakdown={handleViewSupplierBreakdown}
        onViewFrequencyDetail={handleViewFrequencyDetail}
      />

      {/* 3. Site Sales Metrics */}
      <Card className="border-border/60 bg-card dark:border-zinc-800">
        <CardHeader className="py-4 px-6 border-b border-border/40 dark:border-zinc-800/40">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            Site Sales Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SiteSalesMetricsList
            rows={rows}
            loading={loading}
            onViewSupplierBreakdown={handleViewSupplierBreakdown}
            onViewReachBreakdown={handleViewReachBreakdown}
            onViewFrequencyDetail={handleViewFrequencyDetail}
            onViewNewAccountsDetail={handleViewNewAccountsDetail}
            onViewProductiveOutletDetail={handleViewProductiveOutletDetail}
            onViewLineSalesDetail={handleViewLineSalesDetail}
            onViewBasketCountDetail={handleViewBasketCountDetail}
            onViewTacticalSkuDetail={handleViewTacticalSkuDetail}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {modalOpen && (
        <SupplierSalesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          salesmanId={selectedSalesmanId}
          salesmanName={selectedSalesmanName}
          startDate={appliedFilters.startDate}
          endDate={appliedFilters.endDate}
        />
      )}

      {freqModalOpen && (
        <FrequencyDetailModal
          isOpen={freqModalOpen}
          onClose={() => setFreqModalOpen(false)}
          salesmanId={freqSalesmanId}
          salesmanCode={freqSalesmanCode}
          salesmanName={freqSalesmanName}
          startDate={appliedFilters.startDate}
          endDate={appliedFilters.endDate}
        />
      )}

      {reachModalOpen && (
        <ReachDetailModal
          isOpen={reachModalOpen}
          onClose={() => setReachModalOpen(false)}
          salesmanId={reachSalesmanId}
          salesmanCode={reachSalesmanCode}
          salesmanName={reachSalesmanName}
          startDate={appliedFilters.startDate}
          endDate={appliedFilters.endDate}
        />
      )}

      {newAccModalOpen && (
        <NewAccountsDetailModal
          isOpen={newAccModalOpen}
          onClose={() => setNewAccModalOpen(false)}
          salesmanId={newAccSalesmanId}
          salesmanCode={newAccSalesmanCode}
          salesmanName={newAccSalesmanName}
          startDate={appliedFilters.startDate}
          endDate={appliedFilters.endDate}
        />
      )}

      {poModalOpen && (
        <ProductiveOutletDetailModal
          isOpen={poModalOpen}
          onClose={() => setPoModalOpen(false)}
          salesmanId={poSalesmanId}
          salesmanName={poSalesmanName}
          targetMonth={Number(appliedFilters.fiscalPeriod.split("-")[1])}
          targetYear={Number(appliedFilters.fiscalPeriod.split("-")[0])}
        />
      )}

      {bcModalOpen && (
        <BasketCountDetailModal
          isOpen={bcModalOpen}
          onClose={() => setBcModalOpen(false)}
          salesmanId={bcSalesmanId}
          salesmanName={bcSalesmanName}
          targetMonth={Number(appliedFilters.fiscalPeriod.split("-")[1])}
          targetYear={Number(appliedFilters.fiscalPeriod.split("-")[0])}
        />
      )}

      {lsModalOpen && (
        <LineSalesDetailModal
          isOpen={lsModalOpen}
          onClose={() => setLsModalOpen(false)}
          salesmanId={lsSalesmanId}
          salesmanName={lsSalesmanName}
          targetMonth={Number(appliedFilters.fiscalPeriod.split("-")[1])}
          targetYear={Number(appliedFilters.fiscalPeriod.split("-")[0])}
        />
      )}

      {tskuModalOpen && (
        <TacticalSkuDetailModal
          isOpen={tskuModalOpen}
          onClose={() => setTskuModalOpen(false)}
          salesmanId={tskuSalesmanId}
          salesmanName={tskuSalesmanName}
          targetMonth={Number(appliedFilters.fiscalPeriod.split("-")[1])}
          targetYear={Number(appliedFilters.fiscalPeriod.split("-")[0])}
        />
      )}
    </div>
  );
}
