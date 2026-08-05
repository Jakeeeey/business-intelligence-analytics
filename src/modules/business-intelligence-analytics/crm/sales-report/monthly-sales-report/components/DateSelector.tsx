"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

type DateSelectorProps = {
  selectedMonth: number; // 0-11
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Generate years from 2024 to 2028
const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function DateSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: DateSelectorProps) {
  return (
    <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Selected Reporting Period</h2>
              <p className="text-xs text-muted-foreground">Month-to-Date (MTD) sales performance data</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial w-36">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => onMonthChange(parseInt(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 sm:flex-initial w-28">
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => onYearChange(parseInt(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
