"use client";

import * as React from "react";

import ManagerHeader from "./components/ManagerHeader";
import AllocationLogTable from "./components/AllocationLogTable";
import SupplierAllocationsTable from "./components/SupplierAllocationsTable";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const saveDisabled =
    m.refreshing ||
    !m.selectedDivisionTsdId ||
    !m.selectedSupplierId ||
    (() => {
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
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Division Summary</CardTitle>
              <CardDescription>Supplier volumes (allocation targets) based on the selected division target.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Badge variant="secondary">Division Target: {m.formatPeso(m.totals.divisionTarget)}</Badge>
              <Badge variant="secondary">Allocated: {m.formatPeso(m.totals.allocatedToSuppliers)}</Badge>
              <Badge variant={m.totals.rawRemaining <= 0 ? "destructive" : "outline"}>
                Remaining: {m.formatPeso(m.totals.remaining)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* ✅ Line between the two title sections */}
          <Separator className="my-4" />

          {/* Supplier Allocations title (below the line) */}
          <div className="mb-3">
            <div className="text-sm font-semibold">Supplier Allocations</div>
            <div className="text-xs text-muted-foreground">
              Create, update, and delete supplier allocations under the selected division.
            </div>
          </div>

          {/* Table container */}
          <div className="rounded-md border bg-background">
            <div className="overflow-hidden rounded-md">
              <SupplierAllocationsTable
                rows={m.supplierAllocationsForSelectedDivision}
                supplierNameById={supplierNameById}
                formatPeso={m.formatPeso}
                onDelete={m.removeAllocation}
                disabled={m.refreshing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AllocationLogTable rows={m.allocationLog} formatPeso={m.formatPeso} />
    </div>
  );
}
