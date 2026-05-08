"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation"; 
import { 
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Scatter, ComposedChart 
} from 'recharts';
import { 
    Loader2, Calendar, LayoutDashboard, ChevronRight, AlertCircle, Trophy
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchExecutiveHealthData, fetchCompanyTargets, fetchDivisionTargets } from "./providers/fetchProvider";
import { VSalesPerformanceDataDto, TargetSettingExecutive, TargetSettingDivision } from "./types";
import { getDivisions } from "../../target-setting/executive/providers/fetchProvider";

function ExecutiveHealthContent() {
    const router = useRouter();
    
    // Default to current month for a "Live" dashboard feel
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [rawData, setRawData] = useState<VSalesPerformanceDataDto[]>([]);
    const [targets, setTargets] = useState<TargetSettingExecutive[]>([]);
    const [allocations, setAllocations] = useState<TargetSettingDivision[]>([]);
    const [divisions, setDivisions] = useState<{division_id: number, division_name: string}[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                if (start > end) return;

                const [data, companyTargets, metadataDivs] = await Promise.all([
                    fetchExecutiveHealthData(start, end),
                    fetchCompanyTargets(start, end),
                    getDivisions()
                ]);

                setRawData(data);
                setTargets(companyTargets);
                setDivisions(metadataDivs);

                if (companyTargets.length > 0) {
                    const divTargets = await fetchDivisionTargets(companyTargets.map(t => t.id));
                    setAllocations(divTargets);
                } else {
                    setAllocations([]);
                }
            } catch (err) { 
                console.error("Executive Health Fetch Error:", err); 
            }
        };
        load();
    }, [fromMonth, toMonth]);

    const { companyHealth, divisionHealth } = useMemo(() => {
        let totalActual = 0;
        const totalTarget = targets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
        
        const divisionMap = new Map<string, {name: string, sales: number}>();

        rawData.forEach(item => {
            const divName = item.divisionName || "Unknown";
            totalActual += item.netAmount || 0;
            const current = divisionMap.get(divName) || { name: divName, sales: 0 };
            current.sales += item.netAmount || 0;
            divisionMap.set(divName, current);
        });

        // Add divisions that have targets but no sales yet
        divisions.forEach(d => {
            if (!divisionMap.has(d.division_name)) {
                divisionMap.set(d.division_name, { name: d.division_name, sales: 0 });
            }
        });

        const processedDivisions = Array.from(divisionMap.values()).map(div => {
            const divId = divisions.find(d => d.division_name === div.name)?.division_id;
            const divTarget = allocations
                .filter(a => a.division_id === divId)
                .reduce((sum, a) => sum + (a.target_amount || 0), 0);

            return {
                ...div,
                target: divTarget,
                achievement: divTarget > 0 ? (div.sales / divTarget) * 100 : 0
            };
        }).sort((a, b) => b.sales - a.sales);

        return {
            companyHealth: {
                actual: totalActual,
                target: totalTarget,
                achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
                gap: totalActual - totalTarget
            },
            divisionHealth: processedDivisions
        };
    }, [rawData, targets, allocations, divisions]);


    const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
    
    const formatShort = (val: number) => {
        const absVal = Math.abs(val);
        const sign = val < 0 ? "-" : "";
        if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
        return `${sign}₱${absVal.toFixed(0)}`;
    };

    const handleDivisionClick = (divisionName: string) => {
        const params = new URLSearchParams({ from: fromMonth, to: toMonth, division: divisionName });
        router.push(`/bia/crm/target-setting-reports/managerial-supplier?${params.toString()}`);
    };

    return (
        <div className="space-y-8 p-6 min-h-screen bg-background text-foreground">
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground/60 mb-1 text-[10px] uppercase font-black tracking-[0.2em]">
                        <span>BIA Intelligence</span> <ChevronRight className="h-3 w-3" /> 
                        <span>Performance Reports</span> <ChevronRight className="h-3 w-3" /> 
                        <span className="text-primary font-black">Executive Health</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic leading-none">
                        Executive <span className="text-primary">Performance</span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        Real-time cross-division sales monitoring and target tracking
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-2 shadow-2xl">
                    <div className="flex items-center gap-2 px-4 border-r border-border/40 py-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="flex items-center gap-1">
                            <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-[120px] border-none bg-transparent h-8 text-[11px] font-black uppercase focus-visible:ring-0 cursor-pointer p-0" />
                            <span className="text-muted-foreground/30 font-black px-1">/</span>
                            <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-[120px] border-none bg-transparent h-8 text-[11px] font-black uppercase focus-visible:ring-0 cursor-pointer p-0" />
                        </div>
                    </div>
                    <div className="px-4 py-1">
                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            VOS Analytics Engine
                        </Badge>
                    </div>
                </div>
            </div>

            {/* --- METRIC STRIP --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-transparent group hover:scale-[1.02] transition-all duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard className="h-16 w-16 text-primary -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Company Actual</p>
                        <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(companyHealth.actual)}</p>
                        <div className="mt-2 h-1 w-12 bg-primary/40 rounded-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/40 bg-card hover:scale-[1.02] transition-all duration-300 shadow-lg">
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Company Target</p>
                        <p className="text-3xl font-black tracking-tighter text-foreground italic">{formatPHP(companyHealth.target)}</p>
                        <div className="mt-2 h-1 w-12 bg-muted/40 rounded-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/40 bg-card hover:scale-[1.02] transition-all duration-300 shadow-lg">
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Achievement</p>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-black tracking-tighter italic">{companyHealth.achievement.toFixed(1)}%</p>
                            <Badge className={`font-black text-[9px] uppercase px-2 py-0.5 tracking-widest ${companyHealth.achievement >= 100 ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/20" : "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/20"}`} variant="outline">
                                {companyHealth.achievement >= 100 ? "On Track" : "Lagging"}
                            </Badge>
                        </div>
                        <div className="mt-2 h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                            <div className={`h-full ${companyHealth.achievement >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(companyHealth.achievement, 100)}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`relative overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-xl border-l-4 ${companyHealth.gap > 0 ? "border-emerald-500 bg-emerald-500/5" : "border-destructive bg-destructive/5"}`}>
                    <CardContent className="p-6 flex flex-col gap-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Variance</p>
                        <p className={`text-3xl font-black tracking-tighter italic ${companyHealth.gap > 0 ? "text-emerald-500" : "text-destructive"}`}>
                            {formatPHP(companyHealth.gap)}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">
                            {companyHealth.gap > 0 ? "Above Quota" : "Below Quota"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN VISUALIZATION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-black uppercase tracking-tight italic">Division <span className="text-primary">Sales Volume</span></CardTitle>
                                <Badge variant="secondary" className="text-[9px] font-black tracking-widest uppercase py-0 px-2 h-4">Visual Analytics</Badge>
                            </div>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Cross-Division Comparison Matrix</CardDescription>
                        </div>
                        <div className="p-2 bg-background rounded-xl border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
                            <LayoutDashboard className="h-4 w-4 text-primary opacity-60" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[520px] pt-8 px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                                data={divisionHealth} 
                                layout="vertical" 
                                margin={{ left: 20, right: 100, bottom: 20 }}
                                onClick={(data) => {
                                    if (data && data.activePayload) handleDivisionClick(data.activePayload[0].payload.name);
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
                                    tick={{ fill: 'hsl(var(--foreground))', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
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
                                                            <span className="text-[10px] font-black uppercase text-emerald-500">Achievement</span>
                                                            <span className="text-lg font-black text-emerald-500 italic">{data.achievement.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="sales" name="Actual" barSize={28} radius={[0, 8, 8, 0]} minPointSize={2}>
                                    {divisionHealth.map((e, i) => (
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

                <Card className="lg:col-span-4 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-border/40 bg-muted/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Division <span className="text-primary">Scorecard</span></CardTitle>
                            <div className="p-2 bg-background rounded-xl border border-border/40 shadow-sm">
                                <Trophy className="h-4 w-4 text-amber-500" />
                            </div>
                        </div>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Comparative target hitting matrix</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-[520px] w-full px-4 pt-6">
                            <div className="space-y-4 pb-6">
                                {divisionHealth.map((div, i) => (
                                    <div 
                                        key={i} 
                                        className="group relative p-4 rounded-2xl border border-border/40 bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => handleDivisionClick(div.name)}
                                    >
                                        {/* Background Decoration */}
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                            <Trophy className="h-24 w-24 rotate-12" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-[11px] uppercase tracking-wider text-foreground leading-none">{div.name}</p>
                                                    {div.sales < div.target && <AlertCircle className="h-3 w-3 text-destructive animate-pulse" />}
                                                </div>
                                                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Division Performance</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black italic leading-none ${div.achievement >= 100 ? "text-emerald-500" : "text-amber-500"}`}>
                                                    {div.achievement.toFixed(0)}%
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Achv</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="relative h-2 bg-muted/20 rounded-full border border-border/10 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ease-out ${
                                                        div.achievement >= 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : 
                                                        div.achievement >= 50 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                                    }`} 
                                                    style={{ width: `${Math.min(div.achievement, 100)}%` }} 
                                                />
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Actual</span>
                                                    <span className="text-xs font-black italic text-foreground leading-none">{formatShort(div.sales)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Target</span>
                                                    <span className="text-xs font-black italic text-foreground leading-none">{formatShort(div.target)}</span>
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
        </div>
    );
}

export default function ExecutiveHealthModule() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ExecutiveHealthContent />
        </Suspense>
    );
}