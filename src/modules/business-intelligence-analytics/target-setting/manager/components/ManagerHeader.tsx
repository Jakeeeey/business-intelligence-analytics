//src/modules/business-intelligence-analytics/target-setting/manager/components/ManagerHeader.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: number; label: string };

function SearchableSelect(props: {
  label: string;
  placeholder: string;
  valueId: number | null;
  options: Option[];
  onChange: (id: number) => void;
}) {
  const { label, placeholder, valueId, options, onChange } = props;
  const selected = options.find((o) => o.id === valueId);

  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="h-10 w-full justify-between font-normal"
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList className="max-h-[240px] overflow-auto">
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
                  >
                    <Check className={cn("mr-2 h-4 w-4", valueId === o.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{o.label}</span>
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
  fiscalOptions: Option[];
  divisionOptions: Option[];
  supplierOptions: Option[];
  supervisorOptions: Option[];

  fiscalId: number | null;
  onFiscalChange: (id: number) => void;

  divisionTsdId: number | null;
  onDivisionChange: (id: number) => void;

  supplierId: number | null;
  onSupplierChange: (id: number) => void;

  supervisorId: number | null;
  onSupervisorChange: (id: number) => void;

  targetAmountInput: string;
  onTargetAmountChange: (v: string) => void;

  totalDivisionsTarget: string;

  onSave: () => void;
  savingDisabled?: boolean;
}) {
  const {
    fiscalOptions,
    divisionOptions,
    supplierOptions,
    supervisorOptions,

    fiscalId,
    onFiscalChange,
    divisionTsdId,
    onDivisionChange,
    supplierId,
    onSupplierChange,

    supervisorId,
    onSupervisorChange,

    targetAmountInput,
    onTargetAmountChange,

    totalDivisionsTarget,

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

          <div className="flex items-center gap-3">
            <div className="rounded-md border bg-muted/40 px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Divisions Target</div>
              <div className="text-sm font-semibold">{totalDivisionsTarget}</div>
            </div>

            <Button
              className="cursor-pointer"
              variant="default"
              onClick={() => {
                if (savingDisabled) {
                  toast.error("Cannot save. Please check your inputs / remaining allocation.");
                  return;
                }
                onSave();
              }}
              disabled={savingDisabled}
            >
              Save Allocation
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 2 rows layout like your screenshot */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SearchableSelect
            label="Fiscal Period"
            placeholder="Select period"
            valueId={fiscalId}
            options={fiscalOptions}
            onChange={onFiscalChange}
          />

          <SearchableSelect
            label="Select Your Division"
            placeholder="Select division"
            valueId={divisionTsdId}
            options={divisionOptions}
            onChange={onDivisionChange}
          />

          <SearchableSelect
            label="Select Supplier"
            placeholder="Select supplier"
            valueId={supplierId}
            options={supplierOptions}
            onChange={onSupplierChange}
          />

          {/* ✅ NEW Supervisor */}
          <SearchableSelect
            label="Select Supervisor"
            placeholder="Select supervisor"
            valueId={supervisorId}
            options={supervisorOptions}
            onChange={onSupervisorChange}
          />

          {/* Target share spans full width */}
          <div className="md:col-span-2">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Supplier Target Share</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                <Input
                  className="h-10 pl-8"
                  inputMode="numeric"
                  placeholder="0"
                  value={targetAmountInput}
                  onChange={(e) => onTargetAmountChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
