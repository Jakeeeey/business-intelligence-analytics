"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { moneyPHP, monthLabel } from "../utils/format";

type SupplierOption = { id: number; label: string; target_amount: number };

interface SupervisorContextCardProps {
    fiscalOptions: string[];
    supplierOptions: SupplierOption[];

    fiscalPeriod: string;
    onFiscalChange: (v: string) => void;

    supplierId: number | null;
    onSupplierChange: (v: number) => void;

    loading?: boolean;
    supplierTargetAmount: number;
}

export default function SupervisorContextCard({
    fiscalOptions,
    supplierOptions,
    fiscalPeriod,
    onFiscalChange,
    supplierId,
    onSupplierChange,
    loading,
    supplierTargetAmount
}: SupervisorContextCardProps) {

    return (
        <Card className="w-full relative overflow-hidden h-full">
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle>Supervisor: Supplier Context</CardTitle>
                    <CardDescription>Select Fiscal Period and Supplier to view target.</CardDescription>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Context Status</div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 mt-1">Active</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Fiscal Period</Label>
                        <Select
                            value={fiscalPeriod || ""}
                            onValueChange={onFiscalChange}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Period">
                                    {fiscalPeriod ? monthLabel(fiscalPeriod) : "Select Period"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {fiscalOptions.map((fp) => (
                                    <SelectItem key={fp} value={fp}>
                                        {monthLabel(fp)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Supplier</Label>
                        <Select
                            value={supplierId ? String(supplierId) : ""}
                            onValueChange={(v) => onSupplierChange(Number(v))}
                            disabled={loading || !fiscalPeriod}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {supplierOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.label} (Target: {moneyPHP(opt.target_amount)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t mt-4">
                    <span>Supplier Target: <span className="font-semibold text-gray-700">{moneyPHP(supplierTargetAmount)}</span></span>
                </div>
            </CardContent>
        </Card>
    );
}
