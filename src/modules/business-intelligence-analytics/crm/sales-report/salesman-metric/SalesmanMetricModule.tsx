"use client";

import * as React from "react";
import { FiltersBar } from "./components/FiltersBar";
import { BookingMetricsGrid } from "./components/BookingMetricsGrid";
import { MetricGridOne } from "./components/MetricGridOne";
import { MetricGridTwo } from "./components/MetricGridTwo";
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
    filters,
    loading,
    rows,
    handleSalesmanChange,
    handleFiscalPeriodChange,
    
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Salesman Metric Performance</h1>
        <p className="text-sm text-muted-foreground">
          View key metrics performance, reach, frequency, and targets for salesmen.
        </p>
      </div>

      {/* 1. Filters Section */}
      <FiltersBar
        salesmen={salesmen}
        selectedSalesmanId={filters.salesmanId}
        fiscalPeriod={filters.fiscalPeriod}
        onChangeSalesman={handleSalesmanChange}
        onChangeFiscalPeriod={handleFiscalPeriodChange}
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
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <MetricGridOne
              rows={rows}
              loading={loading}
              onViewSupplierBreakdown={handleViewSupplierBreakdown}
              onViewReachBreakdown={handleViewReachBreakdown}
              onViewFrequencyDetail={handleViewFrequencyDetail}
              onViewNewAccountsDetail={handleViewNewAccountsDetail}
            />
            <MetricGridTwo 
              rows={rows} 
              loading={loading} 
              onViewProductiveOutletDetail={handleViewProductiveOutletDetail}
              onViewLineSalesDetail={handleViewLineSalesDetail}
              onViewBasketCountDetail={handleViewBasketCountDetail}
              onViewTacticalSkuDetail={handleViewTacticalSkuDetail}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {modalOpen && (
        <SupplierSalesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          salesmanId={selectedSalesmanId}
          salesmanName={selectedSalesmanName}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
      )}

      {freqModalOpen && (
        <FrequencyDetailModal
          isOpen={freqModalOpen}
          onClose={() => setFreqModalOpen(false)}
          salesmanId={freqSalesmanId}
          salesmanCode={freqSalesmanCode}
          salesmanName={freqSalesmanName}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
      )}

      {reachModalOpen && (
        <ReachDetailModal
          isOpen={reachModalOpen}
          onClose={() => setReachModalOpen(false)}
          salesmanId={reachSalesmanId}
          salesmanCode={reachSalesmanCode}
          salesmanName={reachSalesmanName}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
      )}

      {newAccModalOpen && (
        <NewAccountsDetailModal
          isOpen={newAccModalOpen}
          onClose={() => setNewAccModalOpen(false)}
          salesmanId={newAccSalesmanId}
          salesmanCode={newAccSalesmanCode}
          salesmanName={newAccSalesmanName}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
      )}

      {poModalOpen && (
        <ProductiveOutletDetailModal
          isOpen={poModalOpen}
          onClose={() => setPoModalOpen(false)}
          salesmanId={poSalesmanId}
          salesmanName={poSalesmanName}
          targetMonth={Number(filters.fiscalPeriod.split("-")[1])}
          targetYear={Number(filters.fiscalPeriod.split("-")[0])}
        />
      )}

      {bcModalOpen && (
        <BasketCountDetailModal
          isOpen={bcModalOpen}
          onClose={() => setBcModalOpen(false)}
          salesmanId={bcSalesmanId}
          salesmanName={bcSalesmanName}
          targetMonth={Number(filters.fiscalPeriod.split("-")[1])}
          targetYear={Number(filters.fiscalPeriod.split("-")[0])}
        />
      )}

      {lsModalOpen && (
        <LineSalesDetailModal
          isOpen={lsModalOpen}
          onClose={() => setLsModalOpen(false)}
          salesmanId={lsSalesmanId}
          salesmanName={lsSalesmanName}
          targetMonth={Number(filters.fiscalPeriod.split("-")[1])}
          targetYear={Number(filters.fiscalPeriod.split("-")[0])}
        />
      )}

      {tskuModalOpen && (
        <TacticalSkuDetailModal
          isOpen={tskuModalOpen}
          onClose={() => setTskuModalOpen(false)}
          salesmanId={tskuSalesmanId}
          salesmanName={tskuSalesmanName}
          targetMonth={Number(filters.fiscalPeriod.split("-")[1])}
          targetYear={Number(filters.fiscalPeriod.split("-")[0])}
        />
      )}
    </div>
  );
}
