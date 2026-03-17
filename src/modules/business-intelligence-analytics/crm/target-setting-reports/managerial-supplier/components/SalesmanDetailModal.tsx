"use client";

import React, { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, User2 } from "lucide-react";
import { VSalesPerformanceDataDto } from "../../executive-health/types";

interface SalesmanDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: VSalesPerformanceDataDto[];
    salesmanName: string;
}

export function SalesmanDetailModal({
    isOpen,
    onClose,
    data,
    salesmanName,
}: SalesmanDetailModalProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const storeBreakdown = useMemo(() => {
        const map = new Map<string, { storeTypeLabel: string; amount: number }>();

        data.forEach((item) => {
            const store = item.storeName || "Unknown Store";
            const current = map.get(store) || { storeTypeLabel: item.storeTypeLabel || item.storeType || "N/A", amount: 0 };
            map.set(store, {
                storeTypeLabel: current.storeTypeLabel,
                amount: current.amount + (item.netAmount || 0),
            });
        });

        return Array.from(map.entries())
            .map(([storeName, metrics]) => ({ storeName, ...metrics }))
            .sort((a, b) => b.amount - a.amount);
    }, [data]);

    const totalAmount = useMemo(() => {
        return storeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    }, [storeBreakdown]);

    const filteredStores = storeBreakdown.filter((s) =>
        s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.storeTypeLabel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPHP = (val: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(val);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1200px] w-[95vw] h-[85vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-0">
                <DialogHeader className="p-8 pb-6 border-b border-border/40 flex-shrink-0 bg-muted/5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-black">
                                <User2 className="h-3.5 w-3.5 text-primary" /> Salesman Performance Detail
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">
                                {salesmanName}
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
                                Comprehensive store-level sales breakdown
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs py-1 px-3 bg-primary/5 border-primary/20 text-primary">
                            {filteredStores.length} Stores
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="px-8 py-4 bg-muted/10 border-b border-border/40 flex-shrink-0">
                    <div className="flex items-center gap-3 bg-background border border-border/60 rounded-xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="FILTER BY STORE NAME OR TYPE..."
                            className="border-none bg-transparent h-full text-sm font-bold uppercase placeholder:text-muted-foreground/40 focus-visible:ring-0 p-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 px-8 py-2">
                    <ScrollArea className="h-full border border-border/40 rounded-2xl bg-card shadow-inner overflow-x-hidden">
                        <table className="w-full table-fixed text-sm">
                            <TableHeader className="bg-background sticky top-0 z-20 border-b border-border/40">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="h-14 px-6 text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[200px] bg-muted/50 backdrop-blur-md">Store Type</TableHead>
                                    <TableHead className="h-14 px-6 text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-muted/50 backdrop-blur-md">Store Name</TableHead>
                                    <TableHead className="h-14 px-6 text-right text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[200px] bg-muted/50 backdrop-blur-md">Net Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStores.length > 0 ? (
                                    filteredStores.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-primary/5 border-border/40 group transition-colors">
                                            <TableCell className="px-6 py-5">
                                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {item.storeTypeLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-5 font-bold text-sm uppercase tracking-tight text-foreground/90 group-hover:text-foreground truncate" title={item.storeName}>
                                                {item.storeName}
                                            </TableCell>
                                            <TableCell className="px-6 py-5 text-right font-mono font-black text-emerald-500 group-hover:text-emerald-400 group-hover:scale-105 transition-all text-sm">
                                                {formatPHP(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-40 text-center text-xs uppercase font-black tracking-widest text-muted-foreground/50 italic">
                                            No matching stores found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </table>
                    </ScrollArea>
                </div>

                <div className="p-8 pt-4 border-t border-border/40 bg-muted/5 flex-shrink-0">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Generated via BIA Personnel System</p>
                            <p className="text-[9px] font-bold text-muted-foreground/60">© {new Date().getFullYear()} Business Intelligence & Analytics</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Cumulative Net Performance</p>
                            <div className="text-4xl font-black text-emerald-500 tracking-tighter drop-shadow-sm">
                                {formatPHP(totalAmount)}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
