"use client";
import * as React from "react";
import { ArrowRight, ArrowUpDown } from "lucide-react";
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
import type { ProductReturnRecord, ModalConfig } from "../types";

const phpFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtPHP = (v: number) => phpFormatter.format(v);
const formatShare = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function QuickInsightModal({
  config,
  filteredData,
  onClose,
  onNavigateToTab,
}: {
  config: ModalConfig;
  filteredData: ProductReturnRecord[];
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}) {
  const fmt = fmtPHP;
  const avg =
    config.item.returnCount > 0
      ? config.item.returnValue / config.item.returnCount
      : 0;

  const relatedRows = React.useMemo(() => {
    const { type, item } = config;
    const makeMap = (
      filterFn: (r: ProductReturnRecord) => boolean,
      keyFn: (r: ProductReturnRecord) => string,
    ) => {
      const map = new Map<
        string,
        { returnValue: number; returnCount: number }
      >();
      filteredData.forEach((r) => {
        if (!filterFn(r)) return;
        const k = keyFn(r);
        const prev = map.get(k) || { returnValue: 0, returnCount: 0 };
        map.set(k, {
          returnValue: prev.returnValue + r.amount,
          returnCount: prev.returnCount + 1,
        });
      });
      return Array.from(map.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.returnValue - a.returnValue)
        .slice(0, 5);
    };
    // top product return modal table
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

  const [sortBy, setSortBy] = React.useState<"count" | "value">("value");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const sortedRows = React.useMemo(
    () =>
      [...relatedRows].sort((a, b) => {
        const cmp =
          sortBy === "count"
            ? a.returnCount - b.returnCount
            : a.returnValue - b.returnValue;
        return sortOrder === "asc" ? cmp : -cmp;
      }),
    [relatedRows, sortBy, sortOrder],
  );

  const relatedRowsTotalCount = React.useMemo(
    () => relatedRows.reduce((sum, row) => sum + row.returnCount, 0),
    [relatedRows],
  );
  const relatedRowsTotalValue = React.useMemo(
    () => relatedRows.reduce((sum, row) => sum + row.returnValue, 0),
    [relatedRows],
  );

  const tableLabel =
    config.type === "product"
      ? "Top Customers"
      : config.type === "supplier"
        ? "Top Products Returned"
        : config.type === "customer"
          ? "Top Products Returned"
          : config.type === "location"
            ? "Top Products Returned"
            : "";

  const canNavigate =
    config.type === "product" ||
    config.type === "customer" ||
    config.type === "supplier" ||
    config.type === "location";

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
      : config.type === "customer"
        ? "View in Product Tab"
        : config.type === "supplier"
          ? "View in Supplier Tab"
          : "View in Location Tab";

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden ">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="flex items-start gap-3 pr-6">
            <div
              className="mt-1 h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-tight wrap-break-word">
                {config.item.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs capitalize">
                {config.type} Return Rank #{config.rank}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="dark:bg-zinc-700" />
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Return Value", value: fmt(config.item.returnValue) },
                {
                  label: "Return Count",
                  value: config.item.returnCount.toLocaleString(),
                },
                { label: "Avg / Return", value: fmt(avg) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border  bg-muted/30 dark:bg-white/5 px-3 py-3 text-center"
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
                <div className="rounded-md border  overflow-hidden">
                  <table className="table-fixed w-full text-xs">
                    <thead>
                      <tr className="border-b  bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Count
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          Return Value
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
                      {sortedRows.map((row, i) => (
                        <tr
                          key={row.name}
                          className={i % 2 === 0 ? "" : "bg-muted/20"}
                        >
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-right">
                            {row.returnCount}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {fmt(row.returnValue)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(
                              row.returnCount,
                              relatedRowsTotalCount,
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatShare(
                              row.returnValue,
                              relatedRowsTotalValue,
                            )}
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
                  let id = "";
                  if (config.type === "product") {
                    id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "supplier") {
                    id = `supplier-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "customer") {
                    id = `product-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  } else if (config.type === "location") {
                    id = `location-row-${config.item.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                  }
                  // Switch tab first so the target tab mounts and attaches its hash listener
                  onNavigateToTab(navTarget);
                  // Then set the hash shortly after to trigger auto-expand in the target tab
                  if (id) {
                    setTimeout(() => {
                      window.location.hash = `#${id}`;
                      // extra delay before attempting to scroll to give the tab content time to render
                      setTimeout(() => {
                        document.getElementById(id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 150);
                    }, 80);
                  }
                }}
              >
                {navLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
