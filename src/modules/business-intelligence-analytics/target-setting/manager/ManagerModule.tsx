//src/modules/business-intelligence-analytics/target-setting/manager/ManagerModule.tsx
"use client";

import * as React from "react";

import ManagerContextCard from "./components/ManagerContextCard";
import SupplierAllocationCard from "./components/SupplierAllocationCard";
import { ManagerAllocationHierarchyLog } from "./components/ManagerAllocationHierarchyLog";
import SupplierAllocationsTable from "./components/SupplierAllocationsTable";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useManagerTargets } from "./hooks/useManagerTargets";

export default function ManagerModule() {
  const m = useManagerTargets();

  const fiscalOptions = m.execOptions.map((x) => ({ id: x.id, label: x.label }));

  const divisionOptions = m.divisionOptions.map((x) => {
    const status = x.tsd.status?.toUpperCase();
    const statusLabel = status ? ` [${status}]` : "";
    return {
      id: x.tsd.id,
      label: `${x.divisionName}${statusLabel} (Target: ${m.formatPeso(x.tsd.target_amount)})`,
    };
  });

  const supplierOptions = m.supplierOptions.map((x) => ({ 
    id: x.id, 
    label: m.supplierAllocationsForSelectedDivision.some(a => a.supplier_id === x.id) 
      ? `${x.name} (Set)` 
      : x.name 
  }));

  const supervisorOptions = m.supervisorOptions.map((x) => ({ id: x.id, label: x.name }));

  const supplierNameById = React.useCallback(
    (id: number) => m.supplierOptions.find((x) => x.id === id)?.name ?? `Supplier #${id}`,
    [m.supplierOptions],
  );

  const totalDivisionsTarget = React.useMemo(() => {
    const total = m.divisionOptions.reduce((sum, x) => sum + (Number(x.tsd.target_amount) || 0), 0);
    return m.formatPeso(total);
  }, [m.divisionOptions, m.formatPeso]);

  const isReadOnly = React.useMemo(() => {
    const status = m.selectedDivisionTarget?.status?.toUpperCase();
    return !!status && status !== "DRAFT";
  }, [m.selectedDivisionTarget]);

  if (m.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[160px] w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const saveDisabled =
    m.refreshing ||
    !m.selectedDivisionTsdId ||
    !m.selectedSupplierId ||
    !m.selectedSupervisorId ||
    (() => {
      if (isReadOnly) return true;
      const existing = m.supplierAllocationsForSelectedDivision.find(
        (x) => x.supplier_id === (m.selectedSupplierId ?? -1),
      );
      // Allow save if a matching supplier exists but with a different supervisor (new row)
      return !existing && m.totals.remaining <= 0;
    })();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Context (Fiscal & Division) */}
        <ManagerContextCard
          fiscalOptions={fiscalOptions}
          divisionOptions={divisionOptions}
          fiscalId={m.selectedExecutiveId}
          onFiscalChange={m.setSelectedExecutiveId}
          divisionTsdId={m.selectedDivisionTsdId}
          onDivisionChange={m.setSelectedDivisionTsdId}
          totalDivisionsTarget={totalDivisionsTarget}
          loading={m.refreshing}
          status={m.selectedDivisionTarget?.status ?? undefined}
        />

        {/* Step 2: Allocation (Supplier & Supervisor) */}
        <SupplierAllocationCard
          supplierOptions={supplierOptions}
          supervisorOptions={supervisorOptions}
          supplierId={m.selectedSupplierId}
          onSupplierChange={m.setSelectedSupplierId}
          supervisorId={m.selectedSupervisorId}
          onSupervisorChange={m.setSelectedSupervisorId}
          targetAmountInput={m.targetAmountInput}
          onTargetAmountChange={m.setTargetAmountInput}
          onSave={m.saveAllocation}
          saveDisabled={saveDisabled}
          isReadOnly={isReadOnly}
          loading={m.refreshing}
          allocatedAmount={m.totals.allocatedToSuppliers}
          remainingBalance={m.totals.remaining}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Division Allocation Summary</CardTitle>
            <CardDescription>Review and manage your supplier allocations below.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-md border bg-background">
            <div className="overflow-hidden rounded-md">
              <SupplierAllocationsTable
                rows={m.supplierAllocationsForSelectedDivision}
                supplierNameById={supplierNameById}
                supervisorNameByAllocationId={m.supervisorNamesByAllocationId}
                formatPeso={m.formatPeso}
                onEdit={m.loadRowToForm}
                onDelete={m.removeAllocation}
                disabled={m.refreshing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ManagerAllocationHierarchyLog
        divisionTarget={m.selectedDivisionTarget}
        supplierAllocations={m.supplierAllocationsForSelectedDivision}
        supervisorAllocations={m.supervisorAllocationsForSelectedDivision}
        supplierNameById={supplierNameById}
        resolveSupervisorName={(id) => m.supervisorOptions.find(u => u.id === id)?.name ?? `User #${id}`}
      />
    </div>
  );
}
