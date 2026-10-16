// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/components/DeliveryItemDetailModal.tsx
"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Package } from "lucide-react";
import type { DeliveredItemRecord } from "../types";
import { exportItemizedDeliveryCsv } from "../utils/exportCsv";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

type Props = {
  customerName: string | null;
  items: DeliveredItemRecord[];
  onClose: () => void;
};

export function DeliveryItemDetailModalComponent({ customerName, items, onClose }: Props) {
  const isOpen = Boolean(customerName);

  const totalQty = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  const totalAmount = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const handleExport = () => {
    if (!customerName) return;
    const safeName = customerName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    exportItemizedDeliveryCsv(items, `delivered_items_${safeName}.csv`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl lg:max-w-5xl w-[92vw] max-h-[90vh] flex flex-col p-6 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <DialogHeader className="flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">
                {customerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Detailed list of all delivered items for this customer
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 hover:bg-muted dark:hover:bg-zinc-700"
            >
              <Download className="h-3.5 w-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Summary Badges */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/70 bg-muted/30 p-3 dark:border-zinc-800 dark:bg-zinc-800/40 flex-shrink-0">
          <div>
            <span className="text-[11px] text-muted-foreground">Total Units Delivered:</span>
            <div className="text-sm font-bold text-foreground">
              {numFmt.format(totalQty)}
            </div>
          </div>
          <div className="h-6 w-px bg-border/80 dark:bg-zinc-700 hidden sm:block" />
          <div>
            <span className="text-[11px] text-muted-foreground">Total Sales Value:</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {phpFmt.format(totalAmount)}
            </div>
          </div>
          <div className="h-6 w-px bg-border/80 dark:bg-zinc-700 hidden sm:block" />
          <div>
            <span className="text-[11px] text-muted-foreground">Delivery Records:</span>
            <div className="text-sm font-bold text-foreground">
              {items.length} line items
            </div>
          </div>
        </div>

        {/* Itemized Table with safe horizontal and vertical scroll */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border/70 dark:border-zinc-800">
          <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
            <Table className="w-full min-w-[760px]">
              <TableHeader className="bg-muted/80 sticky top-0 z-10 dark:bg-zinc-800 backdrop-blur">
                <TableRow className="border-border/60 dark:border-zinc-800">
                  <TableHead className="text-xs font-semibold whitespace-nowrap w-[110px]">Date</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap w-[180px]">Order No</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap min-w-[220px]">Product Name</TableHead>
                  <TableHead className="text-right text-xs font-semibold whitespace-nowrap w-[100px]">Quantity</TableHead>
                  <TableHead className="text-right text-xs font-semibold whitespace-nowrap w-[120px]">Amount</TableHead>
                  <TableHead className="text-xs font-semibold whitespace-nowrap w-[140px]">Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      <Package className="mx-auto mb-1 h-6 w-6 opacity-40" />
                      No delivered item rows recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow
                      key={`${item.id}-${idx}`}
                      className="border-border/40 hover:bg-muted/30 text-xs dark:border-zinc-800/50 dark:hover:bg-zinc-800/40"
                    >
                      <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                        {item.date}
                      </TableCell>
                      <TableCell className="py-2.5 font-medium text-foreground whitespace-nowrap">
                        <div className="font-mono text-xs">{item.orderNo || item.invoiceNo || "—"}</div>
                        {item.invoiceNo && item.orderNo && (
                          <div className="text-[10px] text-muted-foreground font-normal font-sans">
                            Inv: {item.invoiceNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 font-medium text-foreground max-w-[280px]">
                        <div className="truncate" title={item.productName}>
                          {item.productName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-2.5 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold px-2 py-0.5 text-xs"
                        >
                          {numFmt.format(item.quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2.5 font-medium text-foreground whitespace-nowrap">
                        {phpFmt.format(item.amount)}
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                        {item.supplier || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
