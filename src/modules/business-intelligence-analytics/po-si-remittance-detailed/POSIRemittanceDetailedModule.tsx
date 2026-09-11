'use client';

import React from 'react';
import { usePOSIRemittanceDetailed } from './hooks/usePOSIRemittanceDetailed';
import { Filters } from './components/Filters';
import { KpiCards } from './components/KpiCards';
import { Charts } from './components/Charts';

export default function POSIRemittanceDetailedModule() {
  const {
    data,
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
    loadData,
    toggleSupplier,
    toggleAll
  } = usePOSIRemittanceDetailed();

  return (
    <div className="flex flex-col gap-6 w-full text-foreground bg-background">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">
            PO-SI-Remittance Detailed
          </h1>
          <p className="text-sm text-muted-foreground">
            Detailed monitor for Purchase Orders, Allocations, Sales Invoices, Remittances and Discrepancies by Supplier and Date.
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

      {data && data.summary && <KpiCards summary={data.summary} />}

      {data && data.summary && <Charts summary={data.summary} />}
    </div>
  );
}
