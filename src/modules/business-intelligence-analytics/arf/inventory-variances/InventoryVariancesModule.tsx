"use client";

import React, { useState, useMemo } from "react";
import { useInventoryVariances } from "./hooks/useInventoryVariances";
import { InventoryVarianceKpis } from "./components/InventoryVarianceKpis";
import { InventoryVarianceTable } from "./components/InventoryVarianceTable";
import { BranchRiskChart } from "./components/BranchRiskChart";
import { CategoryVarianceChart } from "./components/CategoryVarianceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CalendarDays, FilterX, History } from "lucide-react";
import { format, subYears, startOfYear } from "date-fns";

const RISK_CONFIG = {
    CRITICAL_COST_THRESHOLD: 5000,
    MIN_ACCURACY_THRESHOLD: 95,
};

export const InventoryVariancesModule = () => {
    const [startDate, setStartDate] = useState<string>("2024-01-01");
    const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

    // NEW: View Mode Toggle State
    const [viewMode, setViewMode] = useState<'loss' | 'surplus'>('loss');

    const { data, loading, error } = useInventoryVariances(startDate, endDate);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

    const handleRangeChange = (type: 'all' | 'year' | 'month') => {
        const now = new Date();
        setEndDate(format(now, "yyyy-MM-dd"));

        if (type === 'all') setStartDate("2024-01-01");
        if (type === 'year') setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
        if (type === 'month') setStartDate(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
    };

    const filteredLedger = useMemo(() => {
        const ledger = data?.ledger || [];
        if (!selectedBranch) return ledger;
        return ledger.filter(item => item.branchName === selectedBranch);
    }, [selectedBranch, data]);

    // NEW: Includes System Total items to calculate true Accuracy %
    const kpiStats = useMemo(() => {
        let shortage = 0; let overage = 0;
        let totalSystemItems = 0; let absoluteVarianceItems = 0;

        filteredLedger.forEach(item => {
            const cost = Number(item.differenceCost) || 0;
            if (cost < 0) shortage += cost;
            else overage += cost;

            totalSystemItems += Number(item.systemCount) || 0;
            absoluteVarianceItems += Math.abs(Number(item.variance) || 0);
        });

        // Prevent division by zero. Cap at 100%, floor at 0%.
        const accuracy = totalSystemItems === 0 ? 0 : Math.max(0, (1 - (absoluteVarianceItems / totalSystemItems)) * 100);

        return {
            totalShortage: shortage,
            totalOverage: overage,
            netTotal: shortage + overage,
            totalItems: absoluteVarianceItems,
            recordCount: filteredLedger.length,
            accuracyScore: accuracy
        };
    }, [filteredLedger]);

    const categoryRiskData = useMemo(() => {
        const catMap = new Map<string, number>();
        filteredLedger.forEach(item => {
            const cost = Number(item.differenceCost) || 0;
            // Align Donut Chart with the View Mode
            if ((viewMode === 'loss' && cost < 0) || (viewMode === 'surplus' && cost > 0)) {
                const cat = item.categoryName || "Uncategorized";
                catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(cost));
            }
        });
        return Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [filteredLedger, viewMode]);

    // NEW: Branch Chart respects the Toggle
    const dynamicBranchRisk = useMemo(() => {
        if (!data?.ledger) return [];
        const branchMap = new Map<string, number>();

        data.ledger.forEach(item => {
            const cost = Number(item.differenceCost) || 0;
            if (viewMode === 'loss' && cost < 0) {
                const branch = item.branchName || "Unknown Branch";
                branchMap.set(branch, (branchMap.get(branch) || 0) + cost);
            } else if (viewMode === 'surplus' && cost > 0) {
                const branch = item.branchName || "Unknown Branch";
                branchMap.set(branch, (branchMap.get(branch) || 0) + cost);
            }
        });

        return Array.from(branchMap.entries())
            .map(([label, value]) => ({ label, value }))
            // Losses sort ascending (most negative first), Surpluses sort descending (most positive first)
            .sort((a, b) => viewMode === 'loss' ? a.value - b.value : b.value - a.value);
    }, [data?.ledger, viewMode]);

    if (error) return <div className="p-8 text-center border-2 border-dashed rounded-xl text-red-500 bg-red-50">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary"><CalendarDays className="h-5 w-5" /></div>
                    <div>
                        <h2 className="text-sm font-bold">Analysis Period</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Syncing with VOS Server</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border text-xs font-mono">
                        <input type="date" className="bg-transparent outline-none cursor-pointer" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <span className="text-muted-foreground">—</span>
                        <input type="date" className="bg-transparent outline-none cursor-pointer" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => handleRangeChange('all')}><History className="h-3 w-3 mr-1" /> All Time</Button>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => handleRangeChange('year')}>This Year</Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[120px] w-full rounded-2xl" />
                    <div className="grid lg:grid-cols-12 gap-4 h-[400px]"><Skeleton className="lg:col-span-6 rounded-2xl" /><Skeleton className="lg:col-span-3 rounded-2xl" /><Skeleton className="lg:col-span-3 rounded-2xl" /></div>
                </div>
            ) : (
                <>
                    <InventoryVarianceKpis {...kpiStats} />

                    <div className="grid gap-4 lg:grid-cols-12 lg:h-[400px]">

                        {/* CHART WITH TOGGLE */}
                        <div className="lg:col-span-6 h-full flex flex-col rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b shrink-0">
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight text-foreground">Branch Financial Risk</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost impact across locations</p>
                                </div>
                                {/* NEW TOGGLE BUTTONS */}
                                <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border">
                                    <button onClick={() => setViewMode('loss')} className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${viewMode === 'loss' ? 'bg-background shadow-sm text-rose-500 ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}>Shortages</button>
                                    <button onClick={() => setViewMode('surplus')} className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${viewMode === 'surplus' ? 'bg-background shadow-sm text-emerald-500 ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}>Surpluses</button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <BranchRiskChart data={dynamicBranchRisk} onBranchSelect={setSelectedBranch} selectedBranch={selectedBranch} />
                            </div>
                        </div>

                        <div className="lg:col-span-3 h-full">
                            <CategoryVarianceChart data={categoryRiskData} />
                        </div>

                        <div className="lg:col-span-3 h-full rounded-xl border bg-card p-4 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b shrink-0">
                                <h3 className="font-bold text-xs uppercase text-muted-foreground italic tracking-tight">Top 5 SKU Details</h3>
                                {selectedBranch && <Button variant="ghost" size="sm" onClick={() => setSelectedBranch(null)} className="h-6 text-[10px] px-2"><FilterX className="h-3 w-3 mr-1" />Clear</Button>}
                            </div>
                            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                {filteredLedger.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center pb-2 border-b border-border/40 last:border-0">
                                        <div className="flex flex-col max-w-[70%]">
                                            <span className="text-xs font-semibold truncate uppercase italic leading-tight" title={item.familyName}>{item.familyName}</span>
                                            <span className="text-[9px] text-muted-foreground">{item.categoryName} • {item.auditDate ? format(new Date(item.auditDate), "MMM d") : "-"}</span>
                                        </div>
                                        <span className={`text-xs font-mono font-bold tracking-tighter ${Number(item.differenceCost) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            ₱{Math.abs(item.differenceCost || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <InventoryVarianceTable data={filteredLedger} criticalCost={RISK_CONFIG.CRITICAL_COST_THRESHOLD} minAccuracy={RISK_CONFIG.MIN_ACCURACY_THRESHOLD} />
                </>
            )}
        </div>
    );
};