"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { moneyPHP } from "../utils/format";
import type { SalesmanRow } from "../types";

interface SalesmanAllocationCardProps {
    salesmen: SalesmanRow[];

    salesmanId: number | null;
    onSalesmanChange: (id: number) => void;

    targetAmountInput: string;
    onTargetAmountChange: (val: string) => void;

    onSave: () => void;
    saveDisabled?: boolean;
    loading?: boolean;

    allocatedAmount: number;
    remainingBalance: number;

    supplierSelected: boolean;
}

// Helper to format number with commas
const formatInputValue = (val: string) => {
    if (!val) return "";
    const parts = val.split(".");
    // Format integer part only
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

export default function SalesmanAllocationCard({
    salesmen,
    salesmanId,
    onSalesmanChange,
    targetAmountInput,
    onTargetAmountChange,
    onSave,
    saveDisabled,
    loading,
    allocatedAmount,
    remainingBalance,
    supplierSelected
}: SalesmanAllocationCardProps) {

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove commas to get raw value
        const rawValue = e.target.value.replace(/,/g, "");
        // Allow only numbers and one decimal point
        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
            onTargetAmountChange(rawValue);
        }
    };

    return (
        <Card className="w-full relative overflow-hidden h-full">
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle>Salesman Allocation</CardTitle>
                    <CardDescription>Allocate Supplier Target to Salesmen.</CardDescription>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">REMAINING</div>
                    <div className={`text-xl font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-primary'}`}>
                        {moneyPHP(remainingBalance)}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Salesman */}
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Select Salesman</Label>
                        <Select
                            value={salesmanId ? String(salesmanId) : ""}
                            onValueChange={(v) => onSalesmanChange(Number(v))}
                            disabled={loading || !supplierSelected}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Salesman" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesmen.map((opt) => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.salesman_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Share Amount</Label>
                        <Input
                            placeholder="0.00"
                            value={formatInputValue(targetAmountInput)}
                            onChange={handleAmountChange}
                            disabled={loading || !supplierSelected}
                            type="text"
                            inputMode="decimal"
                        />
                    </div>

                    <div className="flex-none">
                        <Button
                            onClick={onSave}
                            disabled={saveDisabled || loading || !supplierSelected}
                            className="w-full md:w-auto"
                        >
                            Save Allocation
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t mt-4">
                    <span>Allocated: {moneyPHP(allocatedAmount)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
