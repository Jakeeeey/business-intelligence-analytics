"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Loader2, Calendar, ChevronRight, Search, Trophy, Coins, Target as TargetIcon, Hash, Users, User, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { fetchSalesmanData, fetchDynamicTargets, fetchSupervisorMappings } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto, TargetSettingSalesman, SupervisorKPIResponse } from "./types";
import { SalesmanBreakdownModal } from "./components/SalesmanBreakdownModal";
import { CustomerBreakdownModal } from "./components/CustomerBreakdownModal";

type MetricType = "amount" | "achievement" | "count";

function SupervisorKPIContent() {
    const searchParams = useSearchParams();
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(searchParams.get("from") || currentMonthStr);
    const [toMonth, setToMonth] = useState(searchParams.get("to") || currentMonthStr);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMetric, setActiveMetric] = useState<MetricType>("amount");

    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [targets, setTargets] = useState<TargetSettingSalesman[]>([]);
    const [mappings, setMappings] = useState<SupervisorKPIResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter state for drill-down
    const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");

                const [salesData, targetData, mappingData] = await Promise.all([
                    fetchSalesmanData(start, end),
                    fetchDynamicTargets(start, end),
                    fetchSupervisorMappings()
                ]);

                setRawData(salesData);
                setTargets(targetData.salesmanTargets || []);
                setMappings(mappingData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [fromMonth, toMonth]);

    const { matrix, personnel, suppliers, maxAmount, totalsMap, supplierTotals } = useMemo(() => {
        if (!mappings) return { matrix: new Map(), personnel: [], suppliers: [], maxAmount: 0, totalsMap: new Map(), supplierTotals: new Map() };

        const dataMap = new Map<string, Map<string, { amount: number; count: number; target: number; customers: Set<string> }>>();
        const pTotals = new Map<string, { amount: number; target: number; customers: Set<string> }>();
        const supTotals = new Map<string, number>();
        const supplierSet = new Set<string>();

        // Helplers for mapping
        const salesmanToSupervisorId = new Map<number, number>();
        mappings.salesmanMappings.forEach(m => {
            salesmanToSupervisorId.set(m.salesman_id, m.supervisor_per_division_id);
        });

        const supervisorIdToName = new Map<number, string>();
        mappings.supervisors.forEach(s => {
            supervisorIdToName.set(s.id, `${s.supervisor_id.first_name} ${s.supervisor_id.last_name}`);
        });

        let highAmt = 0;
        const start = parseISO(fromMonth + "-01");
        const end = parseISO(toMonth + "-01");

        // 1. Process Actual Sales Data
        rawData.forEach(item => {
            const salesmanId = item.salesmanId;
            const supervisorId = salesmanToSupervisorId.get(salesmanId);

            // If viewing specific supervisor, only process their data
            if (selectedSupervisor) {
                const itemSupervisorName = supervisorId ? supervisorIdToName.get(supervisorId) : "No Assigned Supervisor";
                if (itemSupervisorName !== selectedSupervisor) return;
            }

            const pName = selectedSupervisor
                ? (item.salesmanName || "No Assigned Supervisor")
                : (supervisorId ? (supervisorIdToName.get(supervisorId) || "No Assigned Supervisor") : "No Assigned Supervisor");

            const sPly = item.supplierName || "Other";
            const amount = item.netAmount || 0;

            const cId = String(item.storeName || "");

            supplierSet.add(sPly);
            supTotals.set(sPly, (supTotals.get(sPly) || 0) + amount);

            if (!pTotals.has(pName)) pTotals.set(pName, { amount: 0, target: 0, customers: new Set() });
            const pTot = pTotals.get(pName)!;
            pTot.amount += amount;
            if (cId) pTot.customers.add(cId);

            if (!dataMap.has(pName)) dataMap.set(pName, new Map());
            if (!dataMap.get(pName)!.has(sPly)) {
                dataMap.get(pName)!.set(sPly, { amount: 0, count: 0, target: 0, customers: new Set() });
            }

            const cell = dataMap.get(pName)!.get(sPly)!;
            cell.amount += amount;
            if (cId) cell.customers.add(cId);
            cell.count = cell.customers.size;

            if (cell.amount > highAmt) highAmt = cell.amount;
        });

        // 2. Process Target Data
        targets.forEach(t => {
            const salesmanId = t.salesman_id;
            const supervisorId = salesmanToSupervisorId.get(Number(salesmanId));
            const targetDate = parseISO(t.fiscal_period);

            if (targetDate < start || targetDate > end) return;

            if (selectedSupervisor) {
                const itemSupervisorName = supervisorId ? supervisorIdToName.get(supervisorId) : "No Assigned Supervisor";
                if (itemSupervisorName !== selectedSupervisor) return;
            }

            const pName = selectedSupervisor
                ? (rawData.find(d => Number(d.salesmanId) === Number(salesmanId))?.salesmanName || `Salesman #${salesmanId}`)
                : (supervisorId ? (supervisorIdToName.get(supervisorId) || "No Assigned Supervisor") : "No Assigned Supervisor");

            const sData = rawData.find(d => Number(d.supplierId) === Number(t.supplier_id));
            const sPly = sData?.supplierName || "Other";

            if (!pTotals.has(pName)) pTotals.set(pName, { amount: 0, target: 0, customers: new Set() });
            const pTot = pTotals.get(pName)!;
            pTot.target += (t.target_amount || 0);

            if (!dataMap.has(pName)) dataMap.set(pName, new Map());
            if (!dataMap.get(pName)!.has(sPly)) {
                dataMap.get(pName)!.set(sPly, { amount: 0, count: 0, target: 0, customers: new Set() });
            }
            dataMap.get(pName)!.get(sPly)!.target += (t.target_amount || 0);
        });

        const sortedPersonnel = Array.from(pTotals.entries())
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(e => e[0])
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

        const sortedSuppliers = Array.from(supplierSet).sort((a, b) => {
            return (supTotals.get(b) || 0) - (supTotals.get(a) || 0);
        });

        return {
            matrix: dataMap,
            personnel: sortedPersonnel,
            suppliers: sortedSuppliers,
            maxAmount: highAmt,
            totalsMap: pTotals,
            supplierTotals: supTotals
        };
    }, [rawData, targets, mappings, searchTerm, fromMonth, toMonth, selectedSupervisor]);

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
            const percent = target > 0 ? (val / target) * 100 : 0;
            if (percent >= 100) return "bg-emerald-500 text-emerald-950 font-black";
            if (percent >= 50) return "bg-amber-500/80 text-amber-950 font-bold";
            return "bg-destructive/60 text-white";
        }

        if (activeMetric === "count") {
            // For BAs, we use thresholds that match the typical account counts (e.g. 0-50+)
            if (val >= 25) return "bg-primary text-primary-foreground font-black";
            if (val >= 10) return "bg-primary/70 text-white";
            if (val >= 1) return "bg-primary/30 text-primary";
            return "bg-muted/10 opacity-20";
        }

        const percent = (val / maxAmount) * 100;
        if (percent > 80) return "bg-primary text-primary-foreground font-black";
        if (percent > 40) return "bg-primary/60 text-white";
        return "bg-primary/20 text-primary";
    };

    const [modalData, setModalData] = useState<{ isOpen: boolean; supervisor: string; supplier: string; data: VSalesPerformanceDataDto[]; salesmanTargets: TargetSettingSalesman[] }>({
        isOpen: false,
        supervisor: "",
        supplier: "",
        data: [],
        salesmanTargets: []
    });

    const [customerModalData, setCustomerModalData] = useState<{ isOpen: boolean; salesman: string; supplier: string; data: VSalesPerformanceDataDto[] }>({
        isOpen: false,
        salesman: "",
        supplier: "",
        data: []
    });

    const handleCellClick = (pName: string, supplier: string) => {
        if (selectedSupervisor) {
            // We are already in drill-down mode (viewing individual salesmen)
            // Show customer level breakdown
            const salesmanId = rawData.find(d => d.salesmanName === pName)?.salesmanId;
            const filtered = rawData.filter(d =>
                (d.salesmanName === pName || (salesmanId && d.salesmanId === salesmanId)) &&
                (d.supplierName || "Other") === supplier
            );

            setCustomerModalData({
                isOpen: true,
                salesman: pName,
                supplier,
                data: filtered
            });
            return;
        }

        // Find all salesmen under this supervisor
        const supervisorRecord = mappings?.supervisors.find(s => `${s.supervisor_id.first_name} ${s.supervisor_id.last_name}` === pName);
        if (!supervisorRecord) return;

        const assignedSalesmenIds = mappings?.salesmanMappings
            .filter(m => m.supervisor_per_division_id === supervisorRecord.id)
            .map(m => m.salesman_id) || [];

        const filteredSales = rawData.filter(d =>
            assignedSalesmenIds.includes(d.salesmanId) &&
            (d.supplierName || "Other") === supplier
        );

        const filteredTargets = targets.filter(t =>
            assignedSalesmenIds.includes(Number(t.salesman_id)) &&
            // We need to match supplier ID too. Let's find supplier ID from one of the sales records or mappings.
            // Simplified: filter targets that match any salesman in this team for this supplier.
            rawData.some(d => Number(d.supplierId) === Number(t.supplier_id) && (d.supplierName || "Other") === supplier)
        );

        setModalData({
            isOpen: true,
            supervisor: pName,
            supplier,
            data: filteredSales,
            salesmanTargets: filteredTargets
        });
    };

    if (loading) return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 p-2 bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest">
                        <span>BIA Dashboard</span> <ChevronRight className="h-3 w-3" />
                        <span className="cursor-pointer hover:text-primary" onClick={() => setSelectedSupervisor(null)}>Personnel Matrix</span>
                        {selectedSupervisor && (
                            <>
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-primary font-bold">{selectedSupervisor}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedSupervisor && (
                            <button
                                onClick={() => setSelectedSupervisor(null)}
                                className="p-2 hover:bg-card rounded-full border border-border/40 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                            {selectedSupervisor ? "Salesman Performance" : "Supervisor KPI Map"}
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricType)} className="w-fit">
                        <TabsList className="bg-card border h-10">
                            <TabsTrigger value="amount" className="gap-2"><Coins className="h-4 w-4" /> Value</TabsTrigger>
                            <TabsTrigger value="achievement" className="gap-2"><TargetIcon className="h-4 w-4" /> % Target</TabsTrigger>
                            <TabsTrigger value="count" className="gap-2"><Hash className="h-4 w-4" /> Buying Accounts</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={selectedSupervisor ? "Filter salesmen..." : "Filter supervisors..."} className="pl-10 w-[180px] bg-card h-10 border-muted-foreground/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary">
                                            {selectedSupervisor ? "Personnel" : "Supervisor"}
                                        </p>
                                    </th>
                                    <th className="sticky left-[240px] top-0 z-50 bg-background/95 backdrop-blur-sm p-6 text-center border-b border-r min-w-[140px]">
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500">Overall Achievement</p>
                                    </th>
                                    {suppliers.map(sup => (
                                        <th key={sup} className="p-4 border-b border-r bg-muted/10 min-w-[100px] align-bottom pb-2">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[9px] uppercase font-black text-muted-foreground rotate-180 [writing-mode:vertical-lr] h-32">
                                                    {sup}
                                                </span>
                                                <span className="text-[9px] font-mono font-bold text-primary/70 border-t border-primary/20 pt-1 w-full text-center">
                                                    {formatShort(supplierTotals.get(sup) || 0)}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {personnel.map((pName, idx) => {
                                    const personalTotal = totalsMap.get(pName)!;
                                    const totalAchievement = personalTotal.target > 0 ? (personalTotal.amount / personalTotal.target) * 100 : 0;
                                    const totalCount = personalTotal.customers.size;

                                    return (
                                        <tr key={pName} className="group">
                                            <td
                                                className="sticky left-0 z-40 bg-background/95 backdrop-blur-sm p-4 border-r border-b group-hover:bg-accent transition-all cursor-pointer"
                                                onClick={() => !selectedSupervisor && setSelectedSupervisor(pName)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}</span>
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-sm tracking-tight truncate max-w-[160px] text-foreground">{pName}</p>
                                                        {!selectedSupervisor && <span className="text-[10px] text-primary/60 font-bold uppercase tracking-tighter">Click to drill down</span>}
                                                    </div>
                                                    {idx < 3 && <Trophy className={`h-3 w-3 ${idx === 0 ? "text-yellow-500" : "text-slate-400"}`} />}
                                                </div>
                                            </td>

                                            <td className="sticky left-[240px] z-40 bg-background/95 backdrop-blur-sm p-4 border-r border-b group-hover:bg-accent transition-all">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black">
                                                        <span className="text-emerald-500">{formatShort(personalTotal.amount)}</span>
                                                        <span className="text-primary/60">{totalCount} B.A.</span>
                                                        <span className={totalAchievement >= 100 ? "text-emerald-500" : "text-amber-500"}>{totalAchievement.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="relative">
                                                        <Progress value={Math.min(totalAchievement, 100)} className="h-1" />
                                                    </div>
                                                </div>
                                            </td>

                                            {suppliers.map(sup => {
                                                const cell = matrix.get(pName)?.get(sup);
                                                const amount = cell?.amount || 0;
                                                const target = cell?.target || 0;

                                                let displayVal: string | number = "";
                                                if (amount > 0 || cell?.count > 0) {
                                                    if (activeMetric === "achievement") displayVal = target > 0 ? `${((amount / target) * 100).toFixed(0)}%` : "N/A";
                                                    else if (activeMetric === "count") displayVal = cell?.count || 0;
                                                    else displayVal = formatShort(amount);
                                                }

                                                const heatVal = activeMetric === "count" ? (cell?.count || 0) : amount;

                                                return (
                                                    <td key={`${pName}-${sup}`} className="p-0.5 border-b border-r" onClick={() => handleCellClick(pName, sup)}>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className={`w-full h-12 flex items-center justify-center text-[10px] rounded-[2px] transition-all duration-300 hover:scale-[1.1] hover:z-50 cursor-pointer ${getHeatColor(heatVal, target)}`}>
                                                                        {displayVal}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-black text-white p-4 rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{sup}</p>
                                                                                <p className="text-sm font-bold">{pName}</p>
                                                                            </div>
                                                                            {target > 0 && (
                                                                                <Badge variant={amount >= target ? "default" : "destructive"}>
                                                                                    {amount >= target ? "HIT" : "MISS"}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-2">
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Team Sales</p>
                                                                                <p className="text-xs font-mono font-bold">{formatPHP(amount)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Buying A/C</p>
                                                                                <p className="text-xs font-mono font-bold text-blue-400">{cell?.count || 0}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Quota</p>
                                                                                <p className="text-xs font-mono font-bold text-emerald-400">
                                                                                    {target > 0 ? formatPHP(target) : "No target"}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {!selectedSupervisor && (
                                                                            <div className="mt-2 text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                                                <Search className="h-3 w-3" /> Click to view team breakdown
                                                                            </div>
                                                                        )}
                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                                <span>ACHIEVEMENT</span>
                                                                                <span>{target > 0 ? ((amount / target) * 100).toFixed(1) : 0}%</span>
                                                                            </div>
                                                                            <Progress value={Math.min(target > 0 ? (amount / target) * 100 : 0, 100)} className="h-1" />
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

            <SalesmanBreakdownModal
                isOpen={modalData.isOpen}
                onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
                data={modalData.data}
                targets={modalData.salesmanTargets}
                supervisorName={modalData.supervisor}
                supplierName={modalData.supplier}
                periodLabel={`${fromMonth} to ${toMonth}`}
            />

            <CustomerBreakdownModal
                isOpen={customerModalData.isOpen}
                onClose={() => setCustomerModalData(prev => ({ ...prev, isOpen: false }))}
                data={customerModalData.data}
                salesmanName={customerModalData.salesman}
                supplierName={customerModalData.supplier}
                periodLabel={`${fromMonth} to ${toMonth}`}
            />
        </div>
    );
}

export default function SupervisorKPIModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <SupervisorKPIContent />
        </Suspense>
    );
}
