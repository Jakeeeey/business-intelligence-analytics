"use client";

import * as React from "react";
import type { SalesReportRow } from "../types";
import { formatNumber } from "../utils/format";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SalesReportTable(props: { rows: SalesReportRow[]; loading?: boolean }) {
  const { rows, loading } = props;

  return (
    <Card className="border-muted">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[1400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="w-[220px]">CLASSIFICATION</TableHead>
                  <TableHead rowSpan={2} className="w-[320px]">CUSTOMER NAME</TableHead>

                  <TableHead colSpan={4} className="text-center">FREQ 1 (1 - 15)</TableHead>
                  <TableHead colSpan={4} className="text-center">FREQ 2 (16 - END)</TableHead>

                  <TableHead rowSpan={2} className="text-right w-[160px]">TOTAL (SI)</TableHead>
                </TableRow>

                <TableRow>
                  <TableHead className="w-[150px] text-right">Allocated (SO)</TableHead>
                  <TableHead className="w-[180px]">SO Date</TableHead>
                  <TableHead className="w-[150px] text-right">Net Sales (SI)</TableHead>
                  <TableHead className="w-[180px]">SI Date</TableHead>

                  <TableHead className="w-[150px] text-right">Allocated (SO)</TableHead>
                  <TableHead className="w-[180px]">SO Date</TableHead>
                  <TableHead className="w-[150px] text-right">Net Sales (SI)</TableHead>
                  <TableHead className="w-[180px]">SI Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-28 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-28 text-center text-muted-foreground">
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
