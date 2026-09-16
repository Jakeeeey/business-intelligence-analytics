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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Store, Calendar, TrendingUp } from "lucide-react";

interface SupplierBreakdownItem {
  supplierId: number;
  supplierName: string;
  netAmount: number;
  percentage: number;
}

interface SupplierSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanName: string;
  startDate: string;
  endDate: string;
}

export function SupplierSalesModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanName,
  startDate,
  endDate,
}: SupplierSalesModalProps) {
  const [data, setData] = useState<SupplierBreakdownItem[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchBreakdown() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          mode: "supplier-breakdown",
          salesmanId: String(salesmanId),
          startDate,
          endDate,
        });

        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${queryParams.toString()}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data || []);
          setTotalSales(json.totalSales || 0);
        } else {
          setData([]);
          setTotalSales(0);
        }
      } catch (err) {
        console.error("Error fetching supplier sales breakdown:", err);
        setData([]);
        setTotalSales(0);
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, [isOpen, salesmanId, startDate, endDate]);

  const formatPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-fit sm:min-w-[600px] max-w-[95vw] w-full max-h-[85vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <Store className="h-3 w-3 text-primary" /> Supplier Breakdown
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">SALES BY SUPPLIER</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {startDate} to {endDate}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                {data.length} Suppliers
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading supplier sales...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 my-4 flex-shrink-0">
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm py-2 gap-1">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Sales</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                    {formatPHP(totalSales)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/30 border-muted/40 shadow-sm backdrop-blur-sm py-2 gap-1">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-primary" /> Top Supplier
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="text-2xl font-black tracking-tight text-foreground">
                    {data.length > 0 ? data[0].supplierName : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="flex-1 min-h-0 border border-border/40 rounded-xl bg-card/10">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="w-[50px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                    <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Supplier Name</TableHead>
                    <TableHead className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Value</TableHead>
                    <TableHead className="w-[120px] text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <TableRow key={item.supplierId || index} className="hover:bg-muted/20 border-border/40 group">
                        <TableCell className="font-mono text-xs text-muted-foreground/50 font-bold">{index + 1}</TableCell>
                        <TableCell className="font-bold text-xs uppercase tracking-tight text-foreground/80 group-hover:text-foreground">
                          {item.supplierName}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-500/90 group-hover:text-emerald-400">
                          {formatPHP(item.netAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-mono text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                            <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500/80"
                                style={{ width: `${Math.min(Math.max(item.percentage, 0), 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs uppercase font-bold text-muted-foreground">
                        No supplier sales data found
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
