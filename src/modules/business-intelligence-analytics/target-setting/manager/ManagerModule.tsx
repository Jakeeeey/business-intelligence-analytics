"use client";

import * as React from "react";

import ManagerHeader from "./components/ManagerHeader";
import AllocationLogTable from "./components/AllocationLogTable";
import SupplierAllocationsTable from "./components/SupplierAllocationsTable";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useManagerTargets } from "./hooks/useManagerTargets";

export default function ManagerModule() {
  const m = useManagerTargets();

  const fiscalOptions = m.execOptions.map((x) => ({ id: x.id, label: x.label }));

  const divisionOptions = m.divisionOptions.map((x) => ({
    id: x.tsd.id,
    label: `${x.divisionName} (Target: ${m.formatPeso(x.tsd.target_amount)})`,
  }));

  const supplierOptions = m.supplierOptions.map((x) => ({ id: x.id, label: x.name }));

  const supplierNameById = React.useCallback(
    (id: number) => m.supplierOptions.find((x) => x.id === id)?.name ?? `Supplier #${id}`,
    [m.supplierOptions],
  );

  if (m.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[160px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  const saveDisabled =
    m.refreshing ||
    !m.selectedDivisionTsdId ||
    !m.selectedSupplierId ||
    (() => {
      // disable only if user is trying to CREATE while remaining is 0
      const existing = m.supplierAllocationsForSelectedDivision.find(
        (x) => x.supplier_id === (m.selectedSupplierId ?? -1),
      );
      return !existing && m.totals.remaining <= 0;
    })();

  return (
    <div className="space-y-4">
      <ManagerHeader
        fiscalOptions={fiscalOptions}
        divisionOptions={divisionOptions}
        supplierOptions={supplierOptions}
        fiscalId={m.selectedExecutiveId}
        onFiscalChange={m.setSelectedExecutiveId}
        divisionTsdId={m.selectedDivisionTsdId}
        onDivisionChange={m.setSelectedDivisionTsdId}
        supplierId={m.selectedSupplierId}
        onSupplierChange={m.setSelectedSupplierId}
        targetAmountInput={m.targetAmountInput}
        onTargetAmountChange={m.setTargetAmountInput}
        onSave={m.saveAllocation}
        savingDisabled={saveDisabled}
      />

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Division Summary</div>
              <div className="text-xs text-muted-foreground">
                Supplier volumes (allocation targets) based on the selected division target.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Division Target: {m.formatPeso(m.totals.divisionTarget)}</Badge>
              <Badge variant="secondary">Allocated: {m.formatPeso(m.totals.allocatedToSuppliers)}</Badge>
              <Badge variant={m.totals.remaining <= 0 ? "destructive" : "outline"}>
                Remaining: {m.formatPeso(m.totals.remaining)}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <SupplierAllocationsTable
            rows={m.supplierAllocationsForSelectedDivision}
            supplierNameById={supplierNameById}
            formatPeso={m.formatPeso}
            onDelete={m.removeAllocation}
            disabled={m.refreshing}
          />
        </CardContent>
      </Card>

      <AllocationLogTable rows={m.allocationLog} formatPeso={m.formatPeso} />
    </div>
  );
}
