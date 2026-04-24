"use client";

import type { TacticalSkuChartPoint } from "../types";
import { formatNumber, formatPercent } from "../utils/format";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TacticalSkuChartsProps = {
  data: TacticalSkuChartPoint[];
};

function shortLabel(value: string, max = 20): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function ProductTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[250px] rounded-md border bg-background px-3 py-2 shadow-md">
      <div className="mb-2 text-xs font-semibold text-foreground">{String(label)}</div>
      <div className="space-y-1 text-xs">
        {payload.map((entry) => (
          <div key={String(entry.name)} className="flex items-center justify-between gap-3">
            <span style={{ color: entry.color || "#94a3b8" }}>{entry.name}</span>
            <span className="font-medium text-foreground">{formatNumber(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TacticalSkuCharts({ data }: TacticalSkuChartsProps) {
  const reached = data.reduce((sum, row) => sum + row.reach, 0);
  const target = data.reduce((sum, row) => sum + row.target, 0);
  const achievement = target > 0 ? (reached / target) * 100 : 0;
  const chartAchievement = Math.max(0, Math.min(achievement, 100));
  const reachedForChart = target > 0 ? (target * chartAchievement) / 100 : 0;
  const remainingForChart = Math.max(target - reachedForChart, 0);
  const reachedColor = "#3b82f6";
  const remainingColor = "#e5e7eb";

  const pieData = [
    { name: "Reached", value: reachedForChart, color: reachedColor },
    { name: "Remaining", value: remainingForChart, color: remainingColor },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Top 10 Products Reach vs Target</CardTitle>
          <CardDescription>Filtered view of the top-performing products by reach, capped at 10 for readability.</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="productName"
                angle={-15}
                textAnchor="end"
                interval={0}
                height={92}
                tickFormatter={(value: string) => shortLabel(value, 22)}
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(v) => formatNumber(Number(v))} 
                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ProductTooltip />}
              />
              <Bar dataKey="reach" fill="#3b82f6" name="Reach" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="target" fill="#22c55e" name="Target" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Target Achievement</CardTitle>
          <CardDescription>Proportion of total targets already reached vs unserved targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
            <span className="text-sm font-medium text-muted-foreground">Overall Attainment</span>
            <span className="text-3xl font-bold text-foreground">
              {formatPercent(achievement)}
            </span>
          </div>

          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Progress</div>
                <div className="text-xl font-semibold text-foreground">{formatPercent(chartAchievement)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border bg-background p-2">
              <div className="text-muted-foreground">Reached</div>
              <div className="font-semibold" style={{ color: reachedColor }}>{formatNumber(reached)}</div>
            </div>
            <div className="rounded-md border bg-background p-2">
              <div className="text-muted-foreground">Remaining</div>
              <div className="font-semibold text-foreground">{formatNumber(Math.max(target - reached, 0))}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}