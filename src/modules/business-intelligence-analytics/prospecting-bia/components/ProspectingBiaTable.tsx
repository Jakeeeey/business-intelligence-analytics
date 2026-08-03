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

type GroupedItem = {
  salesmanName: string;
  province: string;
  storeTypeName: string;
  customerName: string;
};

type ProspectingBiaTableProps = {
  data: GroupedItem[];
};

export default function ProspectingBiaTable({ data }: ProspectingBiaTableProps) {
  // Pre-calculate rowspans for Salesman, Area (Province), and Store Type
  const rowSpans = React.useMemo(() => {
    const salesmanSpans: number[] = new Array(data.length).fill(0);
    const provinceSpans: number[] = new Array(data.length).fill(0);
    const storeTypeSpans: number[] = new Array(data.length).fill(0);

    let i = 0;
    while (i < data.length) {
      let j = i;
      // Count consecutive items with the same Salesman
      while (j < data.length && data[j].salesmanName === data[i].salesmanName) {
        j++;
      }
      const salesmanCount = j - i;
      salesmanSpans[i] = salesmanCount;

      // Inside this Salesman group, calculate Province spans
      let k = i;
      while (k < j) {
        let l = k;
        while (l < j && data[l].province === data[k].province) {
          l++;
        }
        provinceSpans[k] = l - k;

        // Inside this Province group, calculate Store Type spans
        let m = k;
        while (m < l) {
          let n = m;
          while (n < l && data[n].storeTypeName === data[m].storeTypeName) {
            n++;
          }
          storeTypeSpans[m] = n - m;
          m = n;
        }

        k = l;
      }

      i = j;
    }

    return { salesmanSpans, provinceSpans, storeTypeSpans };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Prospecting Records</EmptyTitle>
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
          Prospecting Grouped View
        </CardTitle>
        <Badge variant="outline" className="font-semibold text-xs py-0.5">
          {data.length} unique records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[60vh] scrollbar-thin">
          <Table className="w-full border-collapse">
            <TableHeader className="relative z-10">
              <TableRow className="hover:bg-transparent bg-muted/25">
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-1/4 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Salesman
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-1/4 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Area (Province)
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-2 w-1/4 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Store Type
                </TableHead>
                <TableHead className="font-bold text-foreground border-b border-border px-4 py-2 w-1/4 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Customer Name
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => {
                const salesmanSpan = rowSpans.salesmanSpans[idx];
                const provinceSpan = rowSpans.provinceSpans[idx];
                const storeTypeSpan = rowSpans.storeTypeSpans[idx];

                return (
                  <TableRow
                    key={idx}
                    className="hover:bg-muted/10 transition-colors duration-150 border-b border-border last:border-0"
                  >
                    {/* Salesman column with rowSpan */}
                    {salesmanSpan > 0 && (
                      <TableCell
                        rowSpan={salesmanSpan}
                        className="align-middle font-semibold text-foreground border-r border-b border-border px-4 py-2 bg-card"
                      >
                        {item.salesmanName}
                      </TableCell>
                    )}

                    {/* Area/Province column with rowSpan */}
                    {provinceSpan > 0 && (
                      <TableCell
                        rowSpan={provinceSpan}
                        className="align-middle text-muted-foreground border-r border-b border-border px-4 py-2 bg-card/40"
                      >
                        {item.province}
                      </TableCell>
                    )}

                    {/* Store Type column with rowSpan */}
                    {storeTypeSpan > 0 && (
                      <TableCell
                        rowSpan={storeTypeSpan}
                        className="align-middle text-foreground border-r border-b border-border px-4 py-2 bg-card/10"
                      >
                        {item.storeTypeName}
                      </TableCell>
                    )}

                    {/* Customer Name column */}
                    <TableCell className="align-middle text-foreground border-b border-border px-4 py-2">
                      {item.customerName}
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
