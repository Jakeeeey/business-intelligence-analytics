"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { cn } from "@/lib/utils";

type Opt = { id: number; label: string };

function ComboboxField(props: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: Opt[];
  valueId: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}) {
  const { label, placeholder, searchPlaceholder, options, valueId, onChange, disabled } = props;

  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(() => {
    const hit = options.find((x) => x.id === valueId);
    return hit?.label ?? "";
  }, [options, valueId]);

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("h-10 w-full justify-between px-3 text-left font-normal", !valueId && "text-muted-foreground")}
            disabled={!!disabled}
          >
            <span className="truncate">{valueId ? selectedLabel : placeholder}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[260px] overflow-y-auto">
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.label}
                    onSelect={() => {
                      onChange(o.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="truncate">{o.label}</span>
                    <Check className={cn("ml-auto h-4 w-4", valueId === o.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function ManagerHeader(props: {
  fiscalOptions: Opt[];
  divisionOptions: Opt[];
  supplierOptions: Opt[];

  fiscalId: number | null;
  onFiscalChange: (id: number | null) => void;

  divisionTsdId: number | null;
  onDivisionChange: (id: number | null) => void;

  supplierId: number | null;
  onSupplierChange: (id: number | null) => void;

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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Div Manager: Supplier Allocation</CardTitle>
            <CardDescription>Step 2: Take Division Target and allocate it to specific Suppliers.</CardDescription>
          </div>

          <Button className="cursor-pointer" onClick={onSave} disabled={!!savingDisabled}>
            Save Allocation
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* ✅ Fiscal Period (searchable + scrollable) */}
          <ComboboxField
            label="FISCAL PERIOD"
            placeholder="Select period"
            searchPlaceholder="Search period..."
            options={fiscalOptions}
            valueId={fiscalId}
            onChange={onFiscalChange}
          />

          {/* ✅ Division (searchable + scrollable) */}
          <ComboboxField
            label="SELECT YOUR DIVISION"
            placeholder="Select division"
            searchPlaceholder="Search division..."
            options={divisionOptions}
            valueId={divisionTsdId}
            onChange={onDivisionChange}
            disabled={!fiscalId}
          />

          {/* ✅ Supplier (searchable + scrollable) */}
          <ComboboxField
            label="SELECT SUPPLIER"
            placeholder="Select supplier"
            searchPlaceholder="Search supplier..."
            options={supplierOptions}
            valueId={supplierId}
            onChange={onSupplierChange}
            disabled={!divisionTsdId}
          />

          {/* Target Share */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground">SUPPLIER TARGET SHARE</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₱
              </span>
              <Input
                className="h-10 w-full pl-8"
                inputMode="numeric"
                placeholder="0"
                value={targetAmountInput}
                onChange={(e) => onTargetAmountChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
