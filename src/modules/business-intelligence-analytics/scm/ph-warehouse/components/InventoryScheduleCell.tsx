"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PhysicalInventoryRecord } from "../types";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Props {
  record: PhysicalInventoryRecord;
  colSpan: number;
}

export const InventoryScheduleCell: React.FC<Props> = ({ record, colSpan }) => {
  const [open, setOpen] = useState(false);

  const isCommitted = Boolean(record.isComitted);
  const isCancelled = Boolean(record.isCancelled);
  const isOffset = Boolean(record.is_offset);

  // Simple, elegant, minimalist cell
  let cellClass =
    "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 dark:hover:bg-sky-900/50";

  if (isCommitted) {
    cellClass =
      "bg-emerald-600 text-white font-medium hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 shadow-sm";
  } else if (isCancelled) {
    cellClass =
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <td
        colSpan={colSpan}
        onClick={() => setOpen(true)}
        className="p-1 cursor-pointer align-middle"
      >
        <div
          className={`h-11 px-1.5 py-0.5 flex flex-col items-center justify-center rounded border text-xs font-medium transition-colors select-none ${cellClass}`}
        >
          <span className="truncate leading-tight font-semibold">{record.ph_no}</span>
          <span
            className={`text-[9px] uppercase tracking-wider font-bold leading-tight mt-0.5 px-1 py-0.2 rounded ${
              isOffset
                ? isCommitted
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                : isCommitted
                ? "text-emerald-100 opacity-90"
                : "text-muted-foreground opacity-80"
            }`}
          >
            {isOffset ? "Offset" : "No Offset"}
          </span>
        </div>
      </td>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-semibold">
                {record.ph_no}
              </DialogTitle>
              {isCommitted ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Committed
                </Badge>
              ) : isCancelled ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" /> Cancelled
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" /> {record.status || "Pending"}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 text-sm py-2">
            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Branch</span>
              <span className="font-medium text-foreground">
                {record.branch_name || `Branch #${record.branch_id}`}
              </span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Supplier</span>
              <span className="font-medium text-foreground truncate block">
                {record.supplier_name || `Supplier #${record.supplier_id}`}
              </span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Starting Date</span>
              <span className="font-medium text-foreground">{formatDateTime(record.starting_date)}</span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Cut-Off Date</span>
              <span className="font-medium text-foreground">{formatDateTime(record.cutOff_date)}</span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Price / Stock Type</span>
              <span className="font-medium text-foreground">
                {record.price_type || "-"} / {record.stock_type || "-"}
              </span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground block">Offset Status</span>
              <span className="font-medium text-foreground">
                {isOffset ? "Offset" : "No Offset"}
              </span>
            </div>

            <div className="rounded border p-2.5 bg-muted/30 col-span-2">
              <span className="text-xs text-muted-foreground block">Total Amount</span>
              <span className="font-medium text-foreground">
                {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
                  record.total_amount || 0
                )}
              </span>
            </div>
          </div>

          {record.remarks && (
            <div className="text-xs text-muted-foreground border rounded p-2.5 bg-muted/10">
              <span className="font-medium text-foreground block mb-0.5">Remarks</span>
              <p>{record.remarks}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
