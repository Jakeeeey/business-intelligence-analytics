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
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export type ActivationItem = {
  id: number;
  customerCode: string;
  customerName: string;
  storeName: string;
  province: string;
  storeType: string;
  dateEntered: string;
  isActivated: boolean;
};

type ActivationTableProps = {
  data: ActivationItem[];
};

export default function ActivationTable({ data }: ActivationTableProps) {
  if (data.length === 0) {
    return (
      <Card className="border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Comparison Records</EmptyTitle>
              <EmptyDescription>Try adjusting your filter selections.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="bg-muted/30 border-b px-4 py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold tracking-tight text-foreground">
          Approved Prospects Activation Status
        </CardTitle>
        <Badge variant="outline" className="font-semibold text-xs py-0.5">
          {data.length} records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[60vh] scrollbar-thin">
          <Table className="w-full border-collapse">
            <TableHeader className="relative z-10">
              <TableRow className="hover:bg-transparent bg-muted/25">
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-[15%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Customer Code
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-[25%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Customer Name
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-[20%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Store Name
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-[15%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Area (Province)
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-[15%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Date Entered
                </TableHead>
                <TableHead className="font-bold text-foreground border-b border-border px-4 py-2 w-[10%] sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const formattedDate = item.dateEntered
                  ? new Date(item.dateEntered).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-";

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/10 transition-colors duration-150 border-b border-border last:border-0"
                  >
                    <TableCell className="align-middle font-semibold text-foreground border-r border-b border-border px-4 py-2">
                      {item.customerCode || "-"}
                    </TableCell>
                    <TableCell className="align-middle text-foreground border-r border-b border-border px-4 py-2">
                      {item.customerName || "-"}
                    </TableCell>
                    <TableCell className="align-middle text-foreground border-r border-b border-border px-4 py-2">
                      {item.storeName || "-"}
                    </TableCell>
                    <TableCell className="align-middle text-muted-foreground border-r border-b border-border px-4 py-2">
                      {item.province || "-"}
                    </TableCell>
                    <TableCell className="align-middle text-muted-foreground border-r border-b border-border px-4 py-2">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="align-middle border-b border-border px-4 py-2">
                      {item.isActivated ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                          Activated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500/55 text-yellow-600 font-semibold bg-yellow-500/10">
                          Pending Activation
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
