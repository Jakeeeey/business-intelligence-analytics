// src/modules/business-intelligence-analytics/sales-report/sales-report-summary/components/KpiCards.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { STTReportKpis } from "../types";
import {
  PhilippinePeso,
  Wallet,
  RotateCcw,
  Users,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

type KpiCardsProps = {
  kpis: STTReportKpis;
};

const phpFmt = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("en-US");
const pct = (v: number) => `${v.toFixed(2)}%`;

const KpiCard = React.memo(
  ({
    explaination,
    title,
    value,
    icon: Icon,
    tooltipLines,
    valueClassName,
  }: {
    explaination: string;
    title: string;
    value: string;
    icon: React.ElementType;
    tooltipLines: { label: string; val: string }[];
    valueClassName?: string;
  }) => {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="dark:border-zinc-700 dark:bg-white/13 cursor-default hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium leading-tight">
                  {title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {/* <Info className="h-3.5 w-3.5 text-muted-foreground/60" /> */}
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold tabular-nums ${valueClassName ?? ""}`}
                >
                  {value}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
          >
            <div className="space-y-1">
              <span className="font-medium ">{explaination}</span>
              {tooltipLines.map((line, i) => (
                <div key={i} className="flex justify-between gap-6">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium tabular-nums ">{line.val}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
KpiCard.displayName = "KpiCard";

export function KpiCards({ kpis }: KpiCardsProps) {
  // Target quantity is based on actual sold – target comparison would need external target data
  //   const TARGET_QTY = 250; // placeholder configurable target
  //   const targetAchievedPct =
  //     TARGET_QTY > 0 ? (kpis.targetQuantity / TARGET_QTY) * 100 : 0;

  type CardDef = {
    explaination: string;
    title: string;
    value: string;
    icon: React.ElementType;
    tooltipLines: { label: string; val: string }[];
    valueClassName?: string;
  };

  const row1: CardDef[] = [
    {
      explaination:"The total sales amount within the selected date range, before accounting for returns and discounts.",
      title: "Total Sales",
      value: phpFmt.format(kpis.totalSales),
      icon: PhilippinePeso,
      tooltipLines: [
        { label: "Total Sales Amount", val: phpFmt.format(kpis.totalSales) },
        {
          label: "Invoice Count",
          val: numFmt.format(kpis.totalSalesInvoiceCount),
        },
      ],
    },
    {
      explaination: "The total amount collected from sales within the selected date range, after accounting for returns and discounts.",
      title: "Net Collections",
      value: phpFmt.format(kpis.netCollections),
      icon: Wallet,
      tooltipLines: [
        { label: "Total Collected", val: phpFmt.format(kpis.netCollections) },
        { label: "Outstanding", val: phpFmt.format(kpis.outstandingPayments) },
      ],
    },
    {
      explaination: "The total value of sales that were returned within the selected date range.",
      title: "Total Returns",
      value: phpFmt.format(kpis.totalReturns),
      icon: RotateCcw,
      tooltipLines: [
        { label: "Return Amount", val: phpFmt.format(kpis.totalReturns) },
        {
          label: "Products Returned",
          val: numFmt.format(kpis.returnedProductCount),
        },
        {
          label: "Invoices w/ Returns",
          val: numFmt.format(kpis.invoicesWithReturns),
        },
      ],
    },
  ];

  const row2: CardDef[] = [
    {
      explaination: "The total number of sales invoices generated within the selected date range.",
      title: "Total Invoices",
      value: numFmt.format(kpis.totalInvoices),
      icon: ShoppingCart,
      tooltipLines: [
        { label: "Total Invoices", val: numFmt.format(kpis.totalInvoices) },
        { label: "Total Sales", val: phpFmt.format(kpis.totalSales) },
      ],
    },
    {
      explaination: "The number of distinct customers who made purchases within the selected date range.",
      title: "Unique Customers",
      value: numFmt.format(kpis.uniqueCustomers),
      icon: Users,
      tooltipLines: [
        { label: "Unique Customers", val: numFmt.format(kpis.uniqueCustomers) },
        { label: "Total Invoices", val: numFmt.format(kpis.totalInvoices) },
        {
          label: "Avg Invoices / Customer",
          val: kpis.avgInvoicesPerCustomer.toFixed(2),
        },
      ],
    },
    {
      explaination:"The percentage of total sales that have been successfully collected within the selected date range.",
      title: "Collection Rate",
      value: pct(kpis.collectionRate),
      icon: TrendingUp,
      tooltipLines: [
        { label: "Collection Rate", val: pct(kpis.collectionRate) },
        { label: "Collected", val: phpFmt.format(kpis.netCollections) },
        { label: "Total Sales", val: phpFmt.format(kpis.totalSales) },
      ],
      valueClassName:
        kpis.collectionRate >= 90
          ? "text-green-600 dark:text-green-400"
          : kpis.collectionRate >= 70
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400",
    },
    
    {
      explaination:"The average revenue generated per sales invoice within the selected date range.",
      title: "Avg Order Value",
      value: phpFmt.format(kpis.avgOrderValue),
      icon: ShoppingCart,
      tooltipLines: [
        { label: "Avg Invoice Value", val: phpFmt.format(kpis.avgOrderValue) },
        { label: "Total Sales", val: phpFmt.format(kpis.totalSales) },
        { label: "Total Invoices", val: numFmt.format(kpis.totalInvoices) },
      ],
    },
    {
      explaination:"The percentage of sales that were returned within the selected date range.",
      title: "Return Rate",
      value: pct(kpis.returnRate),
      icon: RotateCcw,
      tooltipLines: [
        { label: "Return Rate", val: pct(kpis.returnRate) },
        { label: "Total Returns", val: phpFmt.format(kpis.totalReturns) },
        { label: "Total Sales", val: phpFmt.format(kpis.totalSales) },
      ],
      valueClassName:
        kpis.returnRate <= 2
          ? "text-green-600 dark:text-green-400"
          : kpis.returnRate <= 5
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400",
    },
    {
      explaination:"Total discounts given across all transactions within the selected date range.",
      title: "Total Discounts",
      value: phpFmt.format(kpis.totalDiscount),
      icon: PhilippinePeso,
      tooltipLines: [
        { label: "Total Discounts", val: phpFmt.format(kpis.totalDiscount) },
        { label: "Total Sales", val: phpFmt.format(kpis.totalSales) },
        { label: "Total Invoices", val: numFmt.format(kpis.totalInvoices) },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {row1.map((card) => (
          <KpiCard
            explaination={card.explaination}
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tooltipLines={card.tooltipLines}
            valueClassName={card.valueClassName}
          />  
        ))}
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-6">
        {row2.map((card) => (
          <KpiCard
            explaination={card.explaination}
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tooltipLines={card.tooltipLines}
            valueClassName={card.valueClassName}
          />
        ))}
      </div>
    </div>
  );
}
