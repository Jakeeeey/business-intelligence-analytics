// src/modules/business-intelligence-analytics/crm/executive-dashboard/components/FiltersStrip.tsx
"use client";

import React from "react";
import { Calendar, Layers, RefreshCw, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MONTHS = [
  { label: "January", val: "01" },
  { label: "February", val: "02" },
  { label: "March", val: "03" },
  { label: "April", val: "04" },
  { label: "May", val: "05" },
  { label: "June", val: "06" },
  { label: "July", val: "07" },
  { label: "August", val: "08" },
  { label: "September", val: "09" },
  { label: "October", val: "10" },
  { label: "November", val: "11" },
  { label: "December", val: "12" },
];

const YEARS = ["2024", "2025", "2026"];

interface FiltersStripProps {
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedDivision: string;
  setSelectedDivision: (d: string) => void;
  uniqueDivisions: string[];
  loading: boolean;
  refresh: () => void;
}

export function FiltersStrip({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDivision,
  setSelectedDivision,
  uniqueDivisions,
  loading,
  refresh,
}: FiltersStripProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4">
      {/* Title block */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
          <span>BIA Intelligence</span> <ChevronRight className="h-3 w-3" />
          <span>Management Reports</span> <ChevronRight className="h-3 w-3" />
          <span className="text-primary font-black">Executive Dashboard</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
          Executive <span className="text-primary">Dashboard</span>
        </h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Consolidated Trade & Non-Trade financial ledger analytics
        </p>
      </div>

      {/* Control Block */}
      <div className="flex flex-wrap items-center gap-3 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-2.5 shadow-2xl">
        {/* Month Picker */}
        <div className="flex items-center gap-2 px-3 border-r border-border/40 py-1">
          <Calendar className="h-4 w-4 text-primary" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] font-black uppercase text-foreground cursor-pointer h-7"
          >
            {MONTHS.map((m) => (
              <option key={m.val} value={m.val} className="bg-background text-foreground text-xs font-bold">
                {m.label.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Year Picker */}
        <div className="flex items-center gap-2 px-3 border-r border-border/40 py-1">
          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Year</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] font-black uppercase text-foreground cursor-pointer h-7"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-background text-foreground text-xs font-bold">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Division Dropdown */}
        <div className="flex items-center gap-2 px-3 border-r border-border/40 py-1">
          <Layers className="h-4 w-4 text-primary" />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] font-black uppercase text-foreground cursor-pointer h-7 max-w-[140px]"
          >
            {uniqueDivisions.map((d) => (
              <option key={d} value={d} className="bg-background text-foreground text-xs font-bold">
                {d.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <div className="flex items-center gap-2 pl-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={loading}
            className="h-8 w-8 hover:bg-muted/80 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
          <Badge
            variant="outline"
            className="font-black text-[9px] uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20 px-3 py-1.5"
          >
            LIVE ANALYTICS
          </Badge>
        </div>
      </div>
    </div>
  );
}
