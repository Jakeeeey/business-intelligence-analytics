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


export interface MultiSelectSalesmanProps {
    options: { value: string; label: string }[];
    selectedValues: string[]; // empty array means ALL are selected
    onValuesChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function MultiSelectSalesman({
    options,
    selectedValues,
    onValuesChange,
    placeholder = "Select salesmen...",
    disabled = false,
    className,
}: MultiSelectSalesmanProps) {
    const [open, setOpen] = React.useState(false);

    // If selectedValues is empty, we treat it as ALL selected
    const isAllSelected = selectedValues.length === 0 || selectedValues.length === options.length;

    const handleSelect = (val: string) => {
        if (val === "all") {
            // Toggle all
            if (isAllSelected) {
                // If all are selected and we click "All", deselect all (which is weird, maybe clear?)
                // Usually clicking "All" when all are selected should clear, but if empty means all...
                // Let's make it so clicking "All" always selects all.
                onValuesChange([]);
            } else {
                onValuesChange([]);
            }
        } else {
            // Toggle specific value
            let newValues = [...selectedValues];
            if (isAllSelected) {
                // If currently all selected (by default []), and we uncheck one,
                // we need to explicitly select all EXCEPT the unchecked one.
                newValues = options.map(o => o.value).filter(v => v !== val);
            } else {
                if (newValues.includes(val)) {
                    newValues = newValues.filter(v => v !== val);
                } else {
                    newValues.push(val);
                }
            }

            // If we selected everything, just send empty array
            if (newValues.length === options.length) {
                onValuesChange([]);
            } else {
                onValuesChange(newValues);
            }
        }
    };

    const displayText = React.useMemo(() => {
        if (isAllSelected) return "All Salesmen";
        if (selectedValues.length === 1) {
            return options.find(o => o.value === selectedValues[0])?.label || placeholder;
        }
        return `${selectedValues.length} Selected`;
    }, [isAllSelected, selectedValues, options, placeholder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-8 bg-transparent hover:bg-muted/10 border-none font-bold text-xs uppercase tracking-widest px-2", className)}
                    disabled={disabled}
                >
                    <span className="truncate">{displayText}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search salesmen..." className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all_salesmen"
                                onSelect={() => handleSelect("all")}
                                className="font-bold cursor-pointer text-xs"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        isAllSelected ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                All Salesmen
                            </CommandItem>
                            {options.map((opt) => {
                                const isSelected = isAllSelected || selectedValues.includes(opt.value);
                                return (
                                    <CommandItem
                                        key={opt.value}
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
