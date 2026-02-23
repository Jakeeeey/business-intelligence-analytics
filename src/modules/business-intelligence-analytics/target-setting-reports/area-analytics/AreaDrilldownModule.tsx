"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import {
    Loader2, Calendar, MapPin, Map as MapIcon, Package, User,
    ChevronDown, ChevronRight, Filter, TrendingUp, Search
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Use your standardized fetch provider
import { fetchAreaDrilldownData } from "./providers/fetchProvider";
import { AreaDrilldownDto } from "./types";

const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);

// State type for our active filter
type SelectionContext = {
    level: "ALL" | "PROVINCE" | "CITY";
    provinceName: string | null;
    cityName: string | null;
};

function CommandCenterContent() {
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [selectedDivision, setSelectedDivision] = useState<string>("All");

    // UI States
    const [rawData, setRawData] = useState<AreaDrilldownDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());

    // The core of the Master-Detail view: what are we currently looking at?
    const [activeSelection, setActiveSelection] = useState<SelectionContext>({ level: "ALL", provinceName: null, cityName: null });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                const data = await fetchAreaDrilldownData(start, end);
                setRawData(data);
                // Reset selection when date changes
                setActiveSelection({ level: "ALL", provinceName: null, cityName: null });
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, [fromMonth, toMonth]);

    const uniqueDivisions = useMemo(() => ["All", ...Array.from(new Set(rawData.map(d => d.divisionName || "Unassigned"))).sort()], [rawData]);

    // 🧠 1. AGGREGATE THE LEFT PANEL (Navigation Tree)
    const navTree = useMemo(() => {
        const root = new Map<string, { total: number; cities: Map<string, number> }>();

        rawData.forEach(item => {
            if (selectedDivision !== "All" && item.divisionName !== selectedDivision) return;
            if (item.netAmount <= 0) return;

            const prov = item.province || "Unknown Province";
            const city = item.city || "Unknown City";

            if (!root.has(prov)) root.set(prov, { total: 0, cities: new Map() });
            const pNode = root.get(prov)!;
            pNode.total += item.netAmount;
            pNode.cities.set(city, (pNode.cities.get(city) || 0) + item.netAmount);
        });
        return Array.from(root.entries()).sort((a, b) => b[1].total - a[1].total);
    }, [rawData, selectedDivision]);

    // 🧠 2. AGGREGATE THE RIGHT PANEL (Dynamic Insights based on selection)
    const { filteredTotal, topSuppliers, topSalesmen } = useMemo(() => {
        let total = 0;
        const suppliers = new Map<string, number>();
        const salesmen = new Map<string, number>();

        rawData.forEach(item => {
            if (selectedDivision !== "All" && item.divisionName !== selectedDivision) return;
            if (item.netAmount <= 0) return;

            // Apply active geographical filter
            if (activeSelection.level === "PROVINCE" && item.province !== activeSelection.provinceName) return;
            if (activeSelection.level === "CITY" && (item.province !== activeSelection.provinceName || item.city !== activeSelection.cityName)) return;

            total += item.netAmount;

            const sup = item.supplierName || "Unknown Supplier";
            const man = item.salesmanName || "Unassigned";

            suppliers.set(sup, (suppliers.get(sup) || 0) + item.netAmount);
            salesmen.set(man, (salesmen.get(man) || 0) + item.netAmount);
        });

        return {
            filteredTotal: total,
            topSuppliers: Array.from(suppliers.entries()).sort((a, b) => b[1] - a[1]),
            topSalesmen: Array.from(salesmen.entries()).sort((a, b) => b[1] - a[1])
        };
    }, [rawData, selectedDivision, activeSelection]);

    const toggleProvince = (prov: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent setting active selection when just opening the folder
        const newSet = new Set(expandedProvinces);
        if (newSet.has(prov)) newSet.delete(prov);
        else newSet.add(prov);
        setExpandedProvinces(newSet);
    };

    return (
        <div className="space-y-4 lg:space-y-6 bg-background text-foreground min-h-screen">

            {/* --- TOOLBAR --- */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-primary" /> Market Insights
                    </h2>
                    <p className="text-xs lg:text-sm text-muted-foreground">Master-Detail Performance Analysis</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
                    <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-background">
                            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Division" />
                        </SelectTrigger>
                        <SelectContent>{uniqueDivisions.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}</SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 border rounded-md px-3 bg-background h-9">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" />
                        <span className="text-muted-foreground text-xs">-</span>
                        <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" />
                    </div>
                </div>
            </div>

            {/* --- SPLIT SCREEN COMMAND CENTER --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">

                {/* 👈 LEFT PANEL: THE NAVIGATOR (col-span-4) */}
                <Card className="lg:col-span-4 flex flex-col overflow-hidden border-muted/40 shadow-xl bg-card/40">
                    <div className="bg-muted/40 p-4 border-b border-border/50 flex justify-between items-center shadow-sm z-10">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Territories</span>
                        <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setActiveSelection({ level: "ALL", provinceName: null, cityName: null })}>
                            View All
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {/* Global "All" Button */}
                                <div
                                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${activeSelection.level === "ALL" ? "bg-primary text-primary-foreground font-bold shadow-md" : "hover:bg-muted/50 text-muted-foreground"}`}
                                    onClick={() => setActiveSelection({ level: "ALL", provinceName: null, cityName: null })}
                                >
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">Entire Organization</span>
                                </div>

                                <Separator className="my-2" />

                                {/* Provinces & Cities */}
                                {navTree.map(([prov, pData]) => {
                                    const isPOpen = expandedProvinces.has(prov);
                                    const isPActive = activeSelection.level === "PROVINCE" && activeSelection.provinceName === prov;

                                    return (
                                        <div key={prov} className="space-y-1">
                                            <div
                                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors group ${isPActive ? "bg-primary/10 text-primary font-bold border border-primary/20" : "hover:bg-muted/50"}`}
                                                onClick={() => setActiveSelection({ level: "PROVINCE", provinceName: prov, cityName: null })}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div
                                                        className="p-1 hover:bg-background rounded text-muted-foreground shrink-0"
                                                        onClick={(e) => toggleProvince(prov, e)}
                                                    >
                                                        {isPOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <span className="text-sm uppercase tracking-tight truncate">{prov}</span>
                                                </div>
                                                {/* Sparkline hint */}
                                                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden shrink-0 hidden sm:block">
                                                    <div className="h-full bg-primary/50" style={{ width: '100%' }} />
                                                </div>
                                            </div>

                                            {/* City Children */}
                                            {isPOpen && (
                                                <div className="pl-6 space-y-1 pb-1">
                                                    {Array.from(pData.cities.entries())
                                                        .sort((a,b) => b[1] - a[1])
                                                        .map(([city, cTotal]) => {
                                                            const isCActive = activeSelection.level === "CITY" && activeSelection.cityName === city;
                                                            return (
                                                                <div
                                                                    key={city}
                                                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs ${isCActive ? "bg-primary/10 text-primary font-bold border border-primary/20" : "hover:bg-muted/30 text-muted-foreground"}`}
                                                                    onClick={() => setActiveSelection({ level: "CITY", provinceName: prov, cityName: city })}
                                                                >
                                                                    <MapIcon className="h-3 w-3 shrink-0" />
                                                                    <span className="truncate">{city}</span>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </Card>

                {/* 👉 RIGHT PANEL: THE MICROSCOPE (col-span-8) */}
                <div className="lg:col-span-8 flex flex-col space-y-4 lg:space-y-6 h-full overflow-hidden">

                    {/* Dynamic Header & KPI */}
                    <Card className="shrink-0 border-primary/20 bg-primary/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Search className="h-32 w-32" />
                        </div>
                        <CardHeader className="p-6">
                            <CardTitle className="text-xs lg:text-sm uppercase text-muted-foreground font-black tracking-widest flex items-center gap-2">
                                {activeSelection.level === "ALL" && "Company-Wide Overview"}
                                {activeSelection.level === "PROVINCE" && `Province Analysis: ${activeSelection.provinceName}`}
                                {activeSelection.level === "CITY" && `City Analysis: ${activeSelection.cityName}`}
                            </CardTitle>
                            <div className="text-4xl lg:text-5xl font-black mt-2 tracking-tighter text-foreground">
                                {formatPHP(filteredTotal)}
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Data Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">

                        {/* Suppliers Widget */}
                        <Card className="border-muted/40 shadow-lg flex flex-col h-full overflow-hidden bg-card/40">
                            <div className="bg-muted/30 p-4 border-b border-border/50 text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
                                <Package className="h-4 w-4" /> Top Suppliers
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4 pr-3">
                                    {topSuppliers.length === 0 && !loading && <p className="text-xs text-muted-foreground text-center pt-10">No supplier data for this region.</p>}
                                    {topSuppliers.map(([sup, amt], idx) => {
                                        const share = (amt / filteredTotal) * 100;
                                        return (
                                            <div key={sup} className="space-y-1.5">
                                                <div className="flex justify-between items-end text-sm">
                                                    <span className="font-bold truncate pr-4">{idx + 1}. {sup}</span>
                                                    <span className="font-mono text-amber-500/90 shrink-0">{formatPHP(amt)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={share} className="h-1.5 bg-muted [&>div]:bg-amber-500" />
                                                    <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{share.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* Salesmen Widget */}
                        <Card className="border-muted/40 shadow-lg flex flex-col h-full overflow-hidden bg-card/40">
                            <div className="bg-muted/30 p-4 border-b border-border/50 text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
                                <User className="h-4 w-4" /> Top Representatives
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-3 pr-3">
                                    {topSalesmen.length === 0 && !loading && <p className="text-xs text-muted-foreground text-center pt-10">No sales representative data for this region.</p>}
                                    {topSalesmen.map(([man, amt], idx) => {
                                        const share = (amt / filteredTotal) * 100;
                                        return (
                                            <div key={man} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate text-foreground/90">{man}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{share.toFixed(1)}% Contribution</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-mono text-sm font-black">{formatPHP(amt)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AreaDrilldownModule() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CommandCenterContent />
        </Suspense>
    );
}