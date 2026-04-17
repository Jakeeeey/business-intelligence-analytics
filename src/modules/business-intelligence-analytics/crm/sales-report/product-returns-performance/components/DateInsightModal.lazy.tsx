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
import { ArrowUpDown } from "lucide-react";
const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPHP = (v: number) => phpFormatter.format(v);
const formatShare = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";

export default function DateInsightModal({
  period,
  returnValue,
  returnCount,
  topProducts,
  onClose,
}: {
  period: string;
  returnValue: number;
  returnCount?: number;
  topProducts: { name: string; returnValue: number; returnCount: number }[];
  onClose: () => void;
}) {
  const fmt = fmtPHP;
  const [sortBy, setSortBy] = React.useState<"count" | "value">("value");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const sortedProducts = React.useMemo(
    () =>
      [...topProducts].sort((a, b) => {
        const cmp =
          sortBy === "count"
            ? a.returnCount - b.returnCount
            : a.returnValue - b.returnValue;
        return sortOrder === "asc" ? cmp : -cmp;
      }),
    [topProducts, sortBy, sortOrder],
  );
  const topProductsTotalCount = React.useMemo(
    () => topProducts.reduce((sum, product) => sum + product.returnCount, 0),
    [topProducts],
  );
  const topProductsTotalValue = React.useMemo(
    () => topProducts.reduce((sum, product) => sum + product.returnValue, 0),
    [topProducts],
  );
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden ">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              Return summary for {period}
            </DialogTitle>
            {/* <DialogDescription className="mt-0.5 text-xs">Return summary for selected period</DialogDescription> */}
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border  bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Return Value
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {fmt(returnValue)}
                </p>
              </div>
              <div className="rounded-lg border  bg-muted/30 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                  Return Count
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {(returnCount || 0).toLocaleString()}
                </p>
              </div>
              <div />
            </div>

            {topProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Top Return Products this period
                </p>
                <div className="rounded-md border  overflow-hidden">
                  <table className="table-fixed w-full text-xs">
                    <thead>
                      <tr className="border-b  bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Return Value
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Count Share (%)
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Value Share (%)
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortBy === "count") {
                                setSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setSortBy("count");
                                setSortOrder("desc");
                              }
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            Count Share (%) <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortBy === "value") {
                                setSortOrder((o) =>
                                  o === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setSortBy("value");
                                setSortOrder("desc");
                              }
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            Value Share (%) <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((p, i) => (
                        <tr
                          key={p.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-right">
                            {p.returnCount}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(p.returnValue)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(p.returnCount, topProductsTotalCount)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(p.returnValue, topProductsTotalValue)}
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
