"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Loader2, Calendar, ChevronRight, Search, Trophy, Coins, Target as TargetIcon, Hash } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { fetchSalesmanData, fetchDynamicTargets } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto } from "../executive-health/types";
import { TargetSettingSalesman } from "./types";


type MetricType = "amount" | "achievement" | "count";

function SalesmanKPIContent() {
    const searchParams = useSearchParams();
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(searchParams.get("from") || currentMonthStr);
    const [toMonth, setToMonth] = useState(searchParams.get("to") || currentMonthStr);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMetric, setActiveMetric] = useState<MetricType>("amount");
    
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [targets, setTargets] = useState<TargetSettingSalesman[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                
                const [salesData, targetData] = await Promise.all([
                    fetchSalesmanData(start, end),
                    fetchDynamicTargets(start, end)
                ]);

                setRawData(salesData);
                setTargets(targetData.salesmanTargets || []);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        load();
    }, [fromMonth, toMonth]);

    const { matrix, salesmen, suppliers, maxAmount, totalsMap, supplierTotals } = useMemo(() => {
        const dataMap = new Map<string, Map<string, { amount: number; count: number; target: number }>>();
        const sTotals = new Map<string, { amount: number; target: number; count: number }>();
        const supTotals = new Map<string, number>();
        const supplierSet = new Set<string>();
        let highAmt = 0;

        const start = parseISO(fromMonth + "-01");
        const end = parseISO(toMonth + "-01");
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);

        rawData.forEach(item => {
            const sMan = item.salesmanName || "Unassigned";
            const sPly = item.supplierName || "Other";
            const amount = item.netAmount || 0;

            supplierSet.add(sPly);
            supTotals.set(sPly, (supTotals.get(sPly) || 0) + amount);

            const salesmanId = item.salesmanId;
            const supplierId = item.supplierId;

            // Get Target Configuration from dynamic targets
            const relevantTargets = targets.filter(t => {
                const targetDate = parseISO(t.fiscal_period);
                return (
                    t.salesman_id === salesmanId && 
                    t.supplier_id === supplierId &&
                    targetDate >= start && 
                    targetDate <= end
                );
            });
            const scaledTarget = relevantTargets.reduce((sum, t) => sum + (t.target_amount || 0), 0);

            // Individual Totals logic
            if (!sTotals.has(sMan)) sTotals.set(sMan, { amount: 0, target: 0, count: 0 });
            const sTot = sTotals.get(sMan)!;
            sTot.amount += amount;
            sTot.count += 1;
            
            // Logic: Only add to target once per salesman/supplier pairing
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
            supplierTotals: supTotals
        };
    }, [rawData, searchTerm, fromMonth, toMonth]);

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
            const percent = (val / target) * 100;
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
        <div className="space-y-6 p-2 bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest">
                        <span>BIA Dashboard</span> <ChevronRight className="h-3 w-3" /> <span>Personnel Matrix</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic">Target Achievement Map</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricType)} className="w-fit">
                        <TabsList className="bg-card border h-10">
                            <TabsTrigger value="amount" className="gap-2"><Coins className="h-4 w-4" /> Value</TabsTrigger>
                            <TabsTrigger value="achievement" className="gap-2"><TargetIcon className="h-4 w-4" /> % Target</TabsTrigger>
                            <TabsTrigger value="count" className="gap-2"><Hash className="h-4 w-4" /> Count</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Filter staff..." className="pl-10 w-[180px] bg-card h-10 border-muted-foreground/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 h-10 shadow-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-[130px] border-none bg-transparent focus-visible:ring-0 text-xs font-bold" />
                        <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-[130px] border-none bg-transparent focus-visible:ring-0 text-xs font-bold" />
                    </div>
                </div>
            </div>

            {/* --- THE MATRIX --- */}
            <Card className="border-muted/40 shadow-2xl bg-card/30 backdrop-blur-md overflow-hidden">
                <ScrollArea className="w-full">
                    <div className="min-w-max">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-muted/20">
                                    <th className="sticky left-0 top-0 z-50 bg-background/95 backdrop-blur-sm p-6 text-left border-b border-r min-w-[240px]">
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary">Personnel</p>
                                    </th>
                                    <th className="sticky left-[240px] top-0 z-50 bg-background/95 backdrop-blur-sm p-6 text-center border-b border-r min-w-[140px]">
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500">Overall Cap</p>
                                    </th>
                                    {suppliers.map(sup => (
                                        <th key={sup} className="p-4 border-b border-r bg-muted/10 min-w-[100px]">
                                            <span className="text-[9px] uppercase font-black text-muted-foreground rotate-180 [writing-mode:vertical-lr] h-32 py-2">
                                                {sup}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {salesmen.map((man, idx) => {
                                    const personalTotal = totalsMap.get(man)!;
                                    const totalAchievement = (personalTotal.amount / personalTotal.target) * 100;

                                    return (
                                        <tr key={man} className="group">
                                            <td className="sticky left-0 z-40 bg-background/95 backdrop-blur-sm p-4 border-r border-b group-hover:bg-accent transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}</span>
                                                    <p className="font-bold text-sm tracking-tight truncate max-w-[160px] text-foreground">{man}</p>
                                                    {idx < 3 && <Trophy className={`h-3 w-3 ${idx === 0 ? "text-yellow-500" : "text-slate-400"}`} />}
                                                </div>
                                            </td>
                                            
                                            <td className="sticky left-[240px] z-40 bg-background/95 backdrop-blur-sm p-4 border-r border-b group-hover:bg-accent transition-all">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black">
                                                        <span className="text-emerald-500">{formatShort(personalTotal.amount)}</span>
                                                        <span className={totalAchievement >= 100 ? "text-emerald-500" : "text-amber-500"}>{totalAchievement.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="relative">
                                                        <Progress value={Math.min(totalAchievement, 100)} className="h-1" />
                                                        {personalTotal.target > 0 && (
                                                            <div 
                                                                className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
                                                                style={{ left: '100%' }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {suppliers.map(sup => {
                                                const cell = matrix.get(man)?.get(sup);
                                                const amount = cell?.amount || 0;
                                                const target = cell?.target || 0;
                                                
                                                // Value to display inside the cell
                                                let displayVal = "";
                                                if (amount > 0) {
                                                    if (activeMetric === "achievement") displayVal = `${((amount/target)*100).toFixed(0)}%`;
                                                    else if (activeMetric === "count") displayVal = cell!.count.toString();
                                                    else displayVal = formatShort(amount);
                                                }

                                                return (
                                                    <td key={`${man}-${sup}`} className="p-0.5 border-b border-r">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className={`w-full h-12 flex items-center justify-center text-[10px] rounded-[2px] transition-all duration-300 hover:scale-[1.1] hover:z-50 cursor-crosshair ${getHeatColor(amount, target)}`}>
                                                                        {displayVal}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-black text-white p-4 rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{sup}</p>
                                                                                <p className="text-sm font-bold">{man}</p>
                                                                            </div>
                                                                            <Badge variant={amount >= target ? "default" : "destructive"}>
                                                                                {amount >= target ? "HIT" : "MISS"}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-2">
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Actual Sales</p>
                                                                                <p className="text-sm font-mono font-bold">{formatPHP(amount)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Quota</p>
                                                                                <p className="text-sm font-mono font-bold text-emerald-400">{formatPHP(target)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                                <span>ACHIEVEMENT</span>
                                                                                <span>{((amount/target)*100).toFixed(1)}%</span>
                                                                            </div>
                                                                            <div className="relative">
                                                                                <Progress value={Math.min((amount/target)*100, 100)} className="h-1" />
                                                                                {target > 0 && (
                                                                                    <div 
                                                                                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10"
                                                                                        style={{ left: '100%' }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </Card>
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