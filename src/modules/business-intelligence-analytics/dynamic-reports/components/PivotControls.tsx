"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, LayoutGrid, Calculator } from "lucide-react";
import { AggregationType } from "../utils/pivot-utils";

interface PivotControlsProps {
  columns: string[];
  config: {
    rowKey: string;
    colKey: string;
    valueKey: string;
    aggType: AggregationType;
  };
  onChange: (newConfig: any) => void;
  onExport: () => void;
}

export function PivotControls({ columns, config, onChange, onExport }: PivotControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-end gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Row Axis */}
      <div className="space-y-2 flex-1 w-full">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <LayoutGrid className="w-3 h-3" />
          Row Axis (Vertical)
        </Label>
        <Select value={config.rowKey} onValueChange={(val) => onChange({ ...config, rowKey: val })}>
          <SelectTrigger className="rounded-xl border-none bg-background shadow-sm h-11">
            <SelectValue placeholder="Select Row" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-premium">
            {columns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Column Axis */}
      <div className="space-y-2 flex-1 w-full">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <LayoutGrid className="w-3 h-3 rotate-90" />
          Column Axis (Horizontal)
        </Label>
        <Select value={config.colKey} onValueChange={(val) => onChange({ ...config, colKey: val })}>
          <SelectTrigger className="rounded-xl border-none bg-background shadow-sm h-11">
            <SelectValue placeholder="Select Column" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-premium">
            {columns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value Field (Optional for Count/Presence) */}
      <div className="space-y-2 flex-1 w-full">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Calculator className="w-3 h-3" />
          Value Field
        </Label>
        <Select value={config.valueKey} onValueChange={(val) => onChange({ ...config, valueKey: val })}>
          <SelectTrigger className="rounded-xl border-none bg-background shadow-sm h-11">
            <SelectValue placeholder="Select Value" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-premium">
            {columns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aggregation Type */}
      <div className="space-y-2 flex-1 w-full">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Aggregation</Label>
        <Select value={config.aggType} onValueChange={(val: AggregationType) => onChange({ ...config, aggType: val })}>
          <SelectTrigger className="rounded-xl border-none bg-background shadow-sm h-11">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-premium">
            <SelectItem value="presence">Presence (✓)</SelectItem>
            <SelectItem value="count">Count (Count Rows)</SelectItem>
            <SelectItem value="sum">Sum (Add Values)</SelectItem>
            <SelectItem value="average">Average</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Export Action */}
      <Button 
        onClick={onExport} 
        variant="outline" 
        className="rounded-xl h-11 font-bold tracking-tighter gap-2 border-primary/20 hover:bg-primary/10 active:scale-95"
      >
        <Download className="w-4 h-4" />
        Export Pivot
      </Button>
    </div>
  );
}
