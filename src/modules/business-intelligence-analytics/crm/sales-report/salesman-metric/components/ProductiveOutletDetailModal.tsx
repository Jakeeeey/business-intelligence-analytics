"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, Target, Store, LayoutGrid } from "lucide-react";
import { StatusBadge, StatusTone } from "@/components/ui/status-badge";

interface ProductiveOutletData {
  salesmanId: number;
  targetMonth: number;
  targetYear: number;
  targetProductiveOutlets: number;
  targetStatus: string;
  productiveCustomerCode: string[] | null;
  validInvoiceCount: number;
}

interface ProductiveOutletDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanName: string;
  targetMonth: number;
  targetYear: number;
}

export function ProductiveOutletDetailModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanName,
  targetMonth,
  targetYear,
}: ProductiveOutletDetailModalProps) {
  const [data, setData] = useState<ProductiveOutletData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "productive-outlet-detail",
          salesmanId: String(salesmanId),
          targetMonth: String(targetMonth),
          targetYear: String(targetYear),
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();
        
        // The endpoint returns an array, we just need the first item
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setData(json.data[0]);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Error fetching productive outlet details:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, salesmanId, targetMonth, targetYear]);

  const getStatusTone = (status: string): StatusTone => {
    const s = status.toLowerCase();
    if (s.includes("met") || s.includes("achieved") || s.includes("above")) return "success";
    if (s.includes("below")) return "warning";
    if (s.includes("no target") || s.includes("none")) return "neutral";
    return "destructive";
  };

  const getProgressColor = (achievement: number, status: string) => {
    if (status.toLowerCase().includes("no target") || status.toLowerCase().includes("none")) return "bg-muted-foreground/30";
    if (achievement >= 100) return "bg-emerald-500";
    if (achievement >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const actualCount = data?.validInvoiceCount ?? 0;
  const targetCount = data?.targetProductiveOutlets ?? 0;
  
  // Calculate percentage safely
  const achievementPercent = targetCount > 0 
    ? (actualCount / targetCount) * 100 
    : (actualCount > 0 ? 100 : 0);
    
  const cappedPercent = Math.min(achievementPercent, 100);
  
  const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString('default', { month: 'long' });
  const customers = data?.productiveCustomerCode || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-full max-h-[90vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <Store className="h-3.5 w-3.5 text-primary" /> Productive Outlet Target
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">METRIC 5 BREAKDOWN</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {monthName} {targetYear}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading target data...</p>
          </div>
        ) : !data ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">No data available for this period</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 my-6 flex-shrink-0">
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Actual Productive Outlets</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5">
                  <div className="text-3xl font-black text-foreground tracking-tighter">
                    {actualCount}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="h-3 w-3 text-primary" /> Target Outlets
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-2.5 flex justify-between items-end">
                  <div className="text-3xl font-black text-muted-foreground tracking-tighter">
                    {targetCount}
                  </div>
                  <div className="mb-1">
                    <StatusBadge tone={getStatusTone(data.targetStatus)}>
                      {data.targetStatus}
                    </StatusBadge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Large Progress Bar */}
            <div className="mb-8 px-2 flex-shrink-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">Achievement</span>
                <span className="text-xl font-black tracking-tighter">
                  {achievementPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full bg-muted/50 overflow-hidden rounded-full shadow-inner border border-border/20">
                <div
                  className={`h-full ${getProgressColor(achievementPercent, data.targetStatus)} transition-all duration-1000 ease-out relative`}
                  style={{ width: `${cappedPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse opacity-50"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex-shrink-0 pl-1">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" /> Productive Customers List
            </div>

            {/* Scrollable Table Area */}
            <ScrollArea className="flex-1 min-h-0 border border-border/40 rounded-xl bg-card/10">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="w-[60px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Customer Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers && customers.length > 0 ? (
                    customers.map((code, index) => (
                      <TableRow key={`${code}-${index}`} className="hover:bg-muted/20 border-border/40 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold py-3">{index + 1}</TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm font-mono font-bold tracking-tight text-foreground/90">
                            {code}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-32 text-center text-xs uppercase font-bold text-muted-foreground">
                        {actualCount > 0 
                          ? "Productive customer codes not provided by backend" 
                          : "No productive outlets for this period"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
