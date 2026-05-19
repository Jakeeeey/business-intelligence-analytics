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
  const balance = kpis.totalDisbursementAmount - kpis.totalPaidAmount;

  const balanceTitle =
    balance > 0
      ? "Unsettled Payables"
      : balance < 0
        ? "Overpayment"
        : "Balanced Disbursement";

  const balanceSubtitle =
    balance > 0
      ? "Unpaid amount remaining"
      : balance < 0
        ? "Paid exceeds disbursement"
        : "No variance";

  const kpiData: KpiCardData[] = [
    {
      title: "Total Disbursement Amount",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.totalDisbursementAmount)}
        </div>
      ),
      icon: PhilippinePeso,
      tooltip: `Total value of all recorded disbursement transactions before deductions.
Represents the gross payable amount across the selected filters and period.`,
    },
    {
      title: "Total Paid Amount",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.totalPaidAmount)}
        </div>
      ),
      icon: Wallet,
      tooltip: `Total amount released or paid for all disbursement transactions.
Includes payments that may exceed or differ from the recorded disbursement amount.`,
    },
    {
      title: balanceTitle,
      value: (
        <div>
          <div className="text-2xl font-bold">
            {formatCurrency(Math.abs(balance))}
          </div>
          <div className="text-xs text-muted-foreground">
            {balanceSubtitle}
          </div>
        </div>
      ),
      icon: RotateCcw,
      tooltip:
        balance > 0
          ? "Remaining unpaid amount based on Disbursement Amount minus Paid Amount."
          : balance < 0
            ? "Overpayment based on Paid Amount exceeding Disbursement Amount."
            : "Paid Amount matches Disbursement Amount exactly.",
    },
    {
      title: "Total Transactions",
      value: (
        <div>
          <div className="text-2xl font-bold">
            {formatNumber(kpis.totalTransactions, "en-PH", 0)}
          </div>
          <div className="text-xs opacity-50 pl-1">
            {formatNumber(kpis.totalLineTransaction, "en-PH", 0)} Total Line Items
          </div>
        </div>
      ),
      icon: ShoppingCart,
      tooltip: `Represents all transactions regardless of status (Posted or Pending).`,
    },
    {
      title: "Posted Transactions",
      value: (
        <div className="text-2xl font-bold">
          {formatNumber(kpis.postedTransactions, "en-PH", 0)}
        </div>
      ),
      icon: TrendingUp,
      tooltip: `Posted transactions are considered complete and included in financial records.`,
    },
    {
      title: "Pending Approvals",
      value: (
        <div className="text-2xl font-bold">
          {formatNumber(kpis.pendingApprovalsCount, "en-PH", 0)}
        </div>
      ),
      icon: Users,
      tooltip: `Transactions still under review, pending approval, or awaiting final processing.`,
    },
    {
      title: "Total Withholding Tax",
      value: (
        <div className="text-2xl font-bold">
          {formatCurrency(kpis.taxWithholdingImpact)}
        </div>
      ),
      icon: PhilippinePeso,
      tooltip: `Calculated from tax-related accounting entries (e.g., BIR Withholding Tax).
Represents amounts withheld and payable to tax authorities.`,
    },
  ];

  const row1 = kpiData.slice(0, 3);
  const row2 = kpiData.slice(3, 7);

  const renderCard = (kpi: KpiCardData, key: number) => {
    const Icon = kpi.icon;

    return (
      <Tooltip key={key}>
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
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {row1.map((kpi, index) => renderCard(kpi, index))}
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {row2.map((kpi, index) => renderCard(kpi, index + 3))}
        </div>
      </div>
    </TooltipProvider>
  );
}