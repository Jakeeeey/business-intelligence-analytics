"use client";

import { useState } from "react";
import { useMovementReviewer } from "./hooks/useMovementReviewer";
import { useSuppliers } from "./hooks/useSuppliers";
import { MovementPivotTable } from "./components/MovementPivotTable";
import { MovementSummaryTable } from "./components/MovementSummaryTable";
import { MovementDrillDownSheet } from "./components/MovementDrillDownSheet";
import { VProductMovementDto } from "./types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // NEW IMPORT

import { Check, ChevronsUpDown, Filter, Loader2, CalendarClock } from "lucide-react"; // Added CalendarClock
import { cn } from "@/lib/utils";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const MovementReviewerModule = () => {
    const [supplierId, setSupplierId] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [open, setOpen] = useState(false);

    // Drill-down State
    const [drillDownData, setDrillDownData] = useState<VProductMovementDto[]>([]);
    const [drillDownTitle, setDrillDownTitle] = useState("");
    const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

    const { loading, error, pivotReport, summaryReport, rawData, generateReport } = useMovementReviewer();
    const { suppliers, loadingSuppliers } = useSuppliers();

    const handleGenerate = () => {
        generateReport(supplierId, fromDate, toDate);
    };

    const handleCellClick = (data: VProductMovementDto[], title: string) => {
        setDrillDownData(data);
        setDrillDownTitle(title);
        setIsDrillDownOpen(true);
    };

    // NEW: Quick Range Date Math
    const handleQuickRange = (range: string) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (range) {
            case "today":
                break;
            case "yesterday":
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case "last7":
                start.setDate(today.getDate() - 7);
                break;
            case "last30":
                start.setDate(today.getDate() - 30);
                break;
            case "thisMonth":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "lastMonth":
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }

        // Format to YYYY-MM-DD safely avoiding timezone shifts
        const formatDate = (date: Date) => {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        setFromDate(formatDate(start));
        setToDate(formatDate(end));
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-10">
            <Card className="border-muted bg-card text-card-foreground shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight">Movement Reviewer</CardTitle>
                    <CardDescription>Analyze aggregated product family movements across branches.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row flex-wrap items-end gap-5">

                        {/* Supplier Combobox */}
                        <div className="grid gap-2 flex-1 min-w-[280px]">
                            <Label htmlFor="supplierId" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Supplier
                            </Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between font-normal"
                                        disabled={loadingSuppliers || loading}
                                    >
                                        <span className="truncate">
                                            {supplierId
                                                ? suppliers.find((supplier) => supplier.id === supplierId)?.name
                                                : loadingSuppliers ? "Loading suppliers..." : "Select a supplier..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search suppliers..." />
                                        <CommandList>
                                            <CommandEmpty>No supplier found.</CommandEmpty>
                                            <CommandGroup>
                                                {suppliers.map((supplier) => (
                                                    <CommandItem
                                                        key={supplier.id}
                                                        value={supplier.name}
                                                        onSelect={() => {
                                                            setSupplierId(supplier.id === supplierId ? "" : supplier.id);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", supplierId === supplier.id ? "opacity-100" : "opacity-0")} />
                                                        {supplier.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* NEW: Quick Range Selector */}
                        <div className="grid gap-2 w-full sm:w-[160px]">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Range</Label>
                            <Select onValueChange={handleQuickRange} disabled={loading}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Presets..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="last7">Last 7 Days</SelectItem>
                                    <SelectItem value="last30">Last 30 Days</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="lastMonth">Last Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* From Date */}
                        <div className="grid gap-2 w-full sm:w-[150px]">
                            <Label htmlFor="fromDate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Date</Label>
                            <Input
                                id="fromDate"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                disabled={loading}
                                className="w-full"
                            />
                        </div>

                        {/* To Date */}
                        <div className="grid gap-2 w-full sm:w-[150px]">
                            <Label htmlFor="toDate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Date</Label>
                            <Input
                                id="toDate"
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                disabled={loading}
                                className="w-full"
                            />
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={loading || !supplierId || !fromDate || !toDate}
                            className="w-full sm:w-auto"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                            Generate Report
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {pivotReport && summaryReport && (
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="summary">Summary View</TabsTrigger>
                        <TabsTrigger value="families">By Product Family</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="focus-visible:outline-none focus-visible:ring-0">
                        <MovementSummaryTable report={summaryReport} rawData={rawData} onCellClick={handleCellClick} />
                    </TabsContent>

                    <TabsContent value="families" className="focus-visible:outline-none focus-visible:ring-0">
                        <MovementPivotTable report={pivotReport} rawData={rawData} onCellClick={handleCellClick} />
                    </TabsContent>
                </Tabs>
            )}

            {/* Drill-down Sheet */}
            <MovementDrillDownSheet
                isOpen={isDrillDownOpen}
                onClose={() => setIsDrillDownOpen(false)}
                title={drillDownTitle}
                data={drillDownData}
            />
        </div>
    );
};