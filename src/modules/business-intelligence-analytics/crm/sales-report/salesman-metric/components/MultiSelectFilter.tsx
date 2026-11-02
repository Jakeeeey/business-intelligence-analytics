"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface MultiSelectFilterProps {
    options: { value: string; label: string }[];
    selectedValues: string[]; // empty array means ALL are selected initially, OR user explicitly deselected all
    onValuesChange: (values: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    allLabel?: string;
    disabled?: boolean;
    className?: string;
}

export function MultiSelectFilter({
    options,
    selectedValues,
    onValuesChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    allLabel = "All Options",
    disabled = false,
    className,
}: MultiSelectFilterProps) {
    const [open, setOpen] = React.useState(false);

    // If selectedValues has "__ALL__", or is empty initially and not manually cleared
    // Let's use a clear indicator:
    // If selectedValues contains "__NONE__", exactly 0 items are selected.
    // If selectedValues is empty [] or contains all option values or contains "__ALL__", all are selected.
    const isNoneSelected = selectedValues.length === 1 && selectedValues[0] === "__NONE__";
    const isAllSelected = !isNoneSelected && (
        selectedValues.length === 0 ||
        selectedValues.includes("__ALL__") ||
        (options.length > 0 && options.every(opt => selectedValues.includes(opt.value)))
    );

    const handleSelectAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onValuesChange(["__ALL__"]);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onValuesChange(["__NONE__"]);
    };

    const handleToggleItem = (val: string) => {
        let currentEffective: string[] = [];

        if (isAllSelected) {
            currentEffective = options.map((o) => o.value);
        } else if (isNoneSelected) {
            currentEffective = [];
        } else {
            currentEffective = selectedValues.filter(v => v !== "__ALL__" && v !== "__NONE__");
        }

        let next: string[];
        if (currentEffective.includes(val)) {
            next = currentEffective.filter((v) => v !== val);
            if (next.length === 0) {
                next = ["__NONE__"];
            }
        } else {
            next = [...currentEffective, val];
            if (options.length > 0 && next.length === options.length) {
                next = ["__ALL__"];
            }
        }

        onValuesChange(next);
    };

    const displayText = React.useMemo(() => {
        if (isNoneSelected) return placeholder;
        if (isAllSelected) return allLabel;

        const effectiveValues = selectedValues.filter(v => v !== "__ALL__" && v !== "__NONE__");
        if (effectiveValues.length === 1) {
            return options.find((o) => o.value === effectiveValues[0])?.label || placeholder;
        }
        if (effectiveValues.length > 1) {
            return `${effectiveValues.length} Selected`;
        }
        return placeholder;
    }, [isNoneSelected, isAllSelected, selectedValues, options, placeholder, allLabel]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-8 bg-transparent hover:bg-muted/10 border-none font-bold text-xs uppercase tracking-widest px-2",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">{displayText}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 shadow-lg border border-border" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9 text-xs" />
                    
                    {/* Header Action Bar: Select All / Clear All */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/20">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className={cn(
                                "text-xs font-semibold hover:text-foreground transition-colors",
                                isAllSelected ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            Select All
                        </button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearAll}
                            className="h-6 px-2.5 text-[11px] font-medium rounded-md border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                            Clear All
                        </Button>
                    </div>

                    <CommandList className="max-h-[260px] overflow-y-auto">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => {
                                const isChecked = !isNoneSelected && (
                                    isAllSelected || selectedValues.includes(opt.value)
                                );
                                return (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.label}
                                        onSelect={() => handleToggleItem(opt.value)}
                                        className="cursor-pointer text-xs flex items-center gap-2.5 py-1.5 px-3 hover:bg-accent/50 aria-selected:bg-accent"
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            className="pointer-events-none rounded-sm border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <span className="break-words leading-tight flex-1 text-foreground">
                                            {opt.label}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
