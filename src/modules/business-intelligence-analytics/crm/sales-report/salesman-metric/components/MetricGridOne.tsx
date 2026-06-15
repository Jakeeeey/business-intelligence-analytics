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
import { Button } from "@/components/ui/button";
import { Store, Eye, Plus } from "lucide-react";
import { MetricRow } from "../types";

interface MetricGridOneProps {
  rows: MetricRow[];
  loading: boolean;
  onViewSupplierBreakdown?: (salesmanId: number, salesmanName: string) => void;
  onViewFrequencyDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewNewAccountsDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
}

export function MetricGridOne({
  rows,
  loading,
  onViewSupplierBreakdown,
  onViewFrequencyDetail,
  onViewNewAccountsDetail,
}: MetricGridOneProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  return (
    <Card className="border-border/60 bg-card dark:border-zinc-800">
      <CardHeader className="py-4 px-6 border-b border-border/40 dark:border-zinc-800/40">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Salesman Metrics (Grid 1)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 dark:bg-zinc-900/50">
              <TableRow className="border-b border-border/60 dark:border-zinc-800">
                <TableHead className="font-semibold text-foreground/80 py-3 pl-6">Salesman</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Sales Performance (Metric 1)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Reach (Metric 2)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3">Frequency (Metric 3)</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-3 pr-6">New Accounts (Metric 4)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-border/40 dark:border-zinc-800/40 animate-pulse">
                    <TableCell className="py-4 pl-6"><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                    <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                    <TableCell className="py-4"><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                    <TableCell className="py-4"><div className="h-4 w-28 bg-muted rounded" /></TableCell>
                    <TableCell className="py-4 pr-6"><div className="h-4 w-16 bg-muted rounded" /></TableCell>
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(row.salesPerformance)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                          title="View sales breakdown by supplier"
                          onClick={() => onViewSupplierBreakdown?.(row.salesmanId, row.salesmanName)}
                        >
                          <Store className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {row.reach} customers
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold">{row.frequencyCount} Transactions</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(row.frequencyAmount)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                          title="View detailed transaction history"
                          onClick={() => onViewFrequencyDetail?.(row.salesmanId, row.salesmanCode || "", row.salesmanName)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-medium pr-6">
                      <div className="flex items-center gap-2">
                        <span>{row.newAccounts} accounts</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                          title="View new accounts details"
                          onClick={() => onViewNewAccountsDetail?.(row.salesmanId, row.salesmanCode || "", row.salesmanName)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
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
