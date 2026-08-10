"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

type DateSelectorProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
};

export default function DateSelector({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateSelectorProps) {
  return (
    <Card className="border shadow-xs bg-card/60 backdrop-blur-xs">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Selected Reporting Period</h2>
              <p className="text-xs text-muted-foreground">Select a custom date range for performance data</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-44">
              <Label htmlFor="date-from" className="text-xs font-semibold text-muted-foreground mb-0.5">
                Date From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-44">
              <Label htmlFor="date-to" className="text-xs font-semibold text-muted-foreground mb-0.5">
                Date To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
