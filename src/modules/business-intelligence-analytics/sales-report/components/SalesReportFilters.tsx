"use client";

import * as React from "react";
import { toast } from "sonner";

import type { EmployeeGroup, SalesReportFilters } from "../types";
import { MONTHS } from "../utils/months";
import { MultiSelect } from "./MultiSelect";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function yearOptions(nowYear: number) {
  return [nowYear, nowYear - 1, nowYear - 2].map((y) => String(y));
}

export function SalesReportFiltersBar(props: {
  employees: EmployeeGroup[];
  value: SalesReportFilters;
  onChange: (next: SalesReportFilters) => void;
  onGenerate: () => void;
  onExport: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { employees, value, onChange, onGenerate, onExport, disabled, loading } = props;

  const employeeOptions = employees.map((e) => ({ value: e.employee, label: e.employee }));
  const selectedEmployee = value.employee ? employees.find((e) => e.employee === value.employee) : null;

  const accountOptions =
    selectedEmployee?.accounts.map((a) => ({
      value: String(a.id),
      label: `${a.salesman_code} - ${a.salesman_name}`,
    })) ?? [];

  const monthOptions = MONTHS.map((m) => ({ value: String(m.value), label: m.label }));

  const years = yearOptions(new Date().getFullYear());

  return (
    <Card className="border-muted">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[260px_260px_200px_120px_auto_auto] lg:items-center lg:justify-end w-full">
            {/* Employee (single) */}
            <Select
              value={value.employee ?? ""}
              onValueChange={(v) => {
                // reset accounts when employee changes
                onChange({ ...value, employee: v || null, accountIds: [] });
              }}
              disabled={disabled || loading}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select Salesman" />
              </SelectTrigger>
              <SelectContent>
                {employeeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="cursor-pointer">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Accounts (multi) */}
            <MultiSelect
              value={value.accountIds.map(String)}
              options={accountOptions}
              placeholder="Select Accounts"
              searchPlaceholder="Search accounts..."
              disabled={disabled || loading || !value.employee}
              onChange={(vals) => onChange({ ...value, accountIds: vals.map((x) => Number(x)).filter(Number.isFinite) })}
            />

            {/* Months (multi) */}
            <MultiSelect
              value={value.months.map(String)}
              options={monthOptions}
              placeholder="Select Months"
              searchPlaceholder="Search months..."
              disabled={disabled || loading}
              onChange={(vals) => onChange({ ...value, months: vals.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n >= 1 && n <= 12) })}
            />

            {/* Year (single) */}
            <Select
              value={String(value.year)}
              onValueChange={(v) => onChange({ ...value, year: Number(v) })}
              disabled={disabled || loading}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y} className="cursor-pointer">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full cursor-pointer lg:w-auto"
              disabled={disabled || loading}
              onClick={() => {
                if (!value.employee) return toast.error("Please select a Salesman.");
                if (!value.accountIds.length) return toast.error("Please select at least 1 account.");
                if (!value.months.length) return toast.error("Please select at least 1 month.");
                onGenerate();
              }}
            >
              {loading ? "Generating..." : "Generate"}
            </Button>

            <Button
              variant="outline"
              className="w-full cursor-pointer lg:w-auto"
              disabled={disabled || loading}
              onClick={onExport}
            >
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
