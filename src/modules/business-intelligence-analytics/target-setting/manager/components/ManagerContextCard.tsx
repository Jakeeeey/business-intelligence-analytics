//src/modules/business-intelligence-analytics/target-setting/manager/components/ManagerContextCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatPeso } from "../utils/format";

type Option = { id: number; label: string };

interface ManagerContextCardProps {
    fiscalOptions: Option[];
    divisionOptions: Option[];

    fiscalId: number | null;
    onFiscalChange: (id: number) => void;

    divisionTsdId: number | null;
    onDivisionChange: (id: number) => void;

    loading?: boolean;
    totalDivisionsTarget: string;
}

export default function ManagerContextCard({
    fiscalOptions,
    divisionOptions,
    fiscalId,
    onFiscalChange,
    divisionTsdId,
    onDivisionChange,
    loading,
    totalDivisionsTarget
}: ManagerContextCardProps) {

    // Current division target amount (if selected)
    const currentDivisionTarget = divisionOptions.find(d => d.id === divisionTsdId)?.label.match(/Target: (₱[\d,.]+)/)?.[1] || "—";

    return (
        <Card className="w-full relative overflow-hidden h-full">
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle>Manager: Division Context</CardTitle>
                    <CardDescription>Select Fiscal Period and Division to view target.</CardDescription>
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
                        <SearchableSelect
                            value={fiscalId ? String(fiscalId) : ""}
                            onValueChange={(v) => onFiscalChange(Number(v))}
                            options={fiscalOptions.map((opt) => ({ value: String(opt.id), label: opt.label }))}
                            placeholder="Select Period"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Division</Label>
                        <SearchableSelect
                            value={divisionTsdId ? String(divisionTsdId) : ""}
                            onValueChange={(v) => onDivisionChange(Number(v))}
                            options={divisionOptions.map((opt) => ({ value: String(opt.id), label: opt.label }))}
                            placeholder="Select Division"
                            disabled={loading || !fiscalId}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t mt-4">
                    <span>Total Divisions Target: <span className="font-semibold text-gray-700">{totalDivisionsTarget}</span></span>
                </div>
            </CardContent>
        </Card>
    );
}
