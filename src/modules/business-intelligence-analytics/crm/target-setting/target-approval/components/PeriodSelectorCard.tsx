"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface PeriodSelectorCardProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  isLoading: boolean;
}

export function PeriodSelectorCard({ selectedPeriod, onPeriodChange, isLoading }: PeriodSelectorCardProps) {
  const periodOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = -6; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        options.push({
            label: format(d, "MMMM yyyy"),
            value: format(d, "yyyy-MM-01")
        });
    }
    return options;
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Fiscal Period Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">SELECT TARGET MONTH</label>
          <Select value={selectedPeriod} onValueChange={onPeriodChange} disabled={isLoading}>
            <SelectTrigger className="w-full h-12 text-lg font-semibold">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
