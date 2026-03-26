"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PhilippinePeso,
  Wallet,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ExpenseKpis } from "../type";

type KpiCardsProps = {
  kpis: ExpenseKpis;
};

type KpiCardData = {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
};

export default function KpiCards({ kpis }: KpiCardsProps) {
  const balance = kpis.totalPaidAmount - kpis.totalDisbursementAmount;
  const balanceLabel =
    balance < 0
      ? "Outstanding Balance"
      : balance > 0
        ? "Overpayment"
        : "Balanced";

  const kpiData: KpiCardData[] = [
    {
      title: "Total Disbursement Amount",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.totalDisbursementAmount)}
        </div>
      ),
      icon: PhilippinePeso,
      tooltip: `Total value of all recorded disbursement transactions before deductions.\nRepresents the gross payable amount across the selected filters and period `,
    },
    {
      title: "Total Paid Amount",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.totalPaidAmount)}
        </div>
      ),
      icon: Wallet,
      tooltip: `Total amount released or paid for all disbursement transactions.\nIncludes payments that may exceed or differ from the recorded disbursement amount `,
    },
    {
      title: "Net Disbursement Variance",
      value: (
        <div>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <div className="text-xs text-muted-foreground">{balanceLabel}</div>
        </div>
      ),
      icon: RotateCcw,
      tooltip: `Difference between Total Paid Amount and Total Disbursement Amount`,
    },
    {
      title: "Total Transactions",
      value: (
        <div>
          <div className="text-2xl font-bold">
            {formatNumber(kpis.totalTransactions, "en-PH", 0)}
          </div>
        </div>
      ),
      icon: ShoppingCart,
      tooltip: `Represents all transactions regardless of status (Posted or Pending) `,
    },
    {
      title: "Posted Transactions",
      value: (
        <div className="text-2xl font-bold">
          {formatNumber(kpis.postedTransactions, "en-PH", 0)}
        </div>
      ),
      icon: TrendingUp,
      tooltip: `Posted transactions are considered complete and included in financial records `,
    },
    {
      title: "Pending Approvals",
      value: (
        <div className="text-2xl font-bold">
          {formatNumber(kpis.pendingApprovalsCount, "en-PH", 0)}
        </div>
      ),
      icon: Users,
      tooltip: `These may still be under review, pending approval, or awaiting final processing `,
    },
    {
      title: "Total Withholding Tax",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.taxWithholdingImpact)}
        </div>
      ),
      icon: PhilippinePeso,
      tooltip: `Calculated from tax-related accounting entries (e.g., BIR Withholding Tax).\nRepresents amounts withheld and payable to tax authorities `,
    },
  ];

  // Split into 2 rows: first 3 cards, then remaining 4 cards
  const row1 = kpiData.slice(0, 3);
  const row2 = kpiData.slice(3, 7);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {/* Row 1: 4 cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {row1.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card className="cursor-pointer transition-all shadow-sm hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {kpi.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>{kpi.value}</CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
                >
                  <pre className="whitespace-pre-wrap">{kpi.tooltip}</pre>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Row 2: 3 cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {row2.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Tooltip key={index + 4}>
                <TooltipTrigger asChild>
                  <Card className="cursor-pointer transition-all shadow-sm hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {kpi.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold tabular-nums `}>
                        {kpi.value}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-xs rounded-lg border bg-background text-muted-foreground p-3 shadow-lg text-sm"
                >
                  <pre className="whitespace-pre-wrap">{kpi.tooltip}</pre>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
