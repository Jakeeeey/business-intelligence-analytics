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
import { Loader2, Calendar, Target, Package, LayoutGrid } from "lucide-react";
import { StatusBadge, StatusTone } from "@/components/ui/status-badge";

interface TacticalSkuDetailItem {
  productId: number;
  targetQuantity: number;
  actualQuantity: number;
  quantityAchievementPercentage: number;
  quantityGoalStatus: string;
  targetValue: number;
  actualValue: number;
  valueAchievementPercentage: number;
  valueGoalStatus: string;
}

interface TacticalSkuDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanName: string;
  targetMonth: number;
  targetYear: number;
}

export function TacticalSkuDetailModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanName,
  targetMonth,
  targetYear,
}: TacticalSkuDetailModalProps) {
  const [data, setData] = useState<TacticalSkuDetailItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "tactical-sku-detail",
          salesmanId: String(salesmanId),
          targetMonth: String(targetMonth),
          targetYear: String(targetYear),
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          setData(Array.isArray(json.data) ? json.data : [json.data]);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching tactical sku details:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, salesmanId, targetMonth, targetYear]);

  const getStatusTone = (status: string): StatusTone => {
    const s = (status || "").toLowerCase();
    if (s.includes("met") || s.includes("achieved") || s.includes("above")) return "success";
    if (s.includes("below")) return "warning";
    if (s.includes("no target") || s.includes("none")) return "neutral";
    return "destructive";
  };

  const getProgressColor = (achievement: number, status: string) => {
    if ((status || "").toLowerCase().includes("no target") || (status || "").toLowerCase().includes("none")) return "bg-muted-foreground/30";
    if (achievement >= 100) return "bg-emerald-500";
    if (achievement >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Aggregate totals
  const totalTargetQty = data.reduce((sum, item) => sum + (item.targetQuantity || 0), 0);
  const totalActualQty = data.reduce((sum, item) => sum + (item.actualQuantity || 0), 0);

  const achievementPercent = totalTargetQty > 0
    ? (totalActualQty / totalTargetQty) * 100
    : (totalActualQty > 0 ? 100 : 0);

  const cappedPercent = Math.min(achievementPercent, 100);

  const status = totalTargetQty === 0
    ? "No Target Set"
    : (achievementPercent >= 100 ? "Met Target" : "Below Target");

  const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString('default', { month: 'long' });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-fit sm:min-w-[800px] max-w-[95vw] w-full max-h-[90vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <Package className="h-3.5 w-3.5 text-primary" /> Tactical SKU Target
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">METRIC 8 BREAKDOWN</span>
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
        ) : data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">No tactical SKU targets available for this period</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 my-6 flex-shrink-0">
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm py-2 gap-1">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Actual Total Qty</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-3xl font-black text-foreground tracking-tighter">
                    {totalActualQty.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm py-2 gap-1">
                <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="h-3 w-3 text-primary" /> Target Total Qty
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2 flex justify-between items-end">
                  <div className="text-3xl font-black text-muted-foreground tracking-tighter">
                    {totalTargetQty.toLocaleString()}
                  </div>
                  <div className="mb-1">
                    <StatusBadge tone={getStatusTone(status)}>
                      {status}
                    </StatusBadge>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm py-2 gap-1">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total SKU Lines</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-3xl font-black text-foreground tracking-tighter">
                    {data.length}
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
                  className={`h-full ${getProgressColor(achievementPercent, status)} transition-all duration-1000 ease-out relative`}
                  style={{ width: `${cappedPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse opacity-50"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex-shrink-0 pl-1">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" /> SKU Target List
            </div>

            {/* Scrollable Table Area */}
            <ScrollArea className="flex-1 min-h-0 border border-border/40 rounded-xl bg-card/10">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="w-[60px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Product ID</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground text-right">Target Qty</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground text-right">Actual Qty</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground text-right pr-6">Qty Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={`sku-${item.productId}-${index}`} className="hover:bg-muted/20 border-border/40 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold py-3">{index + 1}</TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-mono font-bold tracking-tight text-foreground/90">
                          {item.productId}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                        {item.targetQuantity}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono font-bold text-foreground/90">
                        {item.actualQuantity}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <StatusBadge tone={getStatusTone(item.quantityGoalStatus)}>
                          {item.quantityGoalStatus || "No Target"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
