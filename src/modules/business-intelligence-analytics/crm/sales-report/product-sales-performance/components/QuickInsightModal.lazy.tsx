"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { ProductSaleRecord } from "../types";
import { TruncateText } from "./TruncateText";

const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPHP = (v: number) => phpFormatter.format(v);

export default function QuickInsightModal({
  config,
  filteredData,
  onClose,
  onNavigateToTab,
}: {
  config: {
    type: string;
    item: { name: string; revenue: number; count: number };
    rank: number;
    color: string;
  };
  filteredData: ProductSaleRecord[];
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}) {
  const fmt = fmtPHP;
  const avg =
    config.item.count > 0 ? config.item.revenue / config.item.count : 0;

  const relatedRows = React.useMemo(() => {
    const { type, item } = config;
    const makeMap = (
      filterFn: (r: ProductSaleRecord) => boolean,
      keyFn: (r: ProductSaleRecord) => string,
    ) => {
      const map = new Map<string, { revenue: number; count: number }>();
      filteredData.filter(filterFn).forEach((r) => {
        // Normalize the key; ensure we don't insert empty string keys
        const raw = keyFn(r);
        const k = raw && String(raw).trim() ? String(raw).trim() : "";
        const prev = map.get(k) || { revenue: 0, count: 0 };
        map.set(k, { revenue: prev.revenue + r.amount, count: prev.count + 1 });
      });
      return Array.from(map.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    };
    if (type === "product")
      return makeMap(
        (r) => r.productName === item.name,
        (r) => r.customerName,
      );
    if (type === "supplier")
      return makeMap(
        (r) => r.supplier === item.name,
        (r) => r.productName,
      );
    if (type === "customer")
      return makeMap(
        (r) => r.customerName === item.name,
        (r) => r.productName,
      );
    if (type === "location") {
      const parts = item.name.split(", ");
      const city = parts[0];
      const province = parts.slice(1).join(", ");
      return makeMap(
        (r) => r.city === city && r.province === province,
        (r) => r.productName,
      );
    }
    return [];
  }, [config, filteredData]);

  const tableLabel =
    config.type === "product"
      ? "Top Customers"
      : config.type === "supplier"
        ? "Top Products"
        : config.type === "customer"
          ? "Top Products Purchased"
          : config.type === "location"
            ? "Top Products"
            : "";

  const canNavigate = ["product", "customer", "supplier", "location"].includes(
    config.type,
  );
  const navTarget =
    config.type === "product"
      ? "product"
      : config.type === "customer"
        ? "product"
        : config.type === "supplier"
          ? "supplier"
          : "location";
  const navLabel =
    config.type === "product"
      ? "View in Product Tab"
      : config.type === "supplier"
        ? "View in Supplier Tab"
        : config.type === "customer"
          ? "View in Product Tab"
          : "View in Location Tab";

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden dark:border-zinc-700">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="flex items-start gap-3 pr-6">
            <div
              className="mt-1 h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-tight wrap-break-words">
                {config.item.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs capitalize">
                {config.type} Rank #{config.rank}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Revenue", value: fmt(config.item.revenue) },
                {
                  label: "Transactions",
                  value: config.item.count.toLocaleString(),
                },
                { label: "Avg / Transaction", value: fmt(avg) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border dark:border-zinc-700 bg-muted/30 dark:bg-white/5 px-3 py-3 text-center"
                >
                  <p className="text-[11px] text-muted-foreground mb-1 leading-tight">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            {relatedRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {tableLabel}
                </p>
                <div className="rounded-md border dark:border-zinc-700 overflow-hidden">
                  <table className="w-full table-fixed text-xs">
                    <thead>
                      <tr className="border-b dark:border-zinc-700 bg-muted/30">
                        <th className="w-[58%] text-left px-3 py-2 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="w-[17%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="w-[25%] text-right px-3 py-2 font-medium text-muted-foreground">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedRows.map((row, i) => (
                        <tr
                          key={`${row.name}-${i}`}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2 max-w-0">
                            <TruncateText title={row.name}>
                              {row.name}
                            </TruncateText>
                          </td>
                          <td className="px-3 py-2 text-right">{row.count}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(row.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {canNavigate && (
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateToTab(navTarget);
                  setTimeout(() => {
                    let id = "";
                    if (config.type === "product") {
                      id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                      window.location.hash = `#${id}`;
                    } else if (config.type === "supplier") {
                      id = `supplier-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                      window.location.hash = `#${id}`;
                    } else if (config.type === "customer") {
                      id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                      window.location.hash = `#${id}`;
                    } else if (config.type === "location") {
                      id = `location-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                      window.location.hash = `#${id}`;
                    }
                    if (id) {
                      setTimeout(() => {
                        const el = document.getElementById(id);
                        if (el)
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                      }, 200);
                    }
                  }, 300);
                }}
              >
                {navLabel}
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
