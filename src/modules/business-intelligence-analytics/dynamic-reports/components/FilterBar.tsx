"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  actionStrip?: React.ReactNode;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  actionStrip,
}: FilterBarProps) {

  return (
      <div className="shrink-0 px-4 py-3 flex items-center justify-between gap-4">
        {/* 1. SEARCH CONTAINER */}
        <div className="relative w-1/4 h-10 bg-background dark:bg-slate-900 border border-border rounded-md overflow-hidden transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/50 group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30 group-focus-within/search:text-primary transition-colors" />
          <Input
            placeholder="Search analytics data..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full pl-10 pr-4 rounded-none border-0 bg-transparent text-foreground placeholder:text-foreground/30 font-black tracking-tight text-[11px] uppercase focus-visible:ring-0"
          />
        </div>

        {/* 2. ACTION STRIP (NO PARENT CONTAINER) */}
        <div className="flex items-center gap-2">
          {actionStrip}
        </div>
      </div>
  );
}
