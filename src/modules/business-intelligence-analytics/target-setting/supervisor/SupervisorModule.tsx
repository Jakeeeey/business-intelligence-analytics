"use client";

import * as React from "react";
import { toast } from "sonner";

import { useSalesmanAllocation } from "./hooks/useSalesmanAllocation";
import { moneyPHP, monthLabel } from "./utils/format";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AllocationTable } from "./components/AllocationTable";

export default function SupervisorModule() {
  const s = useSalesmanAllocation();
  const [editingId, setEditingId] = React.useState<number | null>(null);

  function onEdit(row: any) {
    setEditingId(row.id);
    s.loadRowToForm(row);
    toast.message("Loaded row for editing.");
  }

  async function onSave() {
    // Status removed: always DRAFT
    s.setStatus("DRAFT");

    await s.saveAllocation(editingId ?? undefined);

    setEditingId(null);
    s.setSalesmanTargetAmount("");
    s.setStatus("DRAFT");
  }

  // ✅ pull the selected supplier target amount (for pills)
  const selectedSupplierTargetAmount = React.useMemo(() => {
    if (s.supplierId == null) return 0;
    const hit = s.supplierOptions.find((x: any) => x.id === s.supplierId);
    return Number(hit?.target_amount ?? 0);
  }, [s.supplierId, s.supplierOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-lg font-semibold">Salesman Allocation</div>
              <div className="text-sm text-muted-foreground">
                Allocate a Supplier target share to specific Salesmen.
              </div>
            </div>

            <Button onClick={onSave} disabled={s.acting}>
              Save Allocation
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fiscal Period */}
            <div className="space-y-2">
              <Label>FISCAL PERIOD</Label>
              <Select value={s.fiscalPeriod} onValueChange={s.setFiscalPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fiscal period" />
                </SelectTrigger>
                <SelectContent>
                  {s.fiscalOptions.map((fp) => (
                    <SelectItem key={fp} value={fp}>
                      {monthLabel(fp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier (label includes target) */}
            <div className="space-y-2">
              <Label>SELECT SUPPLIER</Label>
              <Select
                value={s.supplierId != null ? String(s.supplierId) : ""}
                onValueChange={(v) => s.setSupplierId(v ? Number(v) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {s.supplierOptions.map((opt: any) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.label} (Target: {moneyPHP(opt.target_amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salesman */}
            <div className="space-y-2">
              <Label>SELECT SALESMAN</Label>
              <Select
                value={s.salesmanId != null ? String(s.salesmanId) : ""}
                onValueChange={(v) => s.setSalesmanId(v ? Number(v) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select salesman" />
                </SelectTrigger>
                <SelectContent>
                  {s.salesmen
                    .filter((x) =>
                      typeof x.isActive === "number" ? x.isActive === 1 : x.isActive !== false
                    )
                    .map((sm) => (
                      <SelectItem key={sm.id} value={String(sm.id)}>
                        {sm.salesman_name ?? `Salesman #${sm.id}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target share */}
            <div className="space-y-2">
              <Label>SALESMAN TARGET SHARE</Label>
              <Input
                className="w-full"
                inputMode="decimal"
                placeholder="₱ 0"
                value={s.salesmanTargetAmount}
                onChange={(e) => s.setSalesmanTargetAmount(e.target.value)}
              />
              {editingId ? (
                <div className="text-xs text-muted-foreground">
                  Editing allocation ID: <span className="font-mono">{editingId}</span>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ New table layout (replicates screenshot design) */}
      <AllocationTable
        fiscalPeriod={s.fiscalPeriod}
        supplierId={s.supplierId}
        supplierTargetAmount={selectedSupplierTargetAmount}
        rows={s.rows}
        supplierById={s.supplierById}
        salesmanById={s.salesmanById}
        acting={s.acting}
        onEdit={onEdit}
        onDelete={s.removeAllocation}
      />
    </div>
  );
}
