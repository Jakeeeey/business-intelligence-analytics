"use client";

import React, {useState, useMemo} from "react";
import {useInventoryVariances} from "./hooks/useInventoryVariances";
import {InventoryVarianceKpis} from "./components/InventoryVarianceKpis";
import {InventoryVarianceTable} from "./components/InventoryVarianceTable";
import {BranchRiskChart} from "./components/BranchRiskChart";
import {CategoryVarianceChart} from "./components/CategoryVarianceChart";
import {Skeleton} from "@/components/ui/skeleton";
import {Button} from "@/components/ui/button";
import {FilterX, Activity} from "lucide-react"; // Swapped Calendar for Activity icon
import {format} from "date-fns";

const RISK_CONFIG = {
    CRITICAL_COST_THRESHOLD: 5000,
    MIN_ACCURACY_THRESHOLD: 95,
};

export const InventoryVariancesModule = () => {
    // View Mode & Filters
    const [viewMode, setViewMode] = useState<'loss' | 'surplus'>('loss');
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

    // Fetch data WITHOUT dates since the SQL view now handles the "Latest Snapshot" natively
    const {data, loading, error} = useInventoryVariances();

    // Extract unique suppliers for the dropdown
    const uniqueSuppliers = useMemo(() => {
        if (!data?.ledger) return [];
        const suppliers = new Set(data.ledger.map(item => item.supplierName).filter(Boolean));
        return Array.from(suppliers).sort();
    }, [data?.ledger]);

    // Apply BOTH Branch and Supplier filters
    const filteredLedger = useMemo(() => {
        let ledger = data?.ledger || [];
        if (selectedBranch) {
            ledger = ledger.filter(item => item.branchName === selectedBranch);
        }
        if (selectedSupplier) {
            ledger = ledger.filter(item => item.supplierName === selectedSupplier);
        }
        return ledger;
    }, [selectedBranch, selectedSupplier, data]);

    // Accuracy Math
    const kpiStats = useMemo(() => {
        let shortage = 0;
        let overage = 0;
        let totalSystemItems = 0;
        let totalPhysicalItems = 0;
        let absoluteVarianceItems = 0;

        filteredLedger.forEach(item => {
            const cost = Number(item.differenceCost) || 0;
            if (cost < 0) shortage += cost;
            else overage += cost;

            totalSystemItems += Number(item.systemCount) || 0;
            totalPhysicalItems += Number(item.physicalCount) || 0;
            absoluteVarianceItems += Math.abs(Number(item.variance) || 0);
        });

        const baseForAccuracy = Math.max(totalSystemItems, totalPhysicalItems);
        const accuracy = baseForAccuracy === 0 ? 100 : Math.max(0, (1 - (absoluteVarianceItems / baseForAccuracy)) * 100);

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
            if ((viewMode === 'loss' && cost < 0) || (viewMode === 'surplus' && cost > 0)) {
                const cat = item.categoryName || "Uncategorized";
                catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(cost));
            }
        });
        return Array.from(catMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [filteredLedger, viewMode]);

    const dynamicBranchRisk = useMemo(() => {
        if (!data?.ledger) return [];
        const branchMap = new Map<string, number>();

        // Ensure we only loop over items that match the current Supplier filter
        const baseLedger = selectedSupplier ? data.ledger.filter(i => i.supplierName === selectedSupplier) : data.ledger;

        baseLedger.forEach(item => {
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
            .map(([label, value]) => ({label, value}))
            .sort((a, b) => viewMode === 'loss' ? a.value - b.value : b.value - a.value);
    }, [data?.ledger, viewMode, selectedSupplier]);

    if (error) return <div
        className="p-8 text-center border-2 border-dashed rounded-xl text-red-500 bg-red-50">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div
                className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary"><Activity className="h-5 w-5"/></div>
                    <div>
                        <h2 className="text-sm font-bold">Live Inventory Status</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latest physical counts
                            from VOS</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">

                    {/* Supplier Dropdown - Now the main global filter */}
                    <div
                        className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border text-xs font-mono">
                        <select
                            className="bg-transparent outline-none cursor-pointer text-xs uppercase w-[180px] truncate"
                            value={selectedSupplier || ""}
                            onChange={(e) => {
                                setSelectedSupplier(e.target.value || null);
                                setSelectedBranch(null); // Clear branch filter if supplier changes
                            }}
                        >
                            <option value="">All Suppliers</option>
                            {uniqueSuppliers.map(supplier => (
                                <option key={supplier} value={supplier}>{supplier}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[120px] w-full rounded-2xl"/>
                    <div className="grid lg:grid-cols-12 gap-4 h-[400px]"><Skeleton
                        className="lg:col-span-6 rounded-2xl"/><Skeleton
                        className="lg:col-span-3 rounded-2xl"/><Skeleton className="lg:col-span-3 rounded-2xl"/></div>
                </div>
            ) : (
                <>
                    <InventoryVarianceKpis {...kpiStats} supplierName={selectedSupplier}/>

                    <div className="grid gap-4 lg:grid-cols-12 lg:h-[400px]">

                        {/* CHART WITH TOGGLE */}
                        <div className="lg:col-span-6 h-full flex flex-col rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b shrink-0">
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight text-foreground">Branch Financial
                                        Risk</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current
                                        cost impact across locations</p>
                                </div>
                                <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border">
                                    <button onClick={() => setViewMode('loss')}
                                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${viewMode === 'loss' ? 'bg-background shadow-sm text-rose-500 ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}>Shortages
                                    </button>
                                    <button onClick={() => setViewMode('surplus')}
                                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${viewMode === 'surplus' ? 'bg-background shadow-sm text-emerald-500 ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}>Surpluses
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full">
                                <BranchRiskChart data={dynamicBranchRisk} onBranchSelect={setSelectedBranch}
                                                 selectedBranch={selectedBranch}/>
                            </div>
                        </div>

                        <div className="lg:col-span-3 h-full">
                            <CategoryVarianceChart data={categoryRiskData}/>
                        </div>

                        {/* TOP 5 LIST */}
                        <div
                            className="lg:col-span-3 h-full rounded-xl border bg-card p-4 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b shrink-0">
                                <h3 className="font-bold text-xs uppercase text-muted-foreground italic tracking-tight">Top
                                    5 SKU Details</h3>
                                {selectedBranch &&
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedBranch(null)}
                                            className="h-6 text-[10px] px-2"><FilterX
                                        className="h-3 w-3 mr-1"/>Clear</Button>}
                            </div>
                            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                {filteredLedger.slice(0, 5).length === 0 ? (
                                    <div
                                        className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic text-center">
                                        No data found for this selection.
                                    </div>
                                ) : (
                                    filteredLedger.slice(0, 5).map((item, i) => {
                                        const cost = Number(item.differenceCost) || 0;
                                        return (
                                            <div key={i}
                                                 className="flex justify-between items-center pb-2 border-b border-border/40 last:border-0 gap-3">
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span
                                                        className="text-xs font-semibold truncate uppercase italic leading-tight"
                                                        title={item.familyName}>
                                                        {item.familyName}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground truncate">
                                                        {item.categoryName} • {item.auditDate ? format(new Date(item.auditDate), "MMM d, yyyy") : "-"}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-xs font-mono font-bold tracking-tighter shrink-0 ${cost < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    ₱{Math.abs(cost).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <InventoryVarianceTable data={filteredLedger} criticalCost={RISK_CONFIG.CRITICAL_COST_THRESHOLD}
                                            minAccuracy={RISK_CONFIG.MIN_ACCURACY_THRESHOLD}/>
                </>
            )}
        </div>
    );
};