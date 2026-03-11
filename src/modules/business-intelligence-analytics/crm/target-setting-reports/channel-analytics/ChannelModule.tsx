"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import {
    Loader2, Calendar, Store, Package, User, ShoppingCart,
    Search, ArrowUpRight
} from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Removed ScrollArea import to use native scrolling
import { fetchChannelDrilldownData } from "./providers/fetchProvider";
import { ChannelDrilldownDto } from "./types";

const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);

function ChannelMatrixContent() {
    const today = new Date();
    const currentMonthStr = format(today, "yyyy-MM");

    const [fromMonth, setFromMonth] = useState(currentMonthStr);
    const [toMonth, setToMonth] = useState(currentMonthStr);
    const [selectedDivision, setSelectedDivision] = useState<string>("All");

    // --- MODAL STATE ---
    const [selectedChannel, setSelectedChannel] = useState<{
        name: string;
        total: number;
        allStores: [string, number][];
        allSuppliers: [string, number][];
        allSalesmen: [string, number][];
    } | null>(null);
    const [modalSearch, setModalSearch] = useState("");

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

    // 🧠 AGGREGATION ENGINE
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

        const sortedCards = Array.from(channels.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([name, data]) => ({
                name,
                total: data.total,
                allStores: Array.from(data.stores.entries()).sort((a, b) => b[1] - a[1]),
                allSuppliers: Array.from(data.suppliers.entries()).sort((a, b) => b[1] - a[1]),
                allSalesmen: Array.from(data.salesmen.entries()).sort((a, b) => b[1] - a[1])
            }));

        return { channelCards: sortedCards, grandTotal: total };
    }, [rawData, selectedDivision]);

    // Helper to render lists inside the modal
    const renderModalList = (items: [string, number][], icon: React.ReactNode, type: string) => {
        if (!selectedChannel) return null;
        
        const filteredItems = items.filter(([name]) => name.toLowerCase().includes(modalSearch.toLowerCase()));

        return (
            <div className="space-y-2 pb-10"> {/* Added pb-10 for bottom spacing */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No {type.toLowerCase()} found matching &quot;{modalSearch}&quot;</div>
                ) : (
                    filteredItems.map(([name, amt], idx) => {
                        const share = (amt / selectedChannel.total) * 100;
                        return (
                            <div key={name} className="flex flex-col p-4 hover:bg-muted/30 rounded-xl transition-all border border-transparent hover:border-border/50 group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs shrink-0 text-muted-foreground font-mono group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {idx + 1}
                                        </Badge>
                                        <div className="flex items-center gap-3 truncate">
                                            {icon}
                                            <span className="font-bold text-base truncate text-foreground/80 group-hover:text-foreground transition-colors">{name}</span>
                                        </div>
                                    </div>
                                    <span className="font-mono font-black text-base text-foreground">{formatPHP(amt)}</span>
                                </div>
                                <div className="flex items-center gap-4 pl-10">
                                    <Progress value={share} className="h-2 bg-muted flex-1" />
                                    <span className="text-xs font-medium text-muted-foreground w-10 text-right shrink-0">{share.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

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
                    {channelCards.map((channel) => {
                        const channelShare = (channel.total / grandTotal) * 100;
                        return (
                            <Card
                                key={channel.name}
                                className="border-muted/40 shadow-xl bg-card/40 flex flex-col overflow-hidden group cursor-pointer hover:border-amber-500/30 hover:shadow-2xl transition-all duration-300"
                                onClick={() => {
                                    setModalSearch("");
                                    setSelectedChannel(channel);
                                }}
                            >
                                <div className="bg-amber-500/10 p-5 border-b border-amber-500/20 flex justify-between items-center group-hover:bg-amber-500/15 transition-colors">
                                    <div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight text-amber-500 flex items-center gap-2">
                                            {channel.name} <ArrowUpRight className="h-4 w-4 opacity-50" />
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground font-bold mt-1">{channelShare.toFixed(1)}% of Total Revenue</p>
                                    </div>
                                    <div className="text-2xl font-black text-foreground">{formatPHP(channel.total)}</div>
                                </div>
                                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2">
                                    <div className="p-5 border-r border-border/50 bg-background/50">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            <ShoppingCart className="h-4 w-4 text-foreground" /> Top Stores
                                        </div>
                                        <div className="space-y-4">
                                            {channel.allStores.slice(0, 5).map(([store, amt]) => {
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
                                    <div className="p-5 flex flex-col">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                <Package className="h-4 w-4 text-blue-500" /> Top Suppliers
                                            </div>
                                            <div className="space-y-2">
                                                {channel.allSuppliers.slice(0, 3).map(([sup, amt], idx) => (
                                                    <div key={sup} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/20">
                                                        <span className="font-medium truncate"><span className="text-muted-foreground mr-1">{idx+1}.</span>{sup}</span>
                                                        <span className="font-mono font-bold text-blue-500/90">{formatPHP(amt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                <User className="h-4 w-4 text-emerald-500" /> Top Reps
                                            </div>
                                            <div className="space-y-2">
                                                {channel.allSalesmen.slice(0, 3).map(([man, amt], idx) => (
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

            {/* --- MEGA MODAL (Fixed Scrolling) --- */}
            <Dialog open={!!selectedChannel} onOpenChange={(open) => !open && setSelectedChannel(null)}>
                {/* 1. FORCE FIXED HEIGHT: h-[90vh] */}
                <DialogContent className="max-w-[95vw] md:max-w-7xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-amber-500/20 shadow-2xl">

                    {/* Header (Shrink 0 to never compress) */}
                    <div className="bg-amber-500/10 p-6 lg:p-8 border-b border-amber-500/20 shrink-0 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 uppercase tracking-widest text-xs font-bold">
                                    Channel Analysis
                                </Badge>
                                <span className="text-sm text-muted-foreground font-mono font-medium">{selectedDivision}</span>
                            </div>
                            <DialogTitle className="text-4xl lg:text-5xl font-black uppercase text-amber-500 tracking-tighter mt-3 flex items-center gap-3">
                                <Store className="h-8 w-8 lg:h-10 lg:w-10" />
                                {selectedChannel?.name}
                            </DialogTitle>
                            <DialogDescription className="text-foreground/80 font-medium mt-2 text-lg">
                                Deep dive into store performance and key contributors.
                            </DialogDescription>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Revenue</div>
                            <div className="text-5xl font-black text-foreground tracking-tight">{selectedChannel && formatPHP(selectedChannel.total)}</div>
                        </div>
                    </div>

                    {/* Content Container (Flex-1 to take remaining space, min-h-0 to allow internal scrolling) */}
                    <div className="flex-1 flex flex-col min-h-0 bg-background">
                        <Tabs defaultValue="stores" className="flex-1 flex flex-col min-h-0">

                            {/* Tabs Toolbar (Shrink 0) */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0 gap-4 bg-muted/20">
                                <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                                    <TabsTrigger value="stores">Stores</TabsTrigger>
                                    <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                                    <TabsTrigger value="salesmen">Sales Reps</TabsTrigger>
                                </TabsList>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search list..."
                                        className="pl-9 h-9 bg-background border-muted-foreground/20 focus-visible:ring-amber-500"
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 2. THE SCROLL FIX: Native overflow-y-auto on a flex-1 container */}
                            {selectedChannel && (
                                <div className="flex-1 overflow-y-auto p-6 lg:p-8 min-h-0">
                                    <TabsContent value="stores" className="mt-0 max-w-5xl mx-auto">
                                        {renderModalList(selectedChannel.allStores, <ShoppingCart className="h-5 w-5 text-muted-foreground" />, "Stores")}
                                    </TabsContent>
                                    <TabsContent value="suppliers" className="mt-0 max-w-5xl mx-auto">
                                        {renderModalList(selectedChannel.allSuppliers, <Package className="h-5 w-5 text-blue-500" />, "Suppliers")}
                                    </TabsContent>
                                    <TabsContent value="salesmen" className="mt-0 max-w-5xl mx-auto">
                                        {renderModalList(selectedChannel.allSalesmen, <User className="h-5 w-5 text-emerald-500" />, "Representatives")}
                                    </TabsContent>
                                </div>
                            )}
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

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