"use client";

import type { TacticalSkuFilters } from "../types";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TacticalSkuFiltersProps = {
  value: TacticalSkuFilters;
  onChange: (next: TacticalSkuFilters) => void;
  onGenerate: () => void;
  onPrint: () => void;
  loading: boolean;
  printing: boolean;
};

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function parseMonthValue(value: string): { year: string; month: string } {
  const now = new Date();
  const current = {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
  };

  if (!/^\d{4}-\d{2}$/.test(value)) return current;

  const [year, month] = value.split("-");
  if (!MONTH_OPTIONS.some((m) => m.value === month)) return current;

  return { year, month };
}

export function TacticalSkuFiltersBar({
  value,
  onChange,
  onGenerate,
  onPrint,
  loading,
  printing,
}: TacticalSkuFiltersProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, idx) => String(currentYear - 5 + idx));
  const { year, month } = parseMonthValue(value.month);

  const handleMonthChange = (nextMonth: string) => {
    onChange({ ...value, month: `${year}-${nextMonth}` });
  };

  const handleYearChange = (nextYear: string) => {
    onChange({ ...value, month: `${nextYear}-${month}` });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-3 md:grid-cols-[290px_1fr_auto]">
          <div className="grid grid-cols-2 gap-2">
            <Select value={month} onValueChange={handleMonthChange} disabled={loading || printing}>
              <SelectTrigger aria-label="Report month">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={handleYearChange} disabled={loading || printing}>
              <SelectTrigger aria-label="Report year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Search product, brand, category, or salesman"
            aria-label="Search"
          />

          <div className="flex items-center gap-2">
            <Button onClick={onGenerate} disabled={loading || printing}>
              {loading ? "Loading..." : "Generate Report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onPrint}
              disabled={loading || printing}
              className="gap-2"
            >
              <Printer className="size-4" />
              {printing ? "Preparing..." : "Print"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}