"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { 
    Loader2, Calendar, ChevronRight, Search, Trophy, Users, 
    Filter, ChevronDown, ChevronUp
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

import { fetchSalesmanData } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto } from "../executive-health/types";

// --- CONFIGURATION ---
const SALESMAN_SUPPLIER_TARGETS: Record<string, Record<string, number>> = {
    "SKINTEC": { "Andrei Siapno": 150000, "DEFAULT": 50000 },
    "NABATI FOOD PHILIPPINES INC": { "Andrei Siapno": 1000000, "DEFAULT": 200000 },
    "DEFAULT": { "DEFAULT": 100000 }
};

type MetricType = "amount" | "achievement" | "count";

function SalesmanKPIContent() {
    const searchParams = useSearchParams();
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(searchParams.get("from") || currentMonthStr);
    const [toMonth, setToMonth] = useState(searchParams.get("to") || currentMonthStr);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMetric, setActiveMetric] = useState<MetricType>("amount");
    const [selectedDivision, setSelectedDivision] = useState<string>("All");
    
    // Mobile: Track expanded cards
    const [expandedSalesman, setExpandedSalesman] = useState<string | null>(null);

    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                const data = await fetchSalesmanData(start, end);
                setRawData(data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        load();
    }, [fromMonth, toMonth]);

    const uniqueDivisions = useMemo(() => {
        const divs = new Set<string>();
        rawData.forEach(d => { if (d.divisionName) divs.add(d.divisionName); });
        return ["All", ...Array.from(divs).sort()];
    }, [rawData]);

    const { matrix, salesmen, suppliers, maxAmount, totalsMap, divisionTotal } = useMemo(() => {
        const dataMap = new Map<string, Map<string, { amount: number; count: number; target: number }>>();
        const sTotals = new Map<string, { amount: number; target: number; count: number }>();
        const supTotals = new Map<string, number>();
        const supplierSet = new Set<string>();
        let highAmt = 0;
        let divTotal = 0;

        const start = parseISO(fromMonth + "-01");
        const end = parseISO(toMonth + "-01");
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);

        rawData.forEach(item => {
            if (selectedDivision !== "All" && item.divisionName !== selectedDivision) return;

            const sMan = item.salesmanName || "Unassigned";
            const sPly = item.supplierName || "Other";
            const amount = item.netAmount || 0;

            divTotal += amount;
            supplierSet.add(sPly);
            supTotals.set(sPly, (supTotals.get(sPly) || 0) + amount);

            const supConfig = SALESMAN_SUPPLIER_TARGETS[sPly] || SALESMAN_SUPPLIER_TARGETS["DEFAULT"];
            const baseTarget = supConfig[sMan] || supConfig["DEFAULT"];
            const scaledTarget = baseTarget * months;

            if (!sTotals.has(sMan)) sTotals.set(sMan, { amount: 0, target: 0, count: 0 });
            const sTot = sTotals.get(sMan)!;
            sTot.amount += amount;
            sTot.count += 1;
            
            if (!dataMap.has(sMan)) dataMap.set(sMan, new Map());
            if (!dataMap.get(sMan)!.has(sPly)) {
                sTot.target += scaledTarget;
                dataMap.get(sMan)!.set(sPly, { amount: 0, count: 0, target: scaledTarget });
            }

            const cell = dataMap.get(sMan)!.get(sPly)!;
            cell.amount += amount;
            cell.count += 1;
            
            if (cell.amount > highAmt) highAmt = cell.amount;
        });

        const sortedSalesmen = Array.from(sTotals.entries())
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(e => e[0])
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

        return {
            matrix: dataMap,
            salesmen: sortedSalesmen,
            suppliers: Array.from(supplierSet).sort(),
            maxAmount: highAmt,
            totalsMap: sTotals,
            divisionTotal: divTotal
        };
    }, [rawData, searchTerm, fromMonth, toMonth, selectedDivision]);

    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    const formatShort = (val: number) => {
        const absVal = Math.abs(val);
        if (absVal >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `${(val / 1000).toFixed(0)}k`;
        return val.toFixed(0);
    };

    const getHeatColor = (val: number, target: number) => {
        if (val <= 0) return "bg-muted/10 opacity-20";
        if (activeMetric === "achievement") {
            const percent = (val / (target || 1)) * 100;
            if (percent >= 100) return "bg-emerald-500 text-emerald-950 font-black";
            if (percent >= 50) return "bg-amber-500/80 text-amber-950 font-bold";
            return "bg-destructive/60 text-white";
        }
        const percent = (val / maxAmount) * 100;
        if (percent > 80) return "bg-primary text-primary-foreground font-black";
        if (percent > 40) return "bg-primary/60 text-white";
        return "bg-primary/20 text-primary";
    };

    return (
        <div className="space-y-4 p-2 lg:p-4 bg-background text-foreground min-h-screen">
            {/* --- HEADER --- */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
                            <span>BIA</span> <ChevronRight className="h-3 w-3" /> <span>Performance</span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase italic">Target Matrix</h2>
                    </div>
                </div>

                {/* FILTERS TOOLBAR */}
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50">
                    <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricType)} className="w-full lg:w-auto">
                        <TabsList className="grid w-full lg:w-fit grid-cols-3 h-8">
                            <TabsTrigger value="amount" className="text-xs">Value</TabsTrigger>
                            <TabsTrigger value="achievement" className="text-xs">%</TabsTrigger>
                            <TabsTrigger value="count" className="text-xs">#</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        {/* Division Select */}
                        <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                                <Filter className="h-3 w-3 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Division" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueDivisions.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* Search Box */}
                        <div className="relative w-full sm:w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input placeholder="Search staff..." className="pl-8 h-8 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>

                        {/* --- RESTORED DATE RANGE PICKER --- */}
                        <div className="flex items-center gap-2 border rounded-md px-2 bg-background w-full sm:w-auto h-8">
                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-1">
                                <Input 
                                    type="month" 
                                    value={fromMonth} 
                                    onChange={e => setFromMonth(e.target.value)} 
                                    className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" 
                                />
                                <span className="text-muted-foreground text-[10px]">-</span>
                                <Input 
                                    type="month" 
                                    value={toMonth} 
                                    onChange={e => setToMonth(e.target.value)} 
                                    className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP VIEW (Matrix) --- */}
            <div className="hidden lg:block border rounded-xl shadow-2xl bg-card/30 backdrop-blur-md">
                <div className="overflow-auto w-full h-[calc(100vh-220px)] relative">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="bg-muted/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                            <tr>
                                <th className="sticky left-0 top-0 z-50 bg-background p-3 text-left border-b border-r min-w-[180px] max-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-primary">Personnel</p>
                                </th>
                                <th className="sticky left-[180px] top-0 z-50 bg-background p-3 text-center border-b border-r min-w-[100px] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Total</p>
                                </th>
                                {suppliers.map(sup => (
                                    <th key={sup} className="p-2 border-b border-r bg-muted/20 min-w-[100px] align-bottom">
                                        <div className="h-32 flex items-end justify-center pb-2">
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground -rotate-180 [writing-mode:vertical-lr] whitespace-nowrap">
                                                {sup}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {salesmen.map((man, idx) => {
                                const personalTotal = totalsMap.get(man)!;
                                const totalAchievement = (personalTotal.amount / (personalTotal.target || 1)) * 100;
                                return (
                                    <tr key={man} className="group hover:bg-muted/5">
                                        <td className="sticky left-0 z-40 bg-background p-3 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted/10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}</span>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-xs truncate w-[130px]" title={man}>{man}</span>
                                                    {idx < 3 && <span className="text-[9px] text-yellow-500 font-bold uppercase flex items-center gap-1"><Trophy className="h-3 w-3" /> Top {idx + 1}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="sticky left-[180px] z-40 bg-background p-2 border-r border-b text-center shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] group-hover:bg-muted/10">
                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                <span className="text-xs font-black">{formatShort(personalTotal.amount)}</span>
                                                <Progress value={totalAchievement} className={`h-1.5 w-16 ${totalAchievement >= 100 ? "bg-emerald-900" : "bg-muted"}`} />
                                            </div>
                                        </td>
                                        {suppliers.map(sup => {
                                            const cell = matrix.get(man)?.get(sup);
                                            const amount = cell?.amount || 0;
                                            const target = cell?.target || 0;
                                            let display = "";
                                            if(amount > 0) {
                                                if(activeMetric === "achievement") display = `${((amount/(target||1))*100).toFixed(0)}%`;
                                                else if(activeMetric === "count") display = cell!.count.toString();
                                                else display = formatShort(amount);
                                            }
                                            return (
                                                <td key={sup} className="p-0 border-b border-r h-10">
                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className={`w-full h-full flex items-center justify-center text-[10px] cursor-crosshair transition-all hover:brightness-110 ${getHeatColor(amount, target)}`}>
                                                                    {display}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-zinc-950 border-zinc-800 text-white p-3 shadow-2xl z-50">
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-emerald-400">{sup}</p>
                                                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">{man}</p>
                                                                    <div className="flex justify-between gap-4 text-xs font-mono pt-2 border-t border-white/10">
                                                                        <span>Actual:</span> <span className="font-bold">{formatPHP(amount)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4 text-xs font-mono">
                                                                        <span>Target:</span> <span className="text-zinc-400">{formatPHP(target)}</span>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MOBILE VIEW --- */}
            <div className="lg:hidden space-y-4 pb-20">
                {salesmen.map((man, idx) => {
                    const personalTotal = totalsMap.get(man)!;
                    const achievement = (personalTotal.amount / (personalTotal.target || 1)) * 100;
                    const isOpen = expandedSalesman === man;

                    return (
                        <Card key={man} className={`border ${isOpen ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                            <div className="p-4" onClick={() => setExpandedSalesman(isOpen ? null : man)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-muted-foreground/30">{idx + 1}</Badge>
                                        <div>
                                            <p className="font-bold text-sm">{man}</p>
                                            <p className="text-xs text-muted-foreground">{formatPHP(personalTotal.amount)} Total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={achievement >= 100 ? "default" : "secondary"} className={achievement >= 100 ? "bg-emerald-600" : ""}>
                                            {achievement.toFixed(0)}%
                                        </Badge>
                                    </div>
                                </div>
                                <Progress value={achievement} className="h-1.5 mb-2" />
                                <div className="flex justify-center">
                                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                            </div>

                            {isOpen && (
                                <div className="border-t bg-card/50 p-4 space-y-3 animate-in slide-in-from-top-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Supplier Breakdown</p>
                                    {suppliers.map(sup => {
                                        const val = matrix.get(man)?.get(sup)?.amount || 0;
                                        const tgt = matrix.get(man)?.get(sup)?.target || 0;
                                        if (val === 0 && tgt === 0) return null;
                                        
                                        return (
                                            <div key={sup} className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground truncate w-[60%]">{sup}</span>
                                                <div className="text-right">
                                                    <span className={`font-mono font-medium ${val >= tgt ? "text-emerald-500" : ""}`}>
                                                        {formatShort(val)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block">/ {formatShort(tgt)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default function SalesmanKPIModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <SalesmanKPIContent />
        </Suspense>
    );
}