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
}

export function MetricGridTwo({ rows, loading }: MetricGridTwoProps) {
  const getStatusTone = (status: string): StatusTone => {
    const s = status.toLowerCase();
    if (s.includes("met") || s.includes("achieved") || s.includes("above")) return "success";
    if (s.includes("below")) return "warning";
    if (s.includes("no target") || s.includes("none")) return "neutral";
    return "destructive";
  };

  const formatPercentage = (value: number) => {
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
                <TableHead className="font-semibold text-foreground/80 py-3 pr-6">Metric 8</TableHead>
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
                    <TableCell className="py-4 pr-6"><div className="h-4 w-12 bg-muted rounded" /></TableCell>
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
                    <TableCell className="text-foreground">
                      <div className="font-semibold">{row.productiveOutletsActual} / {row.productiveOutletsTarget}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Achievement: {formatPercentage(row.productiveOutletsAchievement)}
                      </div>
                      <StatusBadge tone={getStatusTone(row.productiveOutletsStatus)}>
                        {row.productiveOutletsStatus}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="font-semibold">{row.lineSalesActualReceipts} Qualified</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Achieved: {formatPercentage(row.lineSalesAchievement)}
                      </div>
                      <StatusBadge tone={getStatusTone(row.lineSalesStatus)}>
                        {row.lineSalesStatus}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="font-semibold">{row.basketCountActualReceipts} Qualified</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Achieved: {formatPercentage(row.basketCountAchievement)}
                      </div>
                      <StatusBadge tone={getStatusTone(row.basketCountStatus)}>
                        {row.basketCountStatus}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="py-4 pr-6">
                      {/* Metric 8 Left blank as requested */}
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
