"use client";

import * as React from "react";

import AllocationHierarchyLog from "./components/AllocationHierarchyLog";
import { AllocationTable } from "./components/AllocationTable";

import { useSalesmanAllocation } from "./hooks/useSalesmanAllocation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { moneyPHP, monthLabel } from "./utils/format";

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function SupervisorModule() {
  const m = useSalesmanAllocation();

  const supplierLabel = React.useMemo(() => {
    if (!m.supplierId) return "Select supplier";
    const supName =
      m.supplierById?.[m.supplierId]?.supplier_name ?? `Supplier #${m.supplierId}`;
    const t = toNum(m.supplierTargetAmount ?? 0);
    return `${supName} (Target: ${moneyPHP(t)})`;
  }, [m.supplierId, m.supplierById, m.supplierTargetAmount]);

  const canSave =
    !!m.fiscalPeriod &&
    m.supplierId != null &&
    m.salesmanId != null &&
    String(m.salesmanTargetAmount ?? "").trim() !== "" &&
    toNum(m.salesmanTargetAmount) >= 0;

  return (
    <div className="space-y-6">
      {/* TOP CARD: Salesman Allocation form */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 pt-6 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold">Salesman Allocation</div>
                <div className="text-sm text-muted-foreground">
                  Allocate a Supplier target share to specific Salesmen.
                </div>
              </div>

              <Button
                className="cursor-pointer"
                variant="default"
                onClick={() => m.saveAllocation()}
                disabled={!canSave || m.acting}
              >
                Save Allocation
              </Button>
            </div>
          </div>

          <Separator className="my-4"/>

          {/* Inputs */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Fiscal Period */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">
                  FISCAL PERIOD
                </Label>
                <Select
                  value={m.fiscalPeriod || ""}
                  onValueChange={(v) => m.setFiscalPeriod(v)}
                  disabled={m.loading || m.acting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select period">
                      {m.fiscalPeriod ? monthLabel(m.fiscalPeriod) : "Select period"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {m.fiscalOptions.map((fp) => (
                      <SelectItem key={fp} value={fp}>
                        {monthLabel(fp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">
                  SELECT SUPPLIER
                </Label>
                <Select
                  value={m.supplierId != null ? String(m.supplierId) : ""}
                  onValueChange={(v) => m.setSupplierId(Number(v))}
                  disabled={m.loading || m.acting || !m.fiscalPeriod}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier">
                      {m.supplierId != null ? supplierLabel : "Select supplier"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {m.supplierOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label} (Target: {moneyPHP(toNum(s.target_amount))})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salesman */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">
                  SELECT SALESMAN
                </Label>
                <Select
                  value={m.salesmanId != null ? String(m.salesmanId) : ""}
                  onValueChange={(v) => m.setSalesmanId(Number(v))}
                  disabled={m.loading || m.acting || m.supplierId == null}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select salesman" />
                  </SelectTrigger>
                  <SelectContent>
                    {m.salesmen.map((sm) => (
                      <SelectItem key={sm.id} value={String(sm.id)}>
                        {sm.salesman_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salesman Target Share */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide">
                  SALESMAN TARGET SHARE
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    
                  </span>
                  <Input
                    className="w-full pl-7"
                    inputMode="decimal"
                    placeholder="₱"
                    value={m.salesmanTargetAmount ?? ""}
                    onChange={(e) => m.setSalesmanTargetAmount(e.target.value)}
                    disabled={
                      m.loading ||
                      m.acting ||
                      m.supplierId == null ||
                      m.salesmanId == null
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ EXTRA SPACE / DIVIDER (matches screenshot) */}
      <div className="pt-1">
        <Separator className="my-4" />
      </div>

      {/* Summary / CRUD Table */}
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

      {/* ✅ EXTRA SPACE / DIVIDER (matches screenshot) */}
      <div className="pt-1">
        <Separator className="my-4" />
      </div>

      {/* Hierarchy Log */}
      <AllocationHierarchyLog rows={m.hierarchyRows} loading={m.hierarchyLoading} />
    </div>
  );
}
