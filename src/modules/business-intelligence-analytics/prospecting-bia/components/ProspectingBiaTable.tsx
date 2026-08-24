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
import { MapPin } from "lucide-react";

type GroupedItem = {
  id: number;
  salesmanName: string;
  province: string;
  storeTypeName: string;
  customerName: string;
  probability: string;
};

type ProspectingBiaTableProps = {
  data: GroupedItem[];
};

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStoreTypeBadge = (storeTypeName: string) => {
  const clean = storeTypeName.trim().toLowerCase();
  const display = toTitleCase(storeTypeName);

  if (clean.includes("market") || clean.includes("stall")) {
    return (
      <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs select-none border">
        {display}
      </Badge>
    );
  } else if (clean.includes("supermarket") || clean.includes("grocery") || clean.includes("groceries")) {
    return (
      <Badge className="bg-purple-500/10 hover:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs select-none border">
        {display}
      </Badge>
    );
  } else if (clean.includes("convenience") || clean.includes("minimart") || clean.includes("store")) {
    return (
      <Badge className="bg-sky-500/10 hover:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs select-none border">
        {display}
      </Badge>
    );
  } else if (clean.includes("wholesale") || clean.includes("dealer")) {
    return (
      <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs select-none border">
        {display}
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-slate-500/10 hover:bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20 font-semibold px-2.5 py-0.5 rounded-md text-xs select-none border">
        {display}
      </Badge>
    );
  }
};

const getProbabilityBadge = (probStr: string) => {
  const num = parseFloat(probStr.replace("%", ""));
  if (isNaN(num)) return <Badge variant="secondary">{probStr}</Badge>;

  if (num >= 70) {
    return (
      <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold px-2 py-0.5 rounded-full select-none">
        {probStr}
      </Badge>
    );
  } else if (num >= 40) {
    return (
      <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold px-2 py-0.5 rounded-full select-none">
        {probStr}
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20 font-bold px-2 py-0.5 rounded-full select-none">
        {probStr}
      </Badge>
    );
  }
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
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-3 w-1/5 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Salesman
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-3 w-1/5 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Area (Province)
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-3 w-1/5 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Store Type
                </TableHead>
                <TableHead className="font-bold text-foreground border-r border-b border-border px-4 py-3 w-1/5 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Customer Name
                </TableHead>
                <TableHead className="font-bold text-foreground border-b border-border px-4 py-3 w-1/5 sticky top-0 bg-muted/90 backdrop-blur-xs z-10">
                  Probability
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
                        className="align-middle border-r border-b border-border px-4 py-3 bg-card border-l-4 border-l-primary"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-xs shrink-0 select-none border border-primary/20">
                            {getInitials(item.salesmanName)}
                          </div>
                          <span className="font-bold text-sm text-foreground tracking-tight block">
                            {toTitleCase(item.salesmanName)}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {/* Area/Province column with rowSpan */}
                    {provinceSpan > 0 && (
                      <TableCell
                        rowSpan={provinceSpan}
                        className="align-middle border-r border-b border-border px-4 py-3 bg-card/30"
                      >
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground/80">
                            {toTitleCase(item.province)}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {/* Store Type column with rowSpan */}
                    {storeTypeSpan > 0 && (
                      <TableCell
                        rowSpan={storeTypeSpan}
                        className="align-middle border-r border-b border-border px-4 py-3 bg-card/10"
                      >
                        {getStoreTypeBadge(item.storeTypeName)}
                      </TableCell>
                    )}

                    {/* Customer Name column */}
                    <TableCell className="align-middle font-medium text-foreground border-r border-b border-border px-4 py-3">
                      {toTitleCase(item.customerName)}
                    </TableCell>

                    {/* Probability column */}
                    <TableCell className="align-middle border-b border-border px-4 py-3">
                      {getProbabilityBadge(item.probability)}
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
