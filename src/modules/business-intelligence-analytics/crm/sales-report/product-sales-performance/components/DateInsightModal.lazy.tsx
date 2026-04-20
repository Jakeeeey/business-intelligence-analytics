"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TruncateText } from "./TruncateText";
const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPHP = (v: number) => phpFormatter.format(v);

export default function DateInsightModal({
  period,
  revenue,
  transactions,
  topProducts,
  onClose,
}: {
  period: string;
  revenue: number;
  transactions?: number;
  topProducts: { name: string; revenue: number; transactions: number }[];
  onClose: () => void;
}) {
  const fmt = fmtPHP;
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden dark:border-zinc-700">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              Revenue summary for {period}
            </DialogTitle>
            {/* <DialogDescription className="mt-0.5 text-xs">Revenue summary for selected period</DialogDescription> */}
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Revenue
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmt(revenue)}
                </p>
              </div>
              <div className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Transactions
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {(transactions || 0).toLocaleString()}
                </p>
              </div>
              <div />
            </div>
            {topProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Top Products this period
                </p>
                <div className="rounded-md border dark:border-zinc-700 overflow-hidden">
                  <table className="w-full table-fixed text-xs">
                    <thead>
                      <tr className="border-b dark:border-zinc-700 bg-muted/30">
                        <th className="w-[58%] text-left px-3 py-2 font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="w-[17%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Transactions
                        </th>
                        <th className="w-[25%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2 max-w-0">
                            <TruncateText title={p.name}>{p.name}</TruncateText>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.transactions}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
