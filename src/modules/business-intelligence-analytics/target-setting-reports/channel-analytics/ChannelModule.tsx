"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Loader2, Calendar, Store, Package, User, ShoppingCart, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Assuming standard fetcher location
import { fetchChannelDrilldownData } from "./providers/fetchProvider";
import { ChannelDrilldownDto } from "./types";

const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);

function ChannelMatrixContent() {
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [selectedDivision, setSelectedDivision] = useState<string>("All");

    const [rawData, setRawData] = useState<ChannelDrilldownDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const start = format(startOfMonth(parseISO(fromMonth + "-01")), "yyyy-MM-dd");
                const end = format(endOfMonth(parseISO(toMonth + "-01")), "yyyy-MM-dd");
                const data = await fetchChannelDrilldownData(start, end);
                setRawData(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, [fromMonth, toMonth]);

    const uniqueDivisions = useMemo(() => ["All", ...Array.from(new Set(rawData.map(d => d.divisionName || "Unassigned"))).sort()], [rawData]);

    // 🧠 THE EXECUTIVE SUMMARY ENGINE (Aggregates only the Top Performers)
    const { channelCards, grandTotal } = useMemo(() => {
        let total = 0;
        const channels = new Map<string, {
            total: number,
            stores: Map<string, number>,
            suppliers: Map<string, number>,
            salesmen: Map<string, number>
        }>();

        rawData.forEach(item => {
            if (selectedDivision !== "All" && item.divisionName !== selectedDivision) return;
            if (item.netAmount <= 0) return;

            total += item.netAmount;
            const channel = item.storeTypeLabel || "Uncategorized";
            const store = item.storeName || "Unknown";
            const sup = item.supplierName || "Unknown";
            const man = item.salesmanName || "Unassigned";

            if (!channels.has(channel)) {
                channels.set(channel, { total: 0, stores: new Map(), suppliers: new Map(), salesmen: new Map() });
            }

            const ch = channels.get(channel)!;
            ch.total += item.netAmount;
            ch.stores.set(store, (ch.stores.get(store) || 0) + item.netAmount);
            ch.suppliers.set(sup, (ch.suppliers.get(sup) || 0) + item.netAmount);
            ch.salesmen.set(man, (ch.salesmen.get(man) || 0) + item.netAmount);
        });

        // Map and sort everything to only return the Top N entities per channel
        const sortedCards = Array.from(channels.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([name, data]) => ({
                name,
                total: data.total,
                topStores: Array.from(data.stores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5), // Top 5
                topSuppliers: Array.from(data.suppliers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3), // Top 3
                topSalesmen: Array.from(data.salesmen.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3) // Top 3
            }));

        return { channelCards: sortedCards, grandTotal: total };
    }, [rawData, selectedDivision]);

    return (
        <div className="space-y-6 bg-background text-foreground min-h-screen pb-10">

            {/* TOOLBAR */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                        <Store className="h-8 w-8 text-amber-500" /> Channel Matrix
                    </h2>
                    <p className="text-sm text-muted-foreground">Executive Summary of Top Drivers by Segment</p>
                </div>

                <div className="flex gap-3 bg-card/50 p-2 rounded-xl border border-border/50 shadow-sm">
                    <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                        <SelectTrigger className="w-[150px] h-9 text-xs bg-background"><SelectValue placeholder="Division" /></SelectTrigger>
                        <SelectContent>{uniqueDivisions.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 border rounded-md px-3 bg-background h-9">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <Input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" />
                        <span className="text-muted-foreground">-</span>
                        <Input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)} className="w-[110px] border-none bg-transparent text-xs p-0 focus-visible:ring-0" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-amber-500" /></div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* The Channel Cards */}
                    {channelCards.map((channel) => {
                        const channelShare = (channel.total / grandTotal) * 100;

                        return (
                            <Card key={channel.name} className="border-muted/40 shadow-xl bg-card/40 flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="bg-amber-500/10 p-5 border-b border-amber-500/20 flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight text-amber-500">{channel.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground font-bold mt-1">{channelShare.toFixed(1)}% of Total Revenue</p>
                                    </div>
                                    <div className="text-2xl font-black text-foreground">{formatPHP(channel.total)}</div>
                                </div>

                                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2">
                                    {/* Left Column: Top Stores */}
                                    <div className="p-5 border-r border-border/50 bg-background/50">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            <ShoppingCart className="h-4 w-4 text-foreground" /> Top 5 Stores
                                        </div>
                                        <div className="space-y-4">
                                            {channel.topStores.map(([store, amt]) => {
                                                const share = (amt / channel.total) * 100;
                                                return (
                                                    <div key={store}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-semibold truncate pr-2">{store}</span>
                                                            <span className="font-mono">{formatPHP(amt)}</span>
                                                        </div>
                                                        <Progress value={share} className="h-1.5 bg-muted [&>div]:bg-amber-500" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Column: Top Suppliers & Salesmen */}
                                    <div className="p-5 flex flex-col">

                                        {/* Suppliers */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                <Package className="h-4 w-4 text-blue-500" /> Top Suppliers
                                            </div>
                                            <div className="space-y-2">
                                                {channel.topSuppliers.map(([sup, amt], idx) => (
                                                    <div key={sup} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/20">
                                                        <span className="font-medium truncate"><span className="text-muted-foreground mr-1">{idx+1}.</span>{sup}</span>
                                                        <span className="font-mono font-bold text-blue-500/90">{formatPHP(amt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Salesmen */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                <User className="h-4 w-4 text-emerald-500" /> Top Reps
                                            </div>
                                            <div className="space-y-2">
                                                {channel.topSalesmen.map(([man, amt], idx) => (
                                                    <div key={man} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/20">
                                                        <span className="font-medium truncate"><span className="text-muted-foreground mr-1">{idx+1}.</span>{man}</span>
                                                        <span className="font-mono font-bold text-emerald-500/90">{formatPHP(amt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export default function ChannelModule() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-amber-500" /></div>}>
            <ChannelMatrixContent />
        </Suspense>
    );
}