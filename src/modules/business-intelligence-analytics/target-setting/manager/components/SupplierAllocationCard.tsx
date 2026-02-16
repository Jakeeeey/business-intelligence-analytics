"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatPeso } from "../utils/format";

type Option = { id: number; label: string };

interface SupplierAllocationCardProps {
    supplierOptions: Option[];
    supervisorOptions: Option[];

    supplierId: number | null;
    onSupplierChange: (id: number) => void;

    supervisorId: number | null;
    onSupervisorChange: (id: number) => void;

    targetAmountInput: string;
    onTargetAmountChange: (val: string) => void;

    onSave: () => void;
    saveDisabled?: boolean;
    loading?: boolean;

    allocatedAmount: number;
    remainingBalance: number;
}

// Helper to format number with commas
const formatInputValue = (val: string) => {
    if (!val) return "";
    const parts = val.split(".");
    // Format integer part only
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

export default function SupplierAllocationCard({
    supplierOptions,
    supervisorOptions,
    supplierId,
    onSupplierChange,
    supervisorId,
    onSupervisorChange,
    targetAmountInput,
    onTargetAmountChange,
    onSave,
    saveDisabled,
    loading,
    allocatedAmount,
    remainingBalance
}: SupplierAllocationCardProps) {

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
                    <CardTitle>Supplier Allocation</CardTitle>
                    <CardDescription>Allocate Division Target to Suppliers.</CardDescription>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">REMAINING</div>
                    <div className={`text-xl font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-primary'}`}>
                        {formatPeso(remainingBalance)}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Supplier */}
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Select Supplier</Label>
                        <Select
                            value={supplierId ? String(supplierId) : ""}
                            onValueChange={(v) => onSupplierChange(Number(v))}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {supplierOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Supervisor */}
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Select Supervisor</Label>
                        <Select
                            value={supervisorId ? String(supervisorId) : ""}
                            onValueChange={(v) => onSupervisorChange(Number(v))}
                            disabled={loading || !supplierId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Supervisor" />
                            </SelectTrigger>
                            <SelectContent>
                                {supervisorOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.label}
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
                            disabled={loading}
                            type="text"
                            inputMode="decimal"
                        />
                    </div>

                    <div className="flex-none">
                        <Button
                            onClick={onSave}
                            disabled={saveDisabled || loading}
                            className="w-full md:w-auto"
                        >
                            Save Allocation
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t mt-4">
                    <span>Allocated: {formatPeso(allocatedAmount)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
