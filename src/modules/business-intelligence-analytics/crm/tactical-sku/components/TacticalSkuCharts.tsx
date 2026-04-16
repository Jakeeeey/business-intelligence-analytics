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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

type TacticalSkuChartsProps = {
  data: TacticalSkuChartPoint[];
};

export function TacticalSkuCharts({ data }: TacticalSkuChartsProps) {
  const reached = data.reduce((sum, row) => sum + row.reach, 0);
  const target = data.reduce((sum, row) => sum + row.target, 0);
  const unserved = Math.max(target - reached, 0);
  const achievement = target > 0 ? (reached / target) * 100 : 0;

  const pieData = [
    { name: "Reached", value: reached },
    { name: "Unserved", value: unserved },
  ].filter((x) => x.value > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Top Products Reach vs Target</CardTitle>
          <CardDescription>Visual comparison of total reach against total targets for your top performing SKUs.</CardDescription>
        </CardHeader>
        <CardContent className="h-[360px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="productName"
                angle={-25}
                textAnchor="end"
                interval={0}
                height={80}
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
                formatter={(value: number, name: string) => [formatNumber(value), name]}
                labelFormatter={(label: string) => label}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="reach" fill="hsl(var(--primary))" name="Reach" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Target" radius={[4, 4, 0, 0]} maxBarSize={48} />
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

          <div className="h-[220px]">
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
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={entry.name} 
                      fill={entry.name === "Reached" ? "hsl(var(--primary))" : "hsl(var(--muted))"} 
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip 
                   formatter={(value: number) => formatNumber(value)}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}