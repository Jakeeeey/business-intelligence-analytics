"use client";

import * as React from "react";
import type { SalesReportRow } from "../types";
import { formatNumber } from "../utils/format";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function ReportTableSkeletonRows(props: { rows?: number }) {
  const rows = props.rows ?? 6;

  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-3 w-[120px]" />
            </div>
          </TableCell>

          <TableCell>
            <Skeleton className="h-4 w-[260px]" />
          </TableCell>

          {/* FREQ 1 */}
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-[110px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[140px]" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-[110px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[140px]" />
          </TableCell>

          {/* FREQ 2 */}
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-[110px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[140px]" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-[110px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[140px]" />
          </TableCell>

          {/* TOTAL */}
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-[120px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SalesReportTable(props: { rows: SalesReportRow[]; loading?: boolean }) {
  const { rows, loading } = props;

  return (
    <Card className="border-muted">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="w-[200px] align-middle">
                    CLASSIFICATION
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[320px] align-middle">
                    CUSTOMER NAME
                  </TableHead>

                  <TableHead colSpan={4} className="text-center">
                    FREQ 1 ( 1 - 15 )
                  </TableHead>
                  <TableHead colSpan={4} className="text-center">
                    FREQ 2 ( 16 - END )
                  </TableHead>

                  <TableHead rowSpan={2} className="w-[140px] text-right align-middle">
                    TOTAL (SI)
                  </TableHead>
                </TableRow>

                <TableRow>
                  <TableHead className="text-right">Allocated (SO)</TableHead>
                  <TableHead>SO Date</TableHead>
                  <TableHead className="text-right">Net Sales (SI)</TableHead>
                  <TableHead>SI Date</TableHead>

                  <TableHead className="text-right">Allocated (SO)</TableHead>
                  <TableHead>SO Date</TableHead>
                  <TableHead className="text-right">Net Sales (SI)</TableHead>
                  <TableHead>SI Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <ReportTableSkeletonRows rows={7} />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      No content in table
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.classification}</TableCell>
                      <TableCell className="font-medium">{r.customer_name}</TableCell>

                      <TableCell className="text-right">{formatNumber(r.so_1_15)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.so_1_15_date}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.si_1_15)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.si_1_15_date}</TableCell>

                      <TableCell className="text-right">{formatNumber(r.so_16_eom)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.so_16_eom_date}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.si_16_eom)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.si_16_eom_date}</TableCell>

                      <TableCell className="text-right font-semibold">{formatNumber(r.total_si)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
