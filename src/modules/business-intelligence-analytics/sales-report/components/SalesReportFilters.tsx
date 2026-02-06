"use client";

import * as React from "react";
import type { EmployeeGroup, SalesReportFilters } from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { MultiSelect } from "./MultiSelect";

type Props = {
  employees: EmployeeGroup[];
  value: SalesReportFilters;
  onChange: React.Dispatch<React.SetStateAction<SalesReportFilters>>;
  onGenerate: () => void;
  onExport: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function SalesReportFiltersBar(props: Props) {
  const { employees, value, onChange, onGenerate, onExport, loading, disabled } = props;

  const employeeOptions =
    employees?.map((e) => ({ label: e.employee, value: e.employee })) ?? [];

  const selectedEmployee = value.employee;
  const accountsForEmployee =
    employees.find((e) => e.employee === selectedEmployee)?.accounts ?? [];

  const accountOptions = accountsForEmployee.map((a) => ({
    label: `${a.salesman_code ? `${a.salesman_code} - ` : ""}${a.salesman_name}`,
    value: String(a.id),
  }));

  const monthOptions = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const yearOptions = [2026, 2025, 2024].map((y) => ({ label: String(y), value: String(y) }));

  return (
    <Card className="border-muted">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT: Title */}
          <div className="min-w-0">
            <div className="text-xl font-bold leading-tight">Sales Performance</div>
            <div className="text-sm text-muted-foreground">Allocation vs. Invoiced Report</div>
          </div>

          {/* RIGHT: Filters + Actions */}
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap">
              {/* ✅ Salesman MUST be single-select */}
              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[220px] lg:min-w-[240px]">
                <MultiSelect
                  mode="single"
                  placeholder="Select Salesman"
                  options={employeeOptions}
                  value={value.employee ? [value.employee] : []}
                  onChange={(vals) => {
                    const emp = (vals?.[0] ?? null) as string | null;

                    onChange((prev) => ({
                      ...prev,
                      employee: emp,
                      // reset accounts if salesman changes
                      accountIds: [],
                    }));
                  }}
                  disabled={disabled}
                />
              </div>

              {/* Accounts stays multi-select */}
              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[240px] lg:min-w-[260px]">
                <MultiSelect
                  mode="multi"
                  placeholder="Select Accounts"
                  options={accountOptions}
                  value={(value.accountIds ?? []).map(String)}
                  onChange={(vals) => {
                    const ids = (vals ?? []).map((v) => Number(v)).filter(Number.isFinite);
                    onChange((prev) => ({ ...prev, accountIds: ids }));
                  }}
                  disabled={disabled || !value.employee}
                />
              </div>

              {/* Month stays multi-select */}
              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[200px] lg:min-w-[200px]">
                <MultiSelect
                  mode="multi"
                  placeholder="Select Month"
                  options={monthOptions}
                  value={(value.months ?? []).map(String)}
                  onChange={(vals) => {
                    const ms = (vals ?? []).map((v) => Number(v)).filter(Number.isFinite);
                    onChange((prev) => ({ ...prev, months: ms }));
                  }}
                  disabled={disabled}
                />
              </div>

              {/* Year single-select */}
              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[120px]">
                <MultiSelect
                  mode="single"
                  placeholder="Year"
                  options={yearOptions}
                  value={[String(value.year)]}
                  onChange={(vals) => {
                    const y = Number(vals?.[0] ?? value.year);
                    onChange((prev) => ({ ...prev, year: Number.isFinite(y) ? y : prev.year }));
                  }}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={onGenerate} disabled={disabled || loading}>
                {loading ? "Generating..." : "Generate"}
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={onExport} disabled={loading}>
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Separator />
        </div>
      </CardContent>
    </Card>
  );
}
