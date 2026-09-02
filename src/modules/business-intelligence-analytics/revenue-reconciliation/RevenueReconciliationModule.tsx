'use client';

import React from 'react';
import { useRevenueReconciliation } from './hooks/useRevenueReconciliation';
import { Filters } from './components/Filters';
import { KpiCards } from './components/KpiCards';
import { Charts } from './components/Charts';

export default function RevenueReconciliationModule() {
  const {
    loading,
    datePreset,
    setDatePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    suppliersList,
    selectedSuppliers,
    isAllSelected,
    metrics,
    loadData,
    toggleSupplier,
    toggleAll
  } = useRevenueReconciliation();

  return (
    <div className="flex flex-col gap-6 w-full text-foreground bg-background">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">
            Revenue Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconcile Purchase Orders, Sales Invoices, and Remittances with filters by Supplier and Date.
          </p>
        </div>
      </div>

      <Filters 
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        suppliersList={suppliersList}
        selectedSuppliers={selectedSuppliers}
        isAllSelected={isAllSelected}
        toggleSupplier={toggleSupplier}
        toggleAll={toggleAll}
        loadData={loadData}
        loading={loading}
      />

      <KpiCards metrics={metrics} />

      <Charts metrics={metrics} />
    </div>
  );
}
