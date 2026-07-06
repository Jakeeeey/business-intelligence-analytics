"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

interface ReachCustomer {
  customerCode: string;
  customerName: string;
  dateEntered?: string;
}

interface ReachDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesmanId: number | string;
  salesmanCode: string;
  salesmanName: string;
  startDate?: string;
  endDate?: string;
}

export function ReachDetailModal({
  isOpen,
  onClose,
  salesmanId,
  salesmanCode,
  salesmanName,
  startDate,
  endDate,
}: ReachDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<ReachCustomer[]>([]);

  useEffect(() => {
    if (!isOpen || !salesmanId) return;

    async function fetchBreakdown() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          mode: "reach-breakdown",
          salesmanId: String(salesmanId),
          salesmanCode: salesmanCode,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        const res = await fetch(`/api/bia/crm/sales-report/salesman-metric?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch reach breakdown");
        const json = await res.json();
        
        if (json.success) {
          setCustomers(json.customers || []);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error("Error fetching reach breakdown:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, [isOpen, salesmanId, salesmanCode, startDate, endDate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-full max-h-[85vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl p-6">
        <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
          <div className="flex justify-between items-start pr-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
                <Users className="h-3 w-3 text-primary" /> Reach Breakdown
              </div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-primary italic">{salesmanName}</span>
                <span className="text-muted-foreground text-xs font-bold tracking-widest">METRIC 2 BREAKDOWN</span>
              </DialogTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs font-mono uppercase bg-muted/20">
                {customers.length} Customers
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading reach data...</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 border border-border/40 rounded-xl bg-card/10 mt-4">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="w-[50px] text-[9px] uppercase font-black tracking-wider text-muted-foreground">#</TableHead>
                  <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Customer Code</TableHead>
                  <TableHead className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Customer Name</TableHead>
                  <TableHead className="w-[120px] text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground">Date Entered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-6 w-6 mb-2 opacity-20" />
                        <span className="text-xs font-medium uppercase tracking-wider">No customers found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c, i) => (
                    <TableRow key={i} className="hover:bg-muted/50 border-b border-border/40 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs font-medium text-foreground">{c.customerCode}</TableCell>
                      <TableCell className="text-xs font-bold text-foreground">{c.customerName}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground text-right">{c.dateEntered || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
