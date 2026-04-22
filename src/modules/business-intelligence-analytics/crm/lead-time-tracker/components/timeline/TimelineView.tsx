"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ZoomIn, ZoomOut, Clock } from "lucide-react";
import { fetchLeadTimeData } from "../../providers/fetchProvider";
import type {
  LeadTimeRecord,
  LeadTimeFilters,
  LeadTimeProductOption,
} from "../../types";
import { cn } from "@/lib/utils";
import { getStatusHex } from "../../utils/getStatusColor";

type EventType = "created" | "approved" | "dispatch" | "delivered";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RowGroup = {
  poNo: string;
  soNo?: string;
  label?: string;
  events: Record<EventType, Date | null>;
  approvalStatus?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  bars?: Array<{
    stage: string;
    start?: Date | null;
    end?: Date | null;
    days?: number | null;
    status?: string | null;
  }>;
  overallStart?: Date | null;
  overallEnd?: Date | null;
};

// Utility functions (parseDate, findDateFromRecord, etc. remain unchanged)
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ... [Keep your existing findDateFromRecord, findStringFromRecord, extractEventsFromRecord helpers here] ...
function findDateFromRecord(rec: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    if (k in rec) {
      const d = parseDate(rec[k]);
      if (d) return d;
    }
  }
  return null;
}

function findStringFromRecord(rec: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    if (k in rec) {
      const v = rec[k];
      if (v !== undefined && v !== null) return String(v).trim();
    }
  }
  return undefined;
}

function extractEventsFromRecord(r: LeadTimeRecord) {
  const rec = r as unknown as Record<string, unknown>;
  const created = findDateFromRecord(rec, [
    "createdAt",
    "createdDate",
    "creationDate",
  ]);
  const approved = findDateFromRecord(rec, [
    "approvedAt",
    "approvalDate",
    "approved_date",
  ]);
  const dispatch = findDateFromRecord(rec, [
    "dispatchAt",
    "dispatchDate",
    "dispatch_date",
  ]);
  const delivered = findDateFromRecord(rec, [
    "deliveredAt",
    "deliveredDate",
    "deliveryDate",
  ]);
  return { created, approved, dispatch, delivered } as Record<
    EventType,
    Date | null
  >;
}

function toPx(posDays: number, dayWidth: number) {
  return Math.round(posDays * dayWidth);
}

export default function ProcessTimeline({
  filters,
  products,
}: {
  filters: LeadTimeFilters;
  products: LeadTimeProductOption[];
}) {
  const [records, setRecords] = React.useState<LeadTimeRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Phase 1: Smart Zoom System
  const [dayWidth, setDayWidth] = React.useState<number>(32);
  const handleZoomIn = () => setDayWidth((w) => Math.min(72, w + 10));
  const handleZoomOut = () => setDayWidth((w) => Math.max(12, w - 10));
  const handleZoomReset = () => setDayWidth(32);

  // Phase 2: Drawer State
  const [selectedRecord, setSelectedRecord] = React.useState<Record<
    string,
    unknown
  > | null>(null);

  const productNames = React.useMemo(() => {
    if (!filters.productIds?.length) return undefined;
    return filters.productIds
      .map((id) => products.find((p) => String(p.id) === String(id))?.name)
      .filter(Boolean) as string[];
  }, [filters.productIds, products]);

  const productNamesKey = React.useMemo(
    () => JSON.stringify(productNames ?? []),
    [productNames],
  );

  React.useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const data = await fetchLeadTimeData(
          {
            from: filters.dateFrom,
            to: filters.dateTo,
            productName: productNames,
          },
          controller.signal,
        );
        if (mounted) setRecords(data);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [filters.dateFrom, filters.dateTo, productNamesKey, productNames]);

  const rowsWithSegments = React.useMemo(() => {
    const map = new Map<string, RowGroup>();

    for (const recRaw of records) {
      const rec = recRaw as unknown as Record<string, unknown>;
      const po = String(
        rec["poNo"] ??
          rec["po_no"] ??
          rec["poNumber"] ??
          rec["po"] ??
          rec["poNo"] ??
          "",
      ).trim();
      const so =
        String(
          rec["soNo"] ??
            rec["so_no"] ??
            rec["soNumber"] ??
            rec["so"] ??
            rec["soNo"] ??
            "",
        ).trim() || undefined;

      const key = po || Math.random().toString(36).slice(2, 9);

      const events = extractEventsFromRecord(recRaw as LeadTimeRecord);

      const approvalStatus = findStringFromRecord(rec, [
        "approvalStatus",
        "approval_status",
        "approvalstatus",
        "approval_status_text",
        "approvalStatusText",
      ]) as string | undefined;
      const fulfillmentStatus = findStringFromRecord(rec, [
        "fulfillmentStatus",
        "fulfillment_status",
        "fulfillmentstatus",
        "dispatchStatus",
        "dispatch_status",
      ]) as string | undefined;
      const deliveryStatus = findStringFromRecord(rec, [
        "deliveryStatus",
        "delivery_status",
        "deliverystatus",
        "deliveryStatusText",
        "delivery_status_text",
      ]) as string | undefined;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          poNo: po || key,
          soNo: so,
          label:
            String(
              rec["productName"] ?? rec["product_name"] ?? rec["name"] ?? "",
            ) || undefined,
          events,
          approvalStatus,
          fulfillmentStatus,
          deliveryStatus,
        });
      } else {
        // merge events/statuses
        for (const k of [
          "created",
          "approved",
          "dispatch",
          "delivered",
        ] as EventType[]) {
          if (!existing.events[k] && events[k]) existing.events[k] = events[k];
        }
        if (!existing.approvalStatus && approvalStatus)
          existing.approvalStatus = approvalStatus;
        if (!existing.fulfillmentStatus && fulfillmentStatus)
          existing.fulfillmentStatus = fulfillmentStatus;
        if (!existing.deliveryStatus && deliveryStatus)
          existing.deliveryStatus = deliveryStatus;
      }
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const ad =
        a.events.created ??
        a.events.approved ??
        a.events.dispatch ??
        a.events.delivered;
      const bd =
        b.events.created ??
        b.events.approved ??
        b.events.dispatch ??
        b.events.delivered;
      if (!ad && !bd) return (a.poNo || "").localeCompare(b.poNo || "");
      if (!ad) return 1;
      if (!bd) return -1;
      return ad.getTime() - bd.getTime();
    });

    // compute bars and overall spans
    return arr.map((r: RowGroup) => {
      const approvalStart = r.events.created ?? null;
      const approvalEnd = r.events.approved ?? null;

      const dispatchStart = r.events.approved ?? r.events.created ?? null;
      const dispatchEnd = r.events.dispatch ?? null;

      const deliveryStart =
        r.events.dispatch ?? r.events.approved ?? r.events.created ?? null;
      const deliveryEnd = r.events.delivered ?? null;

      const existingDates = [
        approvalStart,
        approvalEnd,
        dispatchStart,
        dispatchEnd,
        deliveryStart,
        deliveryEnd,
      ].filter(Boolean) as Date[];

      const overallStart = existingDates.length ? existingDates[0] : null;
      const overallEnd = existingDates.length
        ? existingDates[existingDates.length - 1]
        : null;

      const makeDays = (s?: Date | null, e?: Date | null) =>
        s && e
          ? Math.max(0, Math.round((e.getTime() - s.getTime()) / MS_PER_DAY))
          : null;

      const approvalDays = makeDays(approvalStart, approvalEnd);
      const dispatchDays = makeDays(dispatchStart, dispatchEnd);
      const deliveryDays = makeDays(deliveryStart, deliveryEnd);

      const bars = [
        {
          stage: "approval",
          start: approvalStart,
          end: approvalEnd,
          days: approvalDays,
          status: r.approvalStatus,
        },
        {
          stage: "dispatch",
          start: dispatchStart,
          end: dispatchEnd,
          days: dispatchDays,
          status: r.fulfillmentStatus,
        },
        {
          stage: "delivery",
          start: deliveryStart,
          end: deliveryEnd,
          days: deliveryDays,
          status: r.deliveryStatus,
        },
      ];

      return { ...r, bars, overallStart, overallEnd };
    });
  }, [records]);

  // Viewport Calculations
  const { startDate, totalDays, widthPx, months } = React.useMemo(() => {
    // Determine timeline bounds natively based on dates
    const start = parseDate(filters.dateFrom) || new Date();
    const end =
      parseDate(filters.dateTo) || new Date(start.getTime() + 30 * MS_PER_DAY);
    const durDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1,
    );

    // Width scales dynamically with zoom
    const width = Math.max(800, durDays * dayWidth);

    // Header spans
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
  const barHeight = 24;

  // Phase 2: Today Marker Logic
  const todayPx = React.useMemo(() => {
    const ms = Date.now() - startDate.getTime();
    return toPx(ms / MS_PER_DAY, dayWidth);
  }, [startDate, dayWidth]);

  return (
    <Card className="flex flex-col h-full border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-4 bg-slate-50/50 border-b">
        <div>
          <CardTitle className="text-xl">Process Timeline</CardTitle>
          <CardDescription>
            Enterprise Operations Intelligence Interface
          </CardDescription>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border shadow-sm">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-background rounded text-muted-foreground"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              100%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-background rounded text-muted-foreground"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Unified Global Legend */}
          <div className="flex items-center gap-2">
            <Badge color="#9ca3af" label="Pending" striped />
            <Badge color="#10b981" label="On time" />
            <Badge color="#f59e0b" label="Warning" />
            <Badge color="#ef4444" label="Delayed" />
          </div>
        </div>
        {/* Small status UI to use local states and avoid unused warnings */}
        <div className="ml-4 text-right">
          {loading && (
            <div className="text-xs text-muted-foreground">Loading…</div>
          )}
          {error && <div className="text-xs text-red-500">{error}</div>}
          {selectedRecord &&
            typeof selectedRecord === "object" &&
            "poNo" in selectedRecord && (
              <div className="text-xs text-slate-600">
                Selected:{" "}
                {String((selectedRecord as Record<string, unknown>).poNo ?? "")}
              </div>
            )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden relative">
        {/* THE UNIFIED SCROLL ENGINE */}
        <div className="h-[600px] overflow-auto relative w-full flex flex-col bg-slate-50/30">
          {/* GLOBAL BACKGROUND: Render vertical day lines once */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-0"
            style={{ left: 224, width: widthPx }}
          >
            {Array.from({ length: totalDays }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute top-0 bottom-0 border-r",
                  [0, 6].includes(
                    new Date(startDate.getTime() + i * MS_PER_DAY).getDay(),
                  )
                    ? "border-slate-200 bg-slate-100/30"
                    : "border-slate-100/60",
                )}
                style={{ left: toPx(i, dayWidth), width: dayWidth }}
              />
            ))}

            {/* TODAY MARKER */}
            {todayPx >= 0 && todayPx <= widthPx && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                style={{ left: todayPx }}
              >
                <div className="absolute top-12 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock size={10} /> TODAY
                </div>
              </div>
            )}
          </div>

          {/* STICKY HEADER ROW */}
          <div className="sticky top-0 z-40 flex min-w-full w-fit bg-background border-b shadow-sm">
            {/* Sticky Top-Left Corner */}
            <div className="sticky left-0 z-50 w-56 shrink-0 border-r bg-background p-4 shadow-[1px_0_0_0_#e2e8f0]">
              <div className="text-sm font-bold tracking-tight">PO / SO</div>
            </div>

            {/* Dates Timeline Header */}
            <div className="relative h-14" style={{ width: widthPx }}>
              {/* Months */}
              <div className="absolute top-0 w-full h-7 border-b flex bg-slate-50/80">
                {months.map((m, i) => (
                  <div
                    key={i}
                    style={{ left: m.left, width: m.width }}
                    className="absolute h-full flex items-center px-3 border-r border-slate-200 text-xs font-bold text-slate-700"
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
                      className="absolute h-full flex items-center justify-center text-[10px] font-medium text-slate-500"
                    >
                      {dt.getDate().toString().padStart(2, "0")}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BODY ROWS */}
          <div className="min-w-full w-fit flex flex-col z-10 relative">
            {rowsWithSegments.map((r: RowGroup, idx) => {
              // ... existing variable declarations for bar locations ...

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedRecord(r)}
                  className="flex border-b border-slate-100 hover:bg-slate-100/50 transition-colors group cursor-pointer"
                  style={{ height: rowHeight }}
                >
                  {/* STICKY LEFT COLUMN (Permanent) */}
                  <div className="sticky left-0 z-30 w-56 shrink-0 border-r bg-background group-hover:bg-slate-50 p-4 flex flex-col justify-center shadow-[1px_0_0_0_#e2e8f0]">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {r.poNo || "Unknown PO"}
                    </div>
                    {r.soNo && (
                      <div className="text-xs text-slate-500 truncate">
                        {r.soNo}
                      </div>
                    )}
                  </div>

                  {/* ROW TIMELINE AREA */}
                  <div className="relative" style={{ width: widthPx }}>
                    {/* Continuous row midline */}
                    <div
                      className="absolute left-0 right-0 h-px bg-slate-200/50"
                      style={{ top: Math.round(rowHeight / 2) }}
                    />

                    {/* Stage Bars (Segmented Block Logic) */}
                    {(r.bars ?? []).map((bar, bi: number) => {
                      const color = getStatusHex(bar?.status) || "#e2e8f0";
                      const left = bar?.start
                        ? toPx(
                            (bar.start!.getTime() - startDate.getTime()) /
                              MS_PER_DAY,
                            dayWidth,
                          )
                        : 0;
                      let width = dayWidth * 2;
                      if (bar?.start && bar?.end) {
                        width = Math.max(
                          dayWidth,
                          toPx(
                            (bar.end.getTime() - bar.start.getTime()) /
                              MS_PER_DAY,
                            dayWidth,
                          ),
                        );
                      }
                      const isPending =
                        bar?.days == null || !(bar?.start && bar?.end);
                      const segmentCount =
                        bar?.days != null
                          ? Math.max(1, bar.days as number)
                          : Math.max(1, Math.round(width / dayWidth));

                      return (
                        <div
                          key={bi}
                          style={{
                            left,
                            width,
                            top: rowHeight / 2 - barHeight / 2,
                            height: barHeight,
                          }}
                          className="absolute z-10 flex gap-[2px] p-[2px] bg-slate-200/40 rounded shadow-sm hover:-translate-y-0.5 transition-transform"
                        >
                          {/* Segmented Blocks Instead of Flat Bars */}
                          {Array.from({ length: segmentCount }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 rounded-[2px]",
                                isPending &&
                                  "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.06)_4px,rgba(0,0,0,0.06)_8px)]",
                              )}
                              style={{
                                backgroundColor: isPending ? "#e2e8f0" : color,
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Helper for Legend Badges
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
