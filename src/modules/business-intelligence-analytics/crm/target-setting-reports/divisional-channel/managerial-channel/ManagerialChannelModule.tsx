"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ComposedChart, Scatter
} from 'recharts';
import {
    Filter, Loader2, Calendar, ChevronRight, User2, ArrowLeft, LayoutDashboard, Trophy, Coins, TrendingUp, TrendingDown, AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchManagerialData, fetchDynamicTargets, fetchCustomerTargets } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto } from "./types";
import { BreakdownAnalysisModal } from "./components/BreakdownAnalysisModal";

function ManagerialSupplierContent() {
    const searchParams = useSearchParams();
    const currentYear = new Date().getFullYear();

    const [fromMonth, setFromMonth] = useState(searchParams.get("from") || `${currentYear}-01`);
    const [toMonth, setToMonth] = useState(searchParams.get("to") || format(new Date(), "yyyy-MM"));
    const [selectedDivision, setSelectedDivision] = useState<string>((searchParams.get("division") || "DRY GOODS").toUpperCase());

    // Sync state with URL params — only re-run when the URL itself changes, not on local state changes
    useEffect(() => {
        const divParam = searchParams.get("division");
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        const timer = setTimeout(() => {
            if (divParam) setSelectedDivision(divParam.toUpperCase());
            if (fromParam) setFromMonth(fromParam);
            if (toParam) setToMonth(toParam);
        }, 0);

        return () => clearTimeout(timer);
    }, [searchParams]);

    // Drill-down State
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    type TargetItem = { fiscal_period: string; supplier_id?: number; salesman_id?: number; target_amount?: number; };
    const [targets, setTargets] = useState<{ supplierTargets: TargetItem[], salesmanTargets: TargetItem[] }>({ supplierTargets: [], salesmanTargets: [] });

    // Store Type Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const salesmanDetailData = useMemo(() => {
        if (!selectedChannel) return [];
        return rawData.filter(d =>
            (d.storeTypeLabel || "Unknown Store Type").toUpperCase() === (selectedChannel || "").toUpperCase() &&
            (d.divisionName || "").toUpperCase() === (selectedDivision || "").toUpperCase()
        );
    }, [rawData, selectedChannel, selectedDivision]);

    const [channelTargets, setChannelTargets] = useState<Record<string, number>>({});

    // Fetch Channel (Store Type) targets for the Division
    useEffect(() => {
        const loadTargets = async () => {
            const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
            const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
            
            const filtered = rawData.filter(d => 
                (d.divisionName || "").toUpperCase() === selectedDivision.toUpperCase()
            );
            const salesmanIds = Array.from(new Set(filtered.map(d => d.salesmanId).filter(Boolean))) as number[];
            if (salesmanIds.length === 0) {
                setChannelTargets({});
                return;
            }

            const uniqueStoreTypes = Array.from(new Set(filtered.map(d => d.storeTypeLabel || "Unknown Store Type"))) as string[];

            try {
                const res = await fetchCustomerTargets(salesmanIds, start, end, 'storeType', uniqueStoreTypes);
                setChannelTargets(res || {});
            } catch (e) {
                console.error(e);
            }
        };
        loadTargets();
    }, [rawData, fromMonth, toMonth, selectedDivision]);

    // 1. Fetch Data
    useEffect(() => {
        const load = async () => {
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");

                const data = await fetchManagerialData(start, end);
                setRawData(data);

                // Scope targets to selected division
                const divItem = data.find(d => (d.divisionName || "").toUpperCase() === (selectedDivision || "").toUpperCase());
                const targetData = await fetchDynamicTargets(start, end, divItem?.divisionId);
                setTargets({
                    supplierTargets: (targetData.supplierTargets as TargetItem[]) || [], 
                    salesmanTargets: (targetData.salesmanTargets as TargetItem[]) || []
                });
            } catch (err) { console.error(err); }
        };
        load();
    }, [fromMonth, toMonth, selectedDivision]);

    const divisions = useMemo(() => Array.from(new Set(rawData.map(d => (d.divisionName || "").toUpperCase()))).sort(), [rawData]);

    // 2. Data Processing for Channels (Level 1)
    const { channelPerformance, divisionSummary } = useMemo(() => {
        const filtered = rawData.filter(d => (d.divisionName || "").toUpperCase() === (selectedDivision || "").toUpperCase());

        const salesMap = new Map<string, number>();
        filtered.forEach(item => {
            const name = item.storeTypeLabel || "Unknown Store Type";
            salesMap.set(name, (salesMap.get(name) || 0) + (item.netAmount || 0));
        });

        const perf = Array.from(salesMap.entries()).map(([name, sales]) => {
            const targetKey = Object.keys(channelTargets).find(k => k.toUpperCase() === name.toUpperCase());
            const target = targetKey ? channelTargets[targetKey] : 0;

            return {
                name: name.toUpperCase(),
                sales,
                target,
                achievement: target > 0 ? (sales / target) * 100 : 0,
                status: target > 0 ? (sales >= target ? "HIT" : "MISS") : "SET"
            };
        }).sort((a, b) => b.sales - a.sales);

        const totalActual = perf.reduce((s, i) => s + i.sales, 0);
        const totalTarget = perf.reduce((s, i) => s + i.target, 0);

        return {
            channelPerformance: perf,
            divisionSummary: { totalActual, totalTarget, achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0 }
        };
    }, [rawData, selectedDivision, channelTargets]);


    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    const formatShort = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? "-" : "";
        if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
        return `${sign}₱${absVal.toFixed(0)}`;
    };

    const gap = divisionSummary.totalActual - divisionSummary.totalTarget;

    return (
        <div className="space-y-8 p-6 min-h-screen bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
                        <span>BIA Intelligence</span> <ChevronRight className="h-3 w-3" />
                        <span>Channel Analytics</span> <ChevronRight className="h-3 w-3" />
                        <span className="text-primary font-black">{selectedDivision}</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                        Managerial <span className="text-primary">Dashboard</span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        Channel performance matrix and personnel achievement tracking
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-2 shadow-2xl">
                    <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="flex items-center gap-1">
                            <Input type="month" value={fromMonth} onChange={e => { if (e.target.value) setFromMonth(e.target.value); }} className="w-[110px] border-none bg-transparent h-8 text-[11px] font-black uppercase focus-visible:ring-0 cursor-pointer p-0" />
                            <span className="text-muted-foreground/30 font-black px-1">/</span>
                            <Input type="month" value={toMonth} onChange={e => { if (e.target.value) setToMonth(e.target.value); }} className="w-[110px] border-none bg-transparent h-8 text-[11px] font-black uppercase focus-visible:ring-0 cursor-pointer p-0" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1">
                        <Filter className="h-4 w-4 text-primary" />
                        <Select value={selectedDivision} onValueChange={(val) => {
                            setSelectedDivision(val);
                            setSelectedChannel(null);
                        }}>
                            <SelectTrigger className="w-[140px] h-8 border-none bg-transparent shadow-none text-[11px] font-black uppercase p-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-border/40 bg-popover/95 backdrop-blur-xl">
                                {divisions.map(d => <SelectItem key={d} value={d} className="text-[10px] font-black uppercase">{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- METRIC STRIP --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-transparent group hover:scale-[1.02] transition-all duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins className="h-16 w-16 text-primary -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Actual</p>
                        <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(divisionSummary.totalActual)}</p>
                        <div className="mt-2 h-1 w-12 bg-primary/40 rounded-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/40 bg-card hover:scale-[1.02] transition-all duration-300 shadow-lg">
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Division Target</p>
                        <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(divisionSummary.totalTarget)}</p>
                        <div className="mt-2 h-1 w-12 bg-muted/40 rounded-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/40 bg-card hover:scale-[1.02] transition-all duration-300 shadow-lg">
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Achievement</p>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-black tracking-tighter italic">{divisionSummary.achievement.toFixed(1)}%</p>
                            <Badge className={`font-black text-[9px] uppercase px-2 py-0.5 tracking-widest ${divisionSummary.achievement >= 100 ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/20" : "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/20"}`} variant="outline">
                                {divisionSummary.achievement >= 100 ? "Hitting" : "Missing"}
                            </Badge>
                        </div>
                        <div className="mt-2 h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                            <div className={`h-full ${divisionSummary.achievement >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(divisionSummary.achievement, 100)}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`relative overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-xl border-l-4 ${gap > 0 ? "border-emerald-500 bg-emerald-500/5" : "border-destructive bg-destructive/5"}`}>
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Variance Gap</p>
                        <p className={`text-3xl font-black tracking-tighter italic ${gap > 0 ? "text-emerald-500" : "text-destructive"}`}>
                            {formatPHP(gap)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            {gap > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                {gap > 0 ? "Positive Growth" : "Revenue Deficit"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN VISUALIZATION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-black uppercase tracking-tight italic">
                                    Top <span className="text-primary">Channel Volume</span>
                                </CardTitle>
                                <Badge variant="secondary" className="text-[9px] font-black tracking-widest uppercase py-0 px-2 h-4">Visual Analytics</Badge>
                            </div>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                Comparative channel hitting matrix
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-background rounded-xl border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
                                <LayoutDashboard className="h-4 w-4 text-primary opacity-60" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[520px] pt-8 px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                                data={channelPerformance.slice(0, 10)} 
                                layout="vertical" 
                                margin={{ left: 20, right: 100, bottom: 20 }}
                                onClick={(data) => {
                                    if (data && data.activePayload) {
                                        const channelName = data.activePayload[0].payload.name;
                                        setSelectedChannel(channelName);
                                        setIsDetailModalOpen(true);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={140} 
                                    fontSize={10} 
                                    tick={{ fill: 'hsl(var(--foreground))', fontWeight: 900, fontSize: 10 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-4 rounded-2xl shadow-2xl min-w-[200px]">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center gap-8">
                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Actual Sales</span>
                                                            <span className="text-sm font-black text-primary italic">{formatPHP(data.sales)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-8">
                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Target Quota</span>
                                                            <span className="text-sm font-black text-foreground italic">{formatPHP(data.target)}</span>
                                                        </div>
                                                        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                                                            <span className={`text-[10px] font-black uppercase ${data.achievement >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>Achievement</span>
                                                            <span className={`text-lg font-black italic ${data.achievement >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{data.achievement.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="sales" name="Actual" barSize={28} radius={[0, 8, 8, 0]} minPointSize={2}>
                                    {channelPerformance.slice(0, 10).map((e, i) => (
                                        <Cell key={i} fill={e.sales >= e.target ? '#10b981' : '#f59e0b'} fillOpacity={0.8} />
                                    ))}
                                    <LabelList 
                                        dataKey="sales" 
                                        position="right" 
                                        formatter={(v: number) => formatShort(v)} 
                                        style={{ fontSize: '10px', fontWeight: 900, fill: 'hsl(var(--foreground))', textTransform: 'uppercase' }} 
                                        offset={12} 
                                    />
                                </Bar>
                                <Bar 
                                    dataKey="target" 
                                    name="Target" 
                                    barSize={12} 
                                    fill="hsl(var(--primary))" 
                                    fillOpacity={0.15}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={1}
                                    strokeOpacity={0.5}
                                    radius={[0, 4, 4, 0]} 
                                />
                                <Scatter 
                                    dataKey="target" 
                                    tooltipType="none"
                                    shape={(props: { cx?: number, cy?: number, payload?: { target?: number } }) => {
                                        const { cx, cy, payload } = props;
                                        if (!payload || !payload.target || cx === undefined || cy === undefined) return <g />;
                                        return (
                                            <line 
                                                x1={cx} y1={cy - 22} 
                                                x2={cx} y2={cy + 22} 
                                                stroke="hsl(var(--foreground))" 
                                                strokeWidth={3}
                                                strokeLinecap="round"
                                                opacity={0.4}
                                            />
                                        );
                                    }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* --- SIDE LISTING --- */}
                <Card className="lg:col-span-4 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-border/40 bg-muted/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic">
                                <span className="text-primary">Channel</span> Health
                            </CardTitle>
                            <div className="p-2 bg-background rounded-xl border border-border/40 shadow-sm">
                                <Trophy className="h-4 w-4 text-amber-500" />
                            </div>
                        </div>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                            Channel-wise target scorecard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-[520px] w-full px-4 pt-6">
                            <div className="space-y-4 pb-6">
                                {channelPerformance.map((item, i) => (
                                    <div 
                                        key={i} 
                                        className="group relative p-4 rounded-2xl border border-border/40 bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            setSelectedChannel(item.name);
                                            setIsDetailModalOpen(true);
                                        }}
                                    >
                                        {/* Background Decoration */}
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                            <Trophy className="h-24 w-24 rotate-12" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-[11px] uppercase tracking-wider text-foreground leading-none">{item.name}</p>
                                                    {item.sales < item.target && <AlertCircle className="h-3 w-3 text-destructive animate-pulse" />}
                                                </div>
                                                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                                                    Channel Health Index
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black italic leading-none ${item.achievement >= 100 ? "text-emerald-500" : "text-amber-500"}`}>
                                                    {item.achievement.toFixed(0)}%
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Achv</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="relative h-2 bg-muted/20 rounded-full border border-border/10 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ease-out ${
                                                        item.achievement >= 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : 
                                                        item.achievement >= 50 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                    }`} 
                                                    style={{ width: `${Math.min(item.achievement, 100)}%` }} 
                                                />
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Actual</span>
                                                    <span className="text-xs font-black italic text-foreground leading-none">{formatShort(item.sales)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Target</span>
                                                    <span className="text-xs font-black italic text-foreground leading-none">{formatShort(item.target)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <BreakdownAnalysisModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedChannel(null);
                }}
                data={salesmanDetailData}
                ids={Array.from(new Set(salesmanDetailData.map(d => Number(d.salesmanId)).filter(Boolean)))}
                channelName={selectedChannel || ""}
                supplierName=""
                periodLabel={`${fromMonth} to ${toMonth}`}
                startDate={format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd")}
                endDate={format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd")}
            />

        </div>
    );
}

export default function ManagerialChannelModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ManagerialSupplierContent />
        </Suspense>
    );
}
