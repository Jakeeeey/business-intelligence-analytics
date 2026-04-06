"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useDriverKPI } from "../hooks/useDriverKPI";
import { calculateKPIs } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";

export default function KPICards() {
  const { data, prevData, setFilters } = useDriverKPI();
  const {
    unfulfilled,
    fulfillmentRate,
    avgDispatchVarianceHours,
    revenueAtRisk,
  } = calculateKPIs(data);
  const prev = calculateKPIs(prevData ?? []);

  function pctChange(curr: number, prevVal: number) {
    if (!Number.isFinite(curr) || !Number.isFinite(prevVal)) return 0;
    if (prevVal === 0) return curr === 0 ? 0 : 100;
    return Number((((curr - prevVal) / Math.abs(prevVal)) * 100).toFixed(2));
  }

  type KPI = {
    id: string;
    title: string;
    value: string;
    hint?: string;
    icon: React.ReactNode;
    trend?: number;
  };

  const cards: KPI[] = [
    {
      id: "unfulfilled",
      title: "Unfulfilled Orders",
      value: String(unfulfilled),
      hint: "Count",
      icon: <Package className="h-5 w-5 text-indigo-500" />,
      trend: pctChange(unfulfilled, prev.unfulfilled),
    },
    {
      id: "fulfillmentRate",
      title: "Fulfillment Rate",
      value: `${fulfillmentRate}%`,
      hint: "Percent",
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      trend: pctChange(fulfillmentRate, prev.fulfillmentRate),
    },
    {
      id: "avgVariance",
      title: "Average Dispatch Variance",
      value: `${avgDispatchVarianceHours} hrs`,
      hint: "Hours",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      trend: pctChange(avgDispatchVarianceHours, prev.avgDispatchVarianceHours),
    },
    {
      id: "revarisk",
      title: "Revenue at Risk",
      value: formatCurrency(revenueAtRisk),
      hint: "Amount",
      icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
      trend: pctChange(revenueAtRisk, prev.revenueAtRisk),
    },
  ];

  function onCardClick(id: string) {
    if (id === "unfulfilled") setFilters({ fulfillmentStatus: "Unfulfilled" });
    if (id === "fulfillmentRate") setFilters({ fulfillmentStatus: null });
    if (id === "revarisk") setFilters({ fulfillmentStatus: "Unfulfilled" });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card
          key={c.id}
          onClick={() => onCardClick(c.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") onCardClick(c.id);
          }}
          className="cursor-pointer hover:shadow transition-shadow border-none h-full"
        >
          <CardContent className="p-4 h-full flex items-start">
            <div className="flex items-start justify-between w-full">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {c.title}
                </p>
                <p className="text-2xl font-extrabold text-foreground mt-1">
                  {c.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {c.hint}
                </p>
                {typeof c.trend === "number" && (
                  <p
                    className={`text-[11px] mt-1 ${(c.trend ?? 0) > 0 ? "text-emerald-600" : (c.trend ?? 0) < 0 ? "text-rose-600" : "text-muted-foreground"}`}
                  >
                    {(c.trend ?? 0) > 0
                      ? `+${c.trend}% vs prev`
                      : `${c.trend}% vs prev`}
                  </p>
                )}
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/80 border-border flex items-center justify-center w-10 h-10">
                {c.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
