// src/modules/business-intelligence-analytics/crm/sales-report/delivered-items/components/DeliveredItemsKpis.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PackageCheck, PhilippinePeso, Users, Boxes } from "lucide-react";
import type { DeliveredItemsKpis } from "../types";

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numFmt = new Intl.NumberFormat("en-US");

type Props = {
  kpis: DeliveredItemsKpis;
};

export function DeliveredItemsKpisComponent({ kpis }: Props) {
  const cards = [
    {
      title: "Total Units Delivered",
      value: numFmt.format(kpis.totalDeliveredItems),
      subtitle: "Fulfilled quantity across orders",
      icon: PackageCheck,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50/80 dark:bg-blue-950/50",
      iconBorder: "border-blue-200/60 dark:border-blue-800/50",
      topAccent: "bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400",
      hoverBorder: "hover:border-blue-500/40 dark:hover:border-blue-500/40",
      dotColor: "bg-blue-500",
    },
    {
      title: "Total Delivered Value",
      value: phpFmt.format(kpis.totalDeliveredAmount),
      subtitle: "Gross sales value of delivered items",
      icon: PhilippinePeso,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50/80 dark:bg-emerald-950/50",
      iconBorder: "border-emerald-200/60 dark:border-emerald-800/50",
      topAccent: "bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400",
      hoverBorder: "hover:border-emerald-500/40 dark:hover:border-emerald-500/40",
      dotColor: "bg-emerald-500",
    },
    {
      title: "Customers Served",
      value: numFmt.format(kpis.activeCustomersCount),
      subtitle: "Accounts receiving deliveries",
      icon: Users,
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50/80 dark:bg-violet-950/50",
      iconBorder: "border-violet-200/60 dark:border-violet-800/50",
      topAccent: "bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-400",
      hoverBorder: "hover:border-violet-500/40 dark:hover:border-violet-500/40",
      dotColor: "bg-violet-500",
    },
    {
      title: "Distinct Products",
      value: numFmt.format(kpis.uniqueProductsCount),
      subtitle: "Unique SKUs delivered to date",
      icon: Boxes,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50/80 dark:bg-amber-950/50",
      iconBorder: "border-amber-200/60 dark:border-amber-800/50",
      topAccent: "bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400",
      hoverBorder: "hover:border-amber-500/40 dark:hover:border-amber-500/40",
      dotColor: "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`group relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/90 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/90 ${card.hoverBorder}`}
          >
            {/* Top decorative accent bar */}
            <div className={`h-1 w-full ${card.topAccent}`} />

            <CardContent className="p-4.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground transition-colors">
                    {card.value}
                  </div>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105 ${card.iconBorder} ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-border/40 dark:border-zinc-800/60">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.dotColor}`} />
                <p className="truncate text-[11px] font-normal text-muted-foreground">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
