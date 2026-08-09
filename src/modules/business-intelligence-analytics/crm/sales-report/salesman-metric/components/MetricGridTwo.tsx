"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, StatusTone } from "@/components/ui/status-badge";
import { MetricRow } from "../types";

interface MetricGridTwoProps {
  rows: MetricRow[];
  loading: boolean;
  onViewProductiveOutletDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewLineSalesDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewBasketCountDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewTacticalSkuDetail?: (salesmanId: number, salesmanName: string) => void;
}

export function MetricGridTwo({ rows, loading, onViewProductiveOutletDetail, onViewLineSalesDetail, onViewBasketCountDetail, onViewTacticalSkuDetail }: MetricGridTwoProps) {
  const getStatusTone = (status: string): StatusTone => {
    const s = status.toLowerCase();
    if (s.includes("met") || s.includes("achieved") || s.includes("above")) return "success";
    if (s.includes("below")) return "warning";
    if (s.includes("no target") || s.includes("none")) return "neutral";
    return "destructive";
  };

  const getProgressColor = (achievement: number, status: string) => {
    if (status.toLowerCase().includes("no target") || status.toLowerCase().includes("none")) return "bg-muted-foreground/30";
    if (achievement >= 100) return "bg-emerald-500";
    if (achievement >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const formatPercentage = (value?: number | null) => {
    if (value === undefined || value === null || isNaN(value)) return "0.00%";
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card className="border-border/60 bg-card dark:border-zinc-800">
      <CardHeader className="py-4 px-6 border-b border-border/40 dark:border-zinc-800/40">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Salesman Metrics (Grid 2)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 dark:bg-zinc-900/50">
              <TableRow className="border-b border-border/60 dark:border-zinc-800">
                <TableHead className="font-semibold text-foreground/80 py-3 pl-6">Salesman</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Productive Outlets (Metric 5)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Line Sales Target (Metric 6)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Basket Count Target (Metric 7)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3 pr-6">Tactical SKU Target (Metric 8)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-border/40 dark:border-zinc-800/40 animate-pulse">
                     <TableCell className="py-4 pl-6"><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                     <TableCell className="py-4"><div className="h-4 w-28 bg-muted rounded" /></TableCell>
                     <TableCell className="py-4"><div className="h-4 w-28 bg-muted rounded" /></TableCell>
                     <TableCell className="py-4"><div className="h-4 w-28 bg-muted rounded" /></TableCell>
                     <TableCell className="py-4 pr-6"><div className="h-4 w-28 bg-muted rounded" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    No data available for the selected salesman/date.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.salesmanId}
                    className="border-b border-border/40 hover:bg-muted/30 dark:border-zinc-800/40 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground py-3.5 pl-6">
                      <div className="font-semibold">{row.salesmanName}</div>
                      <div className="text-xs text-muted-foreground">{row.salesmanCode}</div>
                    </TableCell>
                    <TableCell
                      className={`text-foreground ${onViewProductiveOutletDetail ? "cursor-pointer hover:bg-muted/50 transition-colors rounded-md" : ""}`}
                      onClick={() => onViewProductiveOutletDetail?.(row.salesmanId, row.salesmanName)}
                    >
                      <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {row.productiveOutletsActual} <span className="text-muted-foreground font-normal">/ {row.productiveOutletsTarget}</span>
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatPercentage(row.productiveOutletsAchievement)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                          <div
                            className={`h-full ${getProgressColor(row.productiveOutletsAchievement, row.productiveOutletsStatus)} transition-all duration-500`}
                            style={{ width: `${Math.min(row.productiveOutletsAchievement || 0, 100)}%` }}
                          />
                        </div>
                        <div className="mt-0.5">
                          <StatusBadge tone={getStatusTone(row.productiveOutletsStatus)}>
                            {row.productiveOutletsStatus}
                          </StatusBadge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-foreground ${onViewLineSalesDetail ? "cursor-pointer hover:bg-muted/50 transition-colors rounded-md" : ""}`}
                      onClick={() => onViewLineSalesDetail?.(row.salesmanId, row.salesmanName)}
                    >
                      <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {row.lineSalesActualReceipts} <span className="text-muted-foreground font-normal">/ {row.lineSalesTargetReceiptCount}</span>
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatPercentage(row.lineSalesAchievement)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                          <div
                            className={`h-full ${getProgressColor(row.lineSalesAchievement, row.lineSalesStatus)} transition-all duration-500`}
                            style={{ width: `${Math.min(row.lineSalesAchievement || 0, 100)}%` }}
                          />
                        </div>
                        <div className="mt-0.5">
                          <StatusBadge tone={getStatusTone(row.lineSalesStatus)}>
                            {row.lineSalesStatus}
                          </StatusBadge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-foreground ${onViewBasketCountDetail ? "cursor-pointer hover:bg-muted/50 transition-colors rounded-md" : ""}`}
                      onClick={() => onViewBasketCountDetail?.(row.salesmanId, row.salesmanName)}
                    >
                      <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {row.basketCountActualReceipts} <span className="text-muted-foreground font-normal">/ {row.basketCountTargetReceiptCount}</span>
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatPercentage(row.basketCountAchievement)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                          <div
                            className={`h-full ${getProgressColor(row.basketCountAchievement, row.basketCountStatus)} transition-all duration-500`}
                            style={{ width: `${Math.min(row.basketCountAchievement || 0, 100)}%` }}
                          />
                        </div>
                        <div className="mt-0.5">
                          <StatusBadge tone={getStatusTone(row.basketCountStatus)}>
                            {row.basketCountStatus}
                          </StatusBadge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-foreground pr-6 ${onViewTacticalSkuDetail ? "cursor-pointer hover:bg-muted/50 transition-colors rounded-md" : ""}`}
                      onClick={() => onViewTacticalSkuDetail?.(row.salesmanId, row.salesmanName)}
                    >
                      <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {row.tacticalSkuActualQty} <span className="text-muted-foreground font-normal">/ {row.tacticalSkuTargetQty}</span>
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {formatPercentage(row.tacticalSkuAchievement)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                          <div
                            className={`h-full ${getProgressColor(row.tacticalSkuAchievement, row.tacticalSkuStatus)} transition-all duration-500`}
                            style={{ width: `${Math.min(row.tacticalSkuAchievement || 0, 100)}%` }}
                          />
                        </div>
                        <div className="mt-0.5">
                          <StatusBadge tone={getStatusTone(row.tacticalSkuStatus)}>
                            {row.tacticalSkuStatus}
                          </StatusBadge>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
