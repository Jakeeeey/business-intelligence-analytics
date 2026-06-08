// src/modules/business-intelligence-analytics/scm/consolidator-audit/components/StatusDistributionCharts.tsx
"use client";

import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Package, FileSpreadsheet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { ConsolidatorAuditRecord } from "../types";

/* ─── Status → Color mapping ─── */
function getStatusColor(status: string): string {
  const n = status.toLowerCase();
  if (["dispatched", "audited", "posted", "completed", "success"].includes(n))
    return "#10b981"; // emerald-500
  if (["pending", "processing", "draft", "created"].includes(n))
    return "#f59e0b"; // amber-500
  if (["cancelled", "failed", "rejected"].includes(n))
    return "#ef4444"; // red-500
  return "#3b82f6"; // blue-500
}

/* ─── Reusable single chart card ─── */
function StatusChartCard({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  data,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  data: { status: string; count: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="dark:border-zinc-700 overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Icon className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black tabular-nums text-foreground">
              {total}
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Total Records
            </p>
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <div style={{ width: "100%", height: Math.max(data.length * 36, 80) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={100}
                  tick={{
                    fontSize: 11,
                    fontWeight: 600,
                    fill: "currentColor",
                  }}
                  tickLine={false}
                  axisLine={false}
                  className="text-foreground"
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="min-w-[140px] rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700 space-y-1">
                          <span className="font-medium block mb-1 border-b pb-1 border-border/50">Status breakdown</span>
                          <div className="flex justify-between gap-6 text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold tabular-nums text-foreground">
                              {payload[0].value} records
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            No status data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main exported component ─── */
type StatusDistributionChartsProps = {
  data: ConsolidatorAuditRecord[];
};

export function StatusDistributionCharts({
  data,
}: StatusDistributionChartsProps) {
  // Compute status distributions
  const pdpDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      if (r.pdpStatus) counts[r.pdpStatus] = (counts[r.pdpStatus] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        color: getStatusColor(status),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const consolDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      if (r.consolidatorStatus)
        counts[r.consolidatorStatus] =
          (counts[r.consolidatorStatus] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        color: getStatusColor(status),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const dpDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      if (r.dpStatus) counts[r.dpStatus] = (counts[r.dpStatus] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        color: getStatusColor(status),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <StatusChartCard
        title="PDP Status"
        subtitle="Record distribution by status"
        icon={ClipboardList}
        accentColor="#3b82f6"
        data={pdpDistribution}
      />
      <StatusChartCard
        title="Consolidator Status"
        subtitle="Record distribution by status"
        icon={Package}
        accentColor="#0ea5e9"
        data={consolDistribution}
      />
      <StatusChartCard
        title="DP Status"
        subtitle="Record distribution by status"
        icon={FileSpreadsheet}
        accentColor="#10b981"
        data={dpDistribution}
      />
    </div>
  );
}
