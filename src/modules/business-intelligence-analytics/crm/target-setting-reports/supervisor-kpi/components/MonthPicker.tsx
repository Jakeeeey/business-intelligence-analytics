"use client";

import React, { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
    value: string; // YYYY-MM
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MonthPicker({ value, onChange, placeholder = "Select month" }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Parse the current value to get initial year for the grid
    const date = parseISO(value + "-01");
    const [viewYear, setViewYear] = useState(isValid(date) ? date.getFullYear() : new Date().getFullYear());

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const handleMonthClick = (monthIdx: number) => {
        const newValue = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
        onChange(newValue);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setIsOpen(false);
    };

    const handleThisMonth = () => {
        const now = new Date();
        onChange(format(now, "yyyy-MM"));
        setIsOpen(false);
    };

    const displayValue = isValid(date) ? format(date, "MMMM yyyy") : placeholder;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[140px] justify-between text-left font-bold border-none bg-transparent hover:bg-muted/30 h-8 px-2 focus:ring-0",
                        !value && "text-muted-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs">{displayValue}</span>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="flex flex-col space-y-4">
                    {/* Header: Year Selector */}
                    <div className="flex items-center justify-between px-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewYear(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-black bg-muted px-4 py-1 rounded-md">
                            {viewYear}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewYear(prev => prev + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((m, idx) => {
                            const isSelected = isValid(date) && date.getFullYear() === viewYear && date.getMonth() === idx;
                            const isCurrent = currentYear === viewYear && currentMonth === idx;

                            return (
                                <Button
                                    key={m}
                                    variant={isSelected ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-9 text-xs font-bold transition-all",
                                        isSelected && "shadow-md bg-blue-600 hover:bg-blue-700",
                                        isCurrent && !isSelected && "text-blue-600 border border-blue-100"
                                    )}
                                    onClick={() => handleMonthClick(idx)}
                                >
                                    {m}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t pt-3 mt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] text-blue-600 hover:text-blue-700 h-6 px-2 font-bold"
                            onClick={handleClear}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] text-blue-600 hover:text-blue-700 h-6 px-2 font-bold"
                            onClick={handleThisMonth}
                        >
                            This month
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
