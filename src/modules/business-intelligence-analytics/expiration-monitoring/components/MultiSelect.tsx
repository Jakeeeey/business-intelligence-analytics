"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectProps {
  options: { value: string | number; label: string }[];
  selectedValues: (string | number)[];
  onValuesChange: (values: (string | number)[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selectedValues = [],
  onValuesChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  allLabel = "All Options",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // If empty, treat as all selected
  const isAllSelected = selectedValues.length === 0 || selectedValues.length === options.length;

  const handleSelect = (val: string | number | "all") => {
    if (val === "all") {
      onValuesChange([]);
    } else {
      let newValues = [...selectedValues];
      if (isAllSelected) {
        newValues = options.map(o => o.value).filter(v => v !== val);
      } else {
        if (newValues.includes(val)) {
          newValues = newValues.filter(v => v !== val);
        } else {
          newValues.push(val);
        }
      }

      if (newValues.length === options.length) {
        onValuesChange([]);
      } else {
        onValuesChange(newValues);
      }
    }
  };

  const displayText = React.useMemo(() => {
    if (isAllSelected) return allLabel;
    if (selectedValues.length === 1) {
      return options.find(o => o.value === selectedValues[0])?.label || placeholder;
    }
    return `${selectedValues.length} Selected`;
  }, [isAllSelected, selectedValues, options, placeholder, allLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 px-3 w-full justify-between text-left font-normal border-border/40 bg-background text-sm focus:border-primary",
            isAllSelected && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all_options"
                onSelect={() => handleSelect("all")}
                className="font-bold cursor-pointer text-xs"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isAllSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
              {options.map((opt) => {
                const isSelected = isAllSelected || selectedValues.includes(opt.value);
                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={opt.label}
                    onSelect={() => handleSelect(opt.value)}
                    className="cursor-pointer text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
