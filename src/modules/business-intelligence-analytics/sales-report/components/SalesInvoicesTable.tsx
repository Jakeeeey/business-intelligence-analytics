"use client";

import * as React from "react";
import type { SalesInvoiceRow } from "../types";
import { formatNumber } from "../utils/format";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SalesInvoicesTable(props: { rows: SalesInvoiceRow[]; loading?: boolean }) {
  const { rows, loading } = props;

  return (
    <Card className="border-muted">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-base font-semibold">Invoices</div>
          <div className="text-sm text-muted-foreground">
            Customer, PO Date, Sales Invoice Date, Net Amount (SI - SR)
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[420px]">CUSTOMER</TableHead>
                  <TableHead className="w-[160px]">PO DATE</TableHead>
                  <TableHead className="w-[180px]">SALES INVOICE DATE</TableHead>
                  <TableHead className="w-[180px] text-right">NET AMOUNT (SI - SR)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No content in table
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{r.po_date}</TableCell>
                      <TableCell className="text-muted-foreground">{r.si_date}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(r.net_amount)}</TableCell>
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
