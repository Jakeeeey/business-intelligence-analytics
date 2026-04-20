"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CheckCircle, Clock, DollarSign } from "lucide-react";
import { useDriverKPI } from "../hooks/useDriverKPI";
import { calculateKPIs } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";

export default function KPICards() {
  const { data } = useDriverKPI();
  const {

    fulfillmentRate,
    avgDispatchVarianceHours,

    avgArrivalVarianceHours,
    totalFulfilledAmount,
  } = calculateKPIs(data);

  type KPI = {
    id: string;
    title: string;
    value: string;
    hint?: string;
    description?: string;
    icon: React.ReactNode;
  };

  const cards: KPI[] = [
    {
      id: "dispatchTimeliness",
      title: "Dispatch Timeliness",
      value: `${avgDispatchVarianceHours} hrs`,
      hint: "Average Dispatch Variance",
      description:
        "Delayed dispatches ripple across all deliveries: shows operational efficiency at the start of the chain.",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
    },
    {
      id: "arrivalTimeliness",
      title: "Arrival Timeliness",
      value: `${avgArrivalVarianceHours} hrs`,
      hint: "Average Arrival Variance",
      description:
        "Direct measure of service reliability: critical for customer satisfaction and SLA compliance.",
      icon: <Clock className="h-5 w-5 text-indigo-500" />,
    },
    {
      id: "fulfillmentRate",
      title: "Fulfillment Rate",
      value: `${fulfillmentRate}%`,
      hint: "% Fulfilled Orders",
      description:
        "Measures actual service performance: a missed delivery can cost revenue and credibility.",
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    },
    {
      id: "totalFulfilledAmount",
      title: "Total Fulfilled Amount",
      value: formatCurrency(totalFulfilledAmount),
      hint: "Total Value of Fulfilled Orders",
      description:
        "Connects operational efficiency to revenue impact: shows financial performance of deliveries.",
      icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
    },
  ];

  // cards are informational only; filtering is handled elsewhere

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Tooltip key={c.id}>
          <TooltipTrigger asChild>
            <Card className="hover:shadow transition-shadow border-none h-full">
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
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/80 border-border flex items-center justify-center w-10 h-10">
                    {c.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
          >
            <div className="flex flex-col">
              <div className="font-medium">{c.title}</div>
              {c.description ? (
                <div className="text-sm text-muted-foreground mt-1">
                  {c.description}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">
                  {c.hint}: {c.value}
                </div>
              )}
              {/* trend removed per request */}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
