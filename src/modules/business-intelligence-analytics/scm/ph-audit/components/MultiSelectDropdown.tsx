"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Search, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  placeholder: string;
  allLabel?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  placeholder,
  allLabel = `All ${placeholder}`,
  options,
  selectedValues,
  onChange,
  className = "w-[160px]",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, search]);

  const handleSelectAll = () => {
    if (search.trim()) {
      const matchValues = filteredOptions.map((o) => o.value);
      const combined = Array.from(new Set([...selectedValues, ...matchValues]));
      onChange(combined);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const handleClearAll = () => {
    if (search.trim()) {
      const matchValues = new Set(filteredOptions.map((o) => o.value));
      onChange(selectedValues.filter((v) => !matchValues.has(v)));
    } else {
      onChange([]);
    }
  };

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const triggerLabel = useMemo(() => {
    if (selectedValues.length === 0) {
      return allLabel;
    }
    if (selectedValues.length === options.length) {
      return allLabel;
    }
    if (selectedValues.length === 1) {
      const matched = options.find((o) => o.value === selectedValues[0]);
      return matched ? matched.label : selectedValues[0];
    }
    return `${selectedValues.length} Selected`;
  }, [selectedValues, options, allLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 justify-between text-xs font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 ${className}`}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[280px] p-0 shadow-lg border bg-popover text-popover-foreground rounded-md overflow-hidden"
      >
        <div className="flex items-center border-b px-2.5 py-1.5 bg-background">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-b text-[11px] bg-muted/30">
          <button
            type="button"
            onClick={handleSelectAll}
            className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {search.trim() ? "Select Matches" : "Select All"}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <ScrollArea className="h-[220px] p-1.5">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggle(opt.value);
                    }}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-xs cursor-pointer select-none transition-colors ${
                      isChecked
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(opt.value)}
                      className="h-4 w-4 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="truncate flex-1" title={opt.label}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

