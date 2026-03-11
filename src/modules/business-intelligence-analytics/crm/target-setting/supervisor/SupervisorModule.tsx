"use client";

import * as React from "react";

import SupervisorContextCard from "./components/SupervisorContextCard";
import SalesmanAllocationCard from "./components/SalesmanAllocationCard";
import AllocationHierarchyLog from "./components/AllocationHierarchyLog";
import { AllocationTable } from "./components/AllocationTable";

import { useSalesmanAllocation } from "./hooks/useSalesmanAllocation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function SupervisorModule() {
  const m = useSalesmanAllocation();

  const allocated = React.useMemo(() => {
    return m.rows.reduce((sum, r) => {
      // If we are editing this row, don't count it towards "allocated" for the sake of the remaining balance display
      // because the input itself will be the "new" value.
      if (m.editingId && r.id === m.editingId) return sum;
      return sum + toNum(r.target_amount);
    }, 0);
  }, [m.rows, m.editingId]);

  const remaining = (m.supplierTargetAmount || 0) - allocated;

  const canSave =
    !!m.fiscalPeriod &&
    m.supplierId != null &&
    m.salesmanId != null &&
    String(m.salesmanTargetAmount ?? "").trim() !== "" &&
    toNum(m.salesmanTargetAmount) >= 0 &&
    m.supplierTargetRow?.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Context */}
        <SupervisorContextCard
          fiscalOptions={m.fiscalOptions}
          supplierOptions={m.supplierOptions}
          fiscalPeriod={m.fiscalPeriod}
          onFiscalChange={m.setFiscalPeriod}
          supplierId={m.supplierId}
          onSupplierChange={m.setSupplierId}
          loading={m.loading}
          supplierTargetAmount={m.supplierTargetAmount}
        />

        {/* Step 2: Allocation */}
        <SalesmanAllocationCard
          salesmen={m.salesmen}
          salesmanId={m.salesmanId}
          onSalesmanChange={m.setSalesmanId}
          targetAmountInput={m.salesmanTargetAmount}
          onTargetAmountChange={m.setSalesmanTargetAmount}
          onSave={() => m.saveAllocation()}
          saveDisabled={!canSave || m.acting}
          loading={m.acting}
          allocatedAmount={allocated}
          remainingBalance={remaining}
          supplierSelected={!!m.supplierId}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Salesman Allocation Summary</CardTitle>
            <CardDescription>Review and manage your salesman allocations below.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Summary / CRUD Table */}
          <div className="rounded-md border bg-background">
            <div className="overflow-hidden rounded-md">
              <AllocationTable
                fiscalPeriod={m.fiscalPeriod}
                supplierId={m.supplierId}
                supplierTargetAmount={m.supplierTargetAmount}
                rows={m.rows}
                supplierById={m.supplierById}
                salesmanById={m.salesmanById}
                acting={m.acting}
                onEdit={(row) => m.loadRowToForm(row)}
                onDelete={(id) => m.removeAllocation(id)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator className="my-4" />

      {/* Hierarchy Log */}
      <AllocationHierarchyLog
        supplierTarget={m.supplierTarget}
        salesmanAllocations={m.rows}
        salesmanNameById={(id) => m.salesmanById[id]?.salesman_name ?? `Salesman #${id}`}
      />
    </div>
  );
}
