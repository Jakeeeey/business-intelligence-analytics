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
import { CalendarClock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ProspectGroupedItem, ProspectStatus } from "../types";
import { formatPH, formatPHDayMonth } from "../utils/datetime";
import {
  FOLLOW_UP_TERMINAL_LABEL,
  SCHEDULE_URGENCY_PILL,
  formatScheduleRelative,
  getScheduleUrgency,
} from "../utils/schedule";
import { ProspectStatusBadge } from "./ProspectStatusBadge";
import { ProbabilityBadge } from "./ProbabilityBadge";

type ProspectingBiaTableProps = {
  data: ProspectGroupedItem[];
  onSelectCustomer: (id: number) => void;
  /** Schedule only matters for Contacted / All views. */
  showSchedule: boolean;
};

/** Column widths, rebalanced depending on whether the Schedule column renders. */
const COLUMN_WIDTHS = {
  withSchedule: {
    salesman: "w-[15%]",
    area: "w-[13%]",
    storeType: "w-[14%]",
    customer: "w-[19%]",
    probability: "w-[11%]",
    status: "w-[12%]",
  },
  withoutSchedule: {
    salesman: "w-[18%]",
    area: "w-[15%]",
    storeType: "w-[16%]",
    customer: "w-[23%]",
    probability: "w-[13%]",
    status: "w-[15%]",
  },
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

const HEAD_CELL =
  "font-bold text-foreground border-r border-b border-border px-4 py-3 sticky top-0 bg-muted/90 backdrop-blur-xs z-10";

/** Follow-up schedule cell — colour-coded by urgency (overdue / soon / later). */
function ScheduleCell({
  schedule,
  nowMs,
  status,
}: {
  schedule: string | null;
  nowMs: number | null;
  status: ProspectStatus;
}) {
  if (!schedule) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // A finished follow-up states its outcome rather than a stale pending date.
  const terminal = FOLLOW_UP_TERMINAL_LABEL[status];
  if (terminal) {
    return (
      <Badge
        variant="outline"
        title={`Follow-up ${terminal.toLowerCase()} · was scheduled ${formatPH(schedule)}`}
        className={cn(
          "border font-semibold whitespace-nowrap",
          status === "converted"
            ? "border-success/30 bg-success/10 text-success"
            : "border-border bg-muted text-muted-foreground"
        )}
      >
        {terminal}
      </Badge>
    );
  }

  // Urgency applies whenever a follow-up is still live — a contacted prospect
  // that carries a schedule counts too (legacy rows predating the follow-up status).
  const actionable = status === "contacted" || status === "follow-up";
  const urgency = actionable ? getScheduleUrgency(schedule, nowMs) : "none";
  const relative = formatScheduleRelative(schedule, nowMs);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge
        variant="outline"
        title={relative ? `${formatPH(schedule)} (${relative})` : formatPH(schedule)}
        className={cn("gap-1 border font-semibold whitespace-nowrap", SCHEDULE_URGENCY_PILL[urgency])}
      >
        <CalendarClock className="size-3" />
        {formatPHDayMonth(schedule)}
      </Badge>
      {relative && (
        <span
          className={cn(
            "text-[11px] whitespace-nowrap",
            urgency === "overdue" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {relative}
        </span>
      )}
    </div>
  );
}

export default function ProspectingBiaTable({ data, onSelectCustomer, showSchedule }: ProspectingBiaTableProps) {
  const w = showSchedule ? COLUMN_WIDTHS.withSchedule : COLUMN_WIDTHS.withoutSchedule;

  // "Now" captured after mount (keeps render pure) for schedule urgency.
  const [nowMs, setNowMs] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNowMs(Date.now());
  }, []);

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
                <TableHead className={`${HEAD_CELL} ${w.salesman}`}>Salesman</TableHead>
                <TableHead className={`${HEAD_CELL} ${w.area}`}>Area (Province)</TableHead>
                <TableHead className={`${HEAD_CELL} ${w.storeType}`}>Store Type</TableHead>
                <TableHead className={`${HEAD_CELL} ${w.customer}`}>Customer Name</TableHead>
                <TableHead className={`${HEAD_CELL} ${w.probability}`}>Probability</TableHead>
                <TableHead className={`${HEAD_CELL} ${w.status}${showSchedule ? "" : " border-r-0"}`}>Status</TableHead>
                {showSchedule && (
                  <TableHead className={`${HEAD_CELL} w-[16%] border-r-0`}>Schedule</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => {
                const salesmanSpan = rowSpans.salesmanSpans[idx];
                const provinceSpan = rowSpans.provinceSpans[idx];
                const storeTypeSpan = rowSpans.storeTypeSpans[idx];
                const customerLabel = toTitleCase(item.customerName);

                return (
                  <TableRow
                    key={item.id}
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
                          <span className="font-bold text-sm text-foreground tracking-tight block truncate" title={toTitleCase(item.salesmanName)}>
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
                          <span className="text-xs font-semibold text-foreground/80 truncate" title={toTitleCase(item.province)}>
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

                    {/* Customer Name column — the entire cell opens the detail dialog */}
                    <TableCell className="align-middle border-r border-b border-border p-0">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(item.id)}
                        title={customerLabel}
                        aria-label={`View details for ${customerLabel}`}
                        className="flex h-full w-full items-center px-4 py-3 text-left font-medium text-foreground underline-offset-4 transition-colors hover:bg-muted/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <span className="min-w-0 truncate">{customerLabel}</span>
                      </button>
                    </TableCell>

                    {/* Probability column */}
                    <TableCell className="align-middle border-r border-b border-border px-4 py-3">
                      <ProbabilityBadge value={item.probability} />
                    </TableCell>

                    {/* Status column */}
                    <TableCell
                      className={
                        showSchedule
                          ? "align-middle border-r border-b border-border px-4 py-3"
                          : "align-middle border-b border-border px-4 py-3"
                      }
                    >
                      <ProspectStatusBadge status={item.status} />
                    </TableCell>

                    {/* Schedule column — only where it is meaningful (Contacted / All) */}
                    {showSchedule && (
                      <TableCell className="align-middle border-b border-border px-4 py-3">
                        <ScheduleCell
                          schedule={item.schedule}
                          nowMs={nowMs}
                          status={item.status}
                        />
                      </TableCell>
                    )}
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
