"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { TacticalSkuProductRow } from "../types";
import { formatNumber, formatPercent } from "../utils/format";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TacticalSkuTableProps = {
  rows: TacticalSkuProductRow[];
  expandedKey: string | null;
  onToggle: (key: string) => void;
  loading: boolean;
};

const PAGE_SIZE = 10;

export function TacticalSkuTable({ rows, expandedKey, onToggle, loading }: TacticalSkuTableProps) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(1);
  }, [rows.length]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const pagedRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Detailed Sku Report</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Breakdown of inventory, reach, and targets across the top SKUs and their active salesmen. Click any product row to view salesman details.
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">No.</TableHead>
                <TableHead className="font-semibold text-foreground">Brand</TableHead>
                <TableHead className="font-semibold text-foreground">Category</TableHead>
                <TableHead className="font-semibold text-foreground">Product Name</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Inventory</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Total Reach</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Target</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Target %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

          <TableBody>
            {loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Loading report...
                </TableCell>
              </TableRow>
            )}

            {!loading && !rows.length && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No data available for the selected filters.
                </TableCell>
              </TableRow>
            )}

            {pagedRows.map((row) => {
              const isExpanded = expandedKey === row.key;
              const isTargetLow = row.targetPercent < 50;

              return (
                <React.Fragment key={row.key}>
                  <TableRow
                    className={`cursor-pointer transition-colors duration-200 hover:bg-muted/50 ${
                      isExpanded ? "bg-muted/30" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    title="Click to view salesman breakdown"
                    onClick={() => onToggle(row.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle(row.key);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{row.rank}</TableCell>
                    <TableCell>{row.brand || "-"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {row.category || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px] font-medium truncate" title={row.productName}>
                      {row.productName}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.inventory)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatNumber(row.totalReach)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.target)}</TableCell>
                    <TableCell className={`text-right font-semibold ${isTargetLow ? "text-destructive" : "text-emerald-500"}`}>
                      {formatPercent(row.targetPercent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 text-muted-foreground transition-transform duration-300",
                          isExpanded ? "rotate-180" : "rotate-0"
                        )}
                        aria-hidden="true"
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow className={cn("transition-colors duration-300", isExpanded ? "bg-muted/30" : "bg-transparent")}> 
                    <TableCell colSpan={9} className="border-0 p-0">
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out",
                          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="p-4">
                          <div className="rounded-lg border bg-background/80 backdrop-blur shadow-sm overflow-hidden">
                            <Table>
                              <TableHeader className="bg-muted/30">
                                <TableRow>
                                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Salesman Name</TableHead>
                                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Code</TableHead>
                                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Reach</TableHead>
                                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Target</TableHead>
                                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Attainment</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.salesmen.map((salesman) => (
                                  <TableRow key={`${row.key}-${salesman.code}-${salesman.salesmanName}`} className="hover:bg-muted/50">
                                    <TableCell className="font-medium text-sm">{salesman.salesmanName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{salesman.code || "-"}</TableCell>
                                    <TableCell className="text-right text-sm">{formatNumber(salesman.reach)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatNumber(salesman.target)}</TableCell>
                                    <TableCell className="text-right font-medium text-sm">
                                      <span className={salesman.percent >= 100 ? "text-emerald-500" : salesman.percent > 0 ? "text-amber-500" : "text-destructive"}>
                                        {formatPercent(salesman.percent)}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}