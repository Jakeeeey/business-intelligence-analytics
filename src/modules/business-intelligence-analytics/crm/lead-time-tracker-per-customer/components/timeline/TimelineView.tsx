"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";
import type { CustomerLeadTimeFilters, CustomerLeadTimeRow, CustomerLeadTimeRecord } from "../../types";
import { cn } from "@/lib/utils";
import getStatusColor, { getStatusHex } from "../../utils/getStatusColor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EventType = "created" | "approved" | "picking" | "dispatch" | "delivered";
type LifecycleStage = "approval" | "picking" | "dispatch" | "delivery";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RowGroup = {
  poNo: string;
  soNo?: string;
  label?: string;
  events: Record<EventType, Date | null>;
  poDate?: Date | null;
  approvalStatus?: string;
  pickingStatus?: string;
  dispatchStatus?: string;
  deliveryStatus?: string;
  approvalDays?: number | null;
  pickingDays?: number | null;
  dispatchDays?: number | null;
  deliveryDays?: number | null;
  bars?: Array<{
    stage: LifecycleStage;
    days: number | null;
    status?: string | null;
  }>;
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function statusToLabel(status?: string | null) {
  const s = String(status ?? "").toLowerCase();
  if (s === "on-time" || s === "on time" || s === "ontime") return "On Time";
  if (s === "warning" || s === "warn") return "Warning";
  if (s === "delayed" || s === "delay" || s === "late") return "Delayed";
  return "Pending";
}

function stageToLabel(stage: LifecycleStage) {
  if (stage === "approval") return "Approval";
  if (stage === "picking") return "Picking";
  if (stage === "dispatch") return "Dispatch";
  return "Delivery";
}

function formatDateTime(value?: Date | null) {
  if (!value) return "-";
  try {
    return value.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value.toISOString();
  }
}

function formatDurationFromMs(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const totalHours = Math.max(0, Math.round(ms / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  return `${hours}h`;
}

function getStageBounds(stage: LifecycleStage, row: RowGroup) {
  const fallbackStart = row.poDate ?? row.events.created ?? null;
  if (stage === "approval") {
    return {
      start: row.events.created ?? fallbackStart,
      end: row.events.approved ?? null,
    };
  }
  if (stage === "picking") {
    return {
      start: row.events.approved ?? row.events.created ?? fallbackStart,
      end: row.events.picking ?? null,
    };
  }
  if (stage === "dispatch") {
    return {
      start: row.events.picking ?? row.events.approved ?? row.events.created ?? fallbackStart,
      end: row.events.dispatch ?? null,
    };
  }
  return {
    start:
      row.events.dispatch ??
      row.events.picking ??
      row.events.approved ??
      row.events.created ??
      fallbackStart,
    end: row.events.delivered ?? null,
  };
}

function extractEventsFromRecord(r: CustomerLeadTimeRow) {
  return {
    created: parseDate(r.createdDate),
    approved: parseDate(r.approvedDate),
    picking: parseDate(r.pickedConsoDate),
    dispatch: parseDate(r.dispatchedDate),
    delivered: parseDate(r.deliveredDate),
  };
}

function toPx(posDays: number, dayWidth: number) {
  return Math.round(posDays * dayWidth);
}

const getDaysStatus = (days: number | null, isCompleted: boolean) => {
  if (!isCompleted || days == null) return "pending";
  if (days > 3) return "delayed";
  if (days > 1) return "warning";
  return "on-time";
};

export default function TimelineView({
  filters,
  rows,
  loading = false,
  error = null,
  loadedOnce = false,
}: {
  filters: CustomerLeadTimeFilters;
  rows: CustomerLeadTimeRow[];
  loading?: boolean;
  error?: string | null;
  loadedOnce?: boolean;
}) {
  type SortMode =
    | "date-desc"
    | "date-asc"
    | "po-asc"
    | "po-desc"
    | "so-asc"
    | "so-desc";

  const [sortMode, setSortMode] = React.useState<SortMode>("date-desc");
  const [dayWidth, setDayWidth] = React.useState<number>(64);
  const [, setSelectedRecord] = React.useState<Record<string, unknown> | null>(null);

  const title =
    !loading && rows.length === 0
      ? loadedOnce
        ? "No data to display for this customer"
        : "No data to display."
      : "No records available for the selected period";
  const subtitle =
    !loading && rows.length === 0
      ? loadedOnce
        ? "Please select other customer or date range, then click Apply."
        : "Please select a customer and date range, then click Apply."
      : "Please try another customer or choose a different date range.";

  const rowsWithSegments = React.useMemo(() => {
    const map = new Map<string, RowGroup>();

    for (const [rowIndex, rec] of rows.entries()) {
      const po = rec.poNo;
      const so = rec.soNo || undefined;
      const key = po || so || `row-${rowIndex}`;

      const events = extractEventsFromRecord(rec);
      const poDate = parseDate(rec.purchasedDate);

      const approvalDays = rec.approvalDays;
      const pickingDays = rec.pickingDays;
      const dispatchDays = rec.dispatchDays;
      const deliveryDays = rec.deliveryDays;

      const approvalStatus = getDaysStatus(approvalDays, !!rec.approvedDate);
      const pickingStatus = getDaysStatus(pickingDays, !!rec.pickedConsoDate);
      const dispatchStatus = getDaysStatus(dispatchDays, !!rec.dispatchedDate);
      const deliveryStatus = getDaysStatus(deliveryDays, !!rec.deliveredDate);

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          poNo: po || key,
          soNo: so,
          poDate,
          label: rec.customerName || "Unknown Customer",
          events,
          approvalStatus,
          pickingStatus,
          dispatchStatus,
          deliveryStatus,
          approvalDays,
          pickingDays,
          dispatchDays,
          deliveryDays,
        });
      } else {
        for (const k of [
          "created",
          "approved",
          "picking",
          "dispatch",
          "delivered",
        ] as EventType[]) {
          if (!existing.events[k] && events[k]) existing.events[k] = events[k];
        }
        if (!existing.poDate && poDate) existing.poDate = poDate;
        if (!existing.approvalStatus && approvalStatus !== "pending")
          existing.approvalStatus = approvalStatus;
        if (!existing.pickingStatus && pickingStatus !== "pending")
          existing.pickingStatus = pickingStatus;
        if (!existing.dispatchStatus && dispatchStatus !== "pending")
          existing.dispatchStatus = dispatchStatus;
        if (!existing.deliveryStatus && deliveryStatus !== "pending")
          existing.deliveryStatus = deliveryStatus;

        if (existing.approvalDays == null && approvalDays != null)
          existing.approvalDays = approvalDays;
        if (existing.pickingDays == null && pickingDays != null)
          existing.pickingDays = pickingDays;
        if (existing.dispatchDays == null && dispatchDays != null)
          existing.dispatchDays = dispatchDays;
        if (existing.deliveryDays == null && deliveryDays != null)
          existing.deliveryDays = deliveryDays;
        if (!existing.label) {
          existing.label = rec.customerName || "Unknown Customer";
        }
      }
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (sortMode === "date-desc") {
        const ad =
          a.poDate ??
          a.events.created ??
          a.events.approved ??
          a.events.dispatch ??
          a.events.delivered;
        const bd =
          b.poDate ??
          b.events.created ??
          b.events.approved ??
          b.events.dispatch ??
          b.events.delivered;
        if (!ad && !bd) return (a.poNo || "").localeCompare(b.poNo || "");
        if (!ad) return 1;
        if (!bd) return -1;
        return bd.getTime() - ad.getTime();
      }
      if (sortMode === "date-asc") {
        const ad =
          a.poDate ??
          a.events.created ??
          a.events.approved ??
          a.events.dispatch ??
          a.events.delivered;
        const bd =
          b.poDate ??
          b.events.created ??
          b.events.approved ??
          b.events.dispatch ??
          b.events.delivered;
        if (!ad && !bd) return (a.poNo || "").localeCompare(b.poNo || "");
        if (!ad) return 1;
        if (!bd) return -1;
        return ad.getTime() - bd.getTime();
      }

      if (sortMode === "po-asc") {
        return (a.poNo || "").localeCompare(b.poNo || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      if (sortMode === "po-desc") {
        return (b.poNo || "").localeCompare(a.poNo || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      if (sortMode === "so-asc") {
        return (a.soNo || "").localeCompare(b.soNo || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      if (sortMode === "so-desc") {
        return (b.soNo || "").localeCompare(a.soNo || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return 0;
    });

    return arr.map((r: RowGroup) => {
      const bars = [
        {
          stage: "approval" as const,
          days: r.approvalDays ?? null,
          status: r.approvalStatus ?? "pending",
        },
        {
          stage: "picking" as const,
          days: r.pickingDays ?? null,
          status: r.pickingStatus ?? "pending",
        },
        {
          stage: "dispatch" as const,
          days: r.dispatchDays ?? null,
          status: r.dispatchStatus ?? "pending",
        },
        {
          stage: "delivery" as const,
          days: r.deliveryDays ?? null,
          status: r.deliveryStatus ?? "pending",
        },
      ];

      return { ...r, bars };
    });
  }, [rows, sortMode]);

  const { startDate, totalDays, widthPx, months } = React.useMemo(() => {
    const start = parseDate(filters.dateFrom) || new Date();
    const end = parseDate(filters.dateTo) || new Date(start.getTime() + 30 * MS_PER_DAY);
    const durDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1,
    );

    const width = Math.max(800, durDays * dayWidth);

    const monthsArr: Array<{ left: number; width: number; label: string }> = [];
    for (let i = 0; i < durDays; ) {
      const dt = new Date(start.getTime() + i * MS_PER_DAY);
      const year = dt.getFullYear();
      const month = dt.getMonth();
      let j = i;
      while (j < durDays) {
        const dd = new Date(start.getTime() + j * MS_PER_DAY);
        if (dd.getFullYear() !== year || dd.getMonth() !== month) break;
        j++;
      }
      monthsArr.push({
        left: toPx(i, dayWidth),
        width: Math.max(1, (j - i) * dayWidth),
        label: dt.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        }),
      });
      i = j;
    }

    return {
      startDate: start,
      totalDays: durDays,
      widthPx: width,
      months: monthsArr,
    };
  }, [filters.dateFrom, filters.dateTo, dayWidth]);

  const rowHeight = 72;
  const barHeight = rowHeight;
  const headerHeight = 56;
  const dayHeaderTopOffset = 28;
  const timelineContentHeight = Math.max(
    headerHeight + rowHeight,
    headerHeight + rowsWithSegments.length * rowHeight,
  );
  const minSegmentWidth = 18;
  const pendingSegmentWidth = Math.max(
    minSegmentWidth * 3,
    Math.round(dayWidth * 1.5),
  );

  const [nowTs, setNowTs] = React.useState<number>(startDate.getTime());

  React.useEffect(() => {
    setNowTs(Date.now());
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const todayPx = React.useMemo(() => {
    const ms = nowTs - startDate.getTime();
    return toPx(ms / MS_PER_DAY, dayWidth);
  }, [startDate, dayWidth, nowTs]);

  return (
    <Card className="flex flex-col h-full shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4">
        <div>
          <CardTitle className="text-xl">Process Timeline</CardTitle>
          <CardDescription>
            Visual delivery and approval tracking per order
          </CardDescription>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                Sort PO/SO
              </label>
              <Select
                value={sortMode}
                onValueChange={(value) => setSortMode(value as SortMode)}
              >
                <SelectTrigger className="h-8 w-40 text-xs text-muted-foreground">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>

                <SelectContent className="text-xs font-medium text-muted-foreground">
                  <SelectItem value="date-desc">By date (descending)</SelectItem>
                  <SelectItem value="date-asc">By date (ascending)</SelectItem>
                  <SelectItem value="po-asc">PO (A-Z)</SelectItem>
                  <SelectItem value="po-desc">PO (Z-A)</SelectItem>
                  <SelectItem value="so-asc">SO (A-Z)</SelectItem>
                  <SelectItem value="so-desc">SO (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-md border shadow-sm">
              <label className="text-sm font-medium text-muted-foreground">
                Zoom
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={25}
                  max={800}
                  step={1}
                  value={Math.round((dayWidth / 32) * 100)}
                  onChange={(e) => {
                    const v = Number((e.target as HTMLInputElement).value);
                    const newWidth = Math.round((v / 100) * 32);
                    setDayWidth(Math.max(8, Math.min(256, newWidth)));
                  }}
                  className="h-2 w-32 sm:w-40"
                />
                <div className="text-xs font-medium text-muted-foreground w-12 text-right">
                  {Math.round((dayWidth / 32) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Unified Global Legend */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={getStatusHex("pending")} label="Pending" striped />
            <Badge color={getStatusHex("on-time")} label="On time" />
            <Badge color={getStatusHex("warning")} label="Warning" />
            <Badge color={getStatusHex("delayed")} label="Delayed" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden relative">
        {error ? (
          <div className="h-96 flex items-center justify-center p-6">
            <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-center dark:border-red-800 dark:bg-red-950/30">
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                Unable to load timeline data
              </div>
              <div className="mt-1 text-xs text-red-600/90 dark:text-red-400/90">
                {error}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="h-96 flex items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">
              Loading timeline data...
            </div>
          </div>
        ) : rowsWithSegments.length === 0 ? (
          <div className="h-96 flex items-center justify-center p-6">
            <div className="max-w-2xl rounded-lg border border-dashed border-slate-300 bg-muted/20 px-6 py-5 text-center dark:border-slate-700">
              <div className="text-sm font-semibold text-foreground">
                {title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {subtitle}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-120 overflow-auto relative w-full flex flex-col">
            {/* GLOBAL BACKGROUND Day Grid Lines */}
            <div
              className="absolute calendar top-0 pointer-events-none z-0"
              style={{
                left: 224,
                width: widthPx,
                height: timelineContentHeight,
              }}
            >
              {Array.from({ length: totalDays }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-800",
                    [0, 6].includes(new Date(startDate.getTime() + i * MS_PER_DAY).getDay()) &&
                      "bg-muted/10"
                  )}
                  style={{ left: toPx(i, dayWidth), width: dayWidth }}
                />
              ))}
            </div>

            {/* STICKY HEADER ROW */}
            <div className="sticky top-0 z-40 flex min-w-full w-fit bg-background border-b shadow-sm">
              {/* Sticky Top-Left Corner */}
              <div className="sticky left-0 z-50 w-56 shrink-0 border-r bg-background p-4 shadow-[1px_0_0_0_#e2e8f0]">
                <div className="text-sm font-bold tracking-tight">
                  PO / SO
                </div>
              </div>

              {/* Dates Timeline Header */}
              <div className="relative h-14" style={{ width: widthPx }}>
                {/* Months */}
                <div className="absolute top-0 w-full h-7 flex border-b border-muted">
                  {months.map((m, i) => (
                    <div
                      key={i}
                      style={{ left: m.left, width: m.width }}
                      className="absolute h-full flex items-center px-3 border-r border-muted text-xs font-bold text-muted-foreground truncate"
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                {/* Days */}
                <div className="absolute bottom-0 w-full h-7 flex">
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const dt = new Date(startDate.getTime() + i * MS_PER_DAY);
                    return (
                      <div
                        key={i}
                        style={{ left: toPx(i, dayWidth), width: dayWidth }}
                        className="absolute h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                      >
                        {dt.getDate().toString().padStart(2, "0")}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TODAY MARKER OVERLAY */}
            <div
              className="absolute top-0 pointer-events-none z-30"
              style={{
                left: 224,
                width: widthPx,
                height: timelineContentHeight,
              }}
            >
              {todayPx >= 0 && todayPx <= widthPx && (
                <div
                  className="absolute w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{
                    left: todayPx,
                    top: dayHeaderTopOffset,
                    height: Math.max(
                      0,
                      timelineContentHeight - dayHeaderTopOffset,
                    ),
                  }}
                >
                  <div className="absolute -top-5 z-40 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} /> TODAY
                  </div>
                </div>
              )}
            </div>

            {/* BODY ROWS */}
            <div className="min-w-full w-fit flex flex-col z-10 relative">
              {rowsWithSegments.map((r: RowGroup, idx) => {
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRecord(r)}
                    className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-muted/30 transition-colors group cursor-pointer"
                    style={{ height: rowHeight }}
                  >
                    {/* STICKY LEFT COLUMN */}
                    <div className="sticky left-0 z-30 w-56 shrink-0 border-r bg-background group-hover:bg-muted/10 p-4 flex flex-col justify-center shadow-[1px_0_0_0_#e2e8f0]">
                      <div className="font-semibold text-sm dark:text-slate-200 text-slate-900 truncate">
                        {r.poNo || "Unknown PO"}
                      </div>
                      {r.soNo && (
                        <div className="text-xs text-muted-foreground truncate">
                          {r.soNo}
                        </div>
                      )}
                    </div>

                    {/* ROW TIMELINE AREA */}
                    <div className="relative" style={{ width: widthPx }}>
                      {/* Midline for order timeline line */}
                      <div
                        className="absolute left-0 right-0 h-px bg-muted"
                        style={{ top: Math.round(rowHeight / 2) }}
                      />

                      {/* Timeline Segments */}
                      <div
                        className="absolute z-10 top-0 h-full flex items-stretch gap-1"
                        style={{
                          left: toPx(
                            ((
                              r.poDate ??
                              r.events.created ??
                              r.events.approved ??
                              r.events.picking ??
                              r.events.dispatch ??
                              r.events.delivered ??
                              startDate
                            ).getTime() -
                              startDate.getTime()) /
                              MS_PER_DAY,
                            dayWidth,
                          ),
                        }}
                      >
                        {(r.bars ?? []).map((segment, segmentIndex) => {
                          const normalizedStatus = (segment.status || "pending").trim().toLowerCase();
                          const statusLabel = statusToLabel(normalizedStatus);
                          const stageLabel = stageToLabel(segment.stage);
                          const stageBounds = getStageBounds(segment.stage, r);
                          const segmentDays =
                            typeof segment.days === "number" && Number.isFinite(segment.days)
                              ? Math.max(0, segment.days)
                              : null;
                          const derivedStageDays =
                            segmentDays ??
                            (stageBounds.start && stageBounds.end
                              ? Math.max(
                                  0,
                                  (stageBounds.end.getTime() - stageBounds.start.getTime()) /
                                    MS_PER_DAY,
                                )
                              : null);
                          const isPending =
                            !stageBounds.end &&
                            (normalizedStatus === "pending" || derivedStageDays == null);

                          const segmentWidth = isPending
                            ? pendingSegmentWidth
                            : Math.max(
                                minSegmentWidth,
                                Math.max(0.25, derivedStageDays ?? 0) * dayWidth,
                              );
                          const statusClass = getStatusColor(normalizedStatus) || "";
                          const fallbackColor = getStatusHex(normalizedStatus) || "#9ca3af";
                          const showLabel = segmentWidth >= 42;
                          const compactDuration =
                            derivedStageDays == null
                              ? ""
                              : `${Math.max(1, Math.round(derivedStageDays))}d`;
                          const label = isPending
                            ? showLabel
                              ? "Pending"
                              : ""
                            : showLabel
                              ? compactDuration
                              : "";
                          const runningMs =
                            isPending && stageBounds.start
                              ? Math.max(0, nowTs - stageBounds.start.getTime())
                              : null;
                          const durationValue =
                            derivedStageDays != null
                              ? `${Math.round(Math.max(0, derivedStageDays))} Day${
                                  Math.round(Math.max(0, derivedStageDays)) === 1 ? "" : "s"
                                }`
                              : runningMs != null
                                ? `${Math.floor(Math.max(0, runningMs / MS_PER_DAY))} Day${
                                    Math.floor(Math.max(0, runningMs / MS_PER_DAY)) === 1 ? "" : "s"
                                  }`
                                : "0 Days";
                          const stageStatusLabel = isPending ? "Pending" : statusLabel;
                          const operationalNote = isPending
                            ? runningMs != null
                              ? `Running for ${formatDurationFromMs(runningMs)}`
                              : "Running (start date unavailable)"
                            : derivedStageDays != null
                              ? `Completed in ${Math.round(Math.max(0, derivedStageDays))} Day${
                                  Math.round(Math.max(0, derivedStageDays)) === 1 ? "" : "s"
                                }`
                              : "Completed";

                          return (
                            <Tooltip key={`${segment.stage}-${segmentIndex}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "h-full flex items-center justify-center rounded-md px-2 text-[10px] font-semibold select-none",
                                    isPending
                                      ? "border border-dashed border-muted text-muted-foreground bg-muted/20"
                                      : statusClass,
                                  )}
                                  style={
                                    isPending || statusClass
                                      ? {
                                          width: segmentWidth,
                                          height: barHeight,
                                        }
                                      : {
                                          width: segmentWidth,
                                          height: barHeight,
                                          backgroundColor: fallbackColor,
                                        }
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecord({
                                      ...r,
                                      stage: segment.stage,
                                      stageDays: derivedStageDays,
                                      stageStatus: normalizedStatus,
                                    });
                                  }}
                                >
                                  {label}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={8}
                                className="w-88 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur-sm z-[100]"
                              >
                                <div className="space-y-4 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="font-semibold text-sm text-foreground truncate">
                                        PO: {r.poNo || "No PO Number"}
                                      </div>

                                      <div
                                        className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                          normalizedStatus === "on-time" &&
                                            "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
                                          normalizedStatus === "warning" &&
                                            "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                                          normalizedStatus === "delayed" &&
                                            "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
                                          normalizedStatus === "pending" &&
                                            "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
                                        )}
                                      >
                                        {stageStatusLabel}
                                      </div>
                                    </div>

                                    <div className="text-muted-foreground truncate">
                                      SO: {r.soNo || "No SO Number"}
                                    </div>

                                    <div className="text-muted-foreground line-clamp-2">
                                      Customer: {r.label}
                                    </div>
                                    <div className="text-muted-foreground truncate">
                                      {segment.stage === "approval" &&
                                        `Approved At: ${formatDateTime(r.events.approved)}`}
                                      {segment.stage === "picking" &&
                                        `Picked At: ${formatDateTime(r.events.picking)}`}
                                      {segment.stage === "dispatch" &&
                                        `Dispatched At: ${formatDateTime(r.events.dispatch)}`}
                                      {segment.stage === "delivery" &&
                                        `Delivered At: ${formatDateTime(r.events.delivered)}`}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border bg-muted/40 p-2">
                                      <div className="text-[10px] text-muted-foreground">
                                        Stage
                                      </div>
                                      <div className="font-semibold text-foreground">
                                        {stageLabel}
                                      </div>
                                    </div>

                                    <div className="rounded-lg border bg-muted/40 p-2">
                                      <div className="text-[10px] text-muted-foreground">
                                        Duration
                                      </div>
                                      <div className="font-semibold text-foreground">
                                        {durationValue}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                                    {segment.stage === "approval" && (
                                      <>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Created</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.created)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Approved</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.approved)}
                                          </span>
                                        </div>
                                      </>
                                    )}

                                    {segment.stage === "picking" && (
                                      <>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Approved</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.approved)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Picked</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.picking)}
                                          </span>
                                        </div>
                                      </>
                                    )}

                                    {segment.stage === "dispatch" && (
                                      <>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Picked</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.picking)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Dispatched</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.dispatch)}
                                          </span>
                                        </div>
                                      </>
                                    )}

                                    {segment.stage === "delivery" && (
                                      <>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Dispatched</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.dispatch)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                          <span className="text-muted-foreground">Delivered</span>
                                          <span className="font-medium text-right">
                                            {formatDateTime(r.events.delivered)}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <div className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-muted-foreground leading-relaxed">
                                    {operationalNote}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Badge({
  color,
  label,
  striped,
}: {
  color: string;
  label: string;
  striped?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "w-3 h-3 rounded-sm shadow-sm",
          striped &&
            "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)]",
        )}
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
