"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: number; label: string };

export default function ManagerHeader(props: {
  fiscalOptions: Option[];
  divisionOptions: { id: number; label: string }[];
  supplierOptions: { id: number; label: string }[];

  fiscalId: number | null;
  onFiscalChange: (id: number) => void;

  divisionTsdId: number | null;
  onDivisionChange: (id: number) => void;

  supplierId: number | null;
  onSupplierChange: (id: number) => void;

  targetAmountInput: string;
  onTargetAmountChange: (v: string) => void;

  onSave: () => void;
  savingDisabled?: boolean;
}) {
  const {
    fiscalOptions,
    divisionOptions,
    supplierOptions,
    fiscalId,
    onFiscalChange,
    divisionTsdId,
    onDivisionChange,
    supplierId,
    onSupplierChange,
    targetAmountInput,
    onTargetAmountChange,
    onSave,
    savingDisabled,
  } = props;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-base font-semibold">Div Manager: Supplier Allocation</div>
            <div className="text-sm text-muted-foreground">
              Step 2: Take Division Target and allocate it to specific Suppliers.
            </div>
          </div>

          <Button className="cursor-pointer" onClick={onSave} disabled={savingDisabled}>
            Save Allocation
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">FISCAL PERIOD</Label>
            <Select
              value={fiscalId ? String(fiscalId) : ""}
              onValueChange={(v) => onFiscalChange(Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {fiscalOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)} className="cursor-pointer">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">SELECT YOUR DIVISION</Label>
            <Select
              value={divisionTsdId ? String(divisionTsdId) : ""}
              onValueChange={(v) => onDivisionChange(Number(v))}
              disabled={!fiscalId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisionOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)} className="cursor-pointer">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">SELECT SUPPLIER</Label>
            <Select
              value={supplierId ? String(supplierId) : ""}
              onValueChange={(v) => onSupplierChange(Number(v))}
              disabled={!divisionTsdId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {supplierOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)} className="cursor-pointer">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">SUPPLIER TARGET SHARE</Label>
            <Input
              className="h-10"
              placeholder="₱ 0"
              value={targetAmountInput}
              onChange={(e) => onTargetAmountChange(e.target.value)}
              disabled={!supplierId}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
