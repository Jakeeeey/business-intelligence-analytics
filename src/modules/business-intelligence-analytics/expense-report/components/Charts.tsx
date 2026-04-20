"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Sector,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type {
  ExpenseByCategory,
  ExpenseByEmployee,
  ExpenseByDivision,
  TooltipProps,
  DisbursementRecord,
} from "../type";

type ChartsProps = {
  expensesByCategory: ExpenseByCategory[];
  expensesByEmployee: ExpenseByEmployee[];
  expensesByDivision: ExpenseByDivision[];
};

const COLORS_LIGHT = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-1">{label}</p>
        <p className="text-sm">
          <span className="font-medium">Amount: </span>
          {formatCurrency(payload[0]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
};

type PiePayloadItem = {
  payload?: { name?: string; value?: number };
  name?: string;
  value?: number;
  percent?: number;
};

// type StatusPieLabelProps = {
//   name?: string;
//   percent?: number;
// };

// const renderStatusPieLabel = ({ name, percent }: StatusPieLabelProps) => {
//   if (!name) return "";
//   const pct = typeof percent === "number" ? ` (${Math.round(percent * 100)}%)` : "";
//   return `${name}${pct}`;
// };

const CustomPieTooltip = ({
  active,
  payload,
  total = 0,
}: {
  active?: boolean;
  payload?: PiePayloadItem[];
  total?: number;
}) => {
  if (active && payload && payload.length) {
    const p = payload[0];
    const name = p?.payload?.name ?? p?.name ?? "";
    const value = p?.value ?? p?.payload?.value ?? 0;
    let percentLabel = "";
    if (typeof p?.percent === "number") {
      percentLabel = `${Math.round(p.percent * 100)}%`;
    } else if (total && total > 0) {
      percentLabel = `${Math.round((value / total) * 100)}%`;
    }
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {value} {percentLabel ? `(${percentLabel})` : ""}
        </div>
      </div>
    );
  }
  return null;
};

export default function Charts({
  expensesByCategory,
  expensesByEmployee,
  expensesByDivision,
  records,
}: ChartsProps & { records?: DisbursementRecord[] }) {
  // Limit to top 10 for better visualization
  const topCategories = expensesByCategory.slice(0, 10);
  const topEmployees = expensesByEmployee.slice(0, 10);
  const topDivisions = expensesByDivision.slice(0, 10);

  // helper: determine scale based on max value
  const getScale = (max: number) => {
    if (max >= 1_000_000) return { divisor: 1_000_000, suffix: "M" };
    if (max >= 1_000) return { divisor: 1_000, suffix: "K" };
    return { divisor: 1, suffix: "" };
  };

  const formatTick = (value: number, max: number) => {
    const { divisor, suffix } = getScale(max);
    if (divisor === 1) return `₱${value}`;
    // show one decimal when value/divisor < 10, else no decimals
    const scaled = value / divisor;
    const formatted = scaled < 10 ? scaled.toFixed(1) : scaled.toFixed(0);
    return `₱${formatted}${suffix}`;
  };

  // prepare maxima for each dataset
  const maxCategory = Math.max(...topCategories.map((d) => d.totalAmount), 0);
  const maxEmployee = Math.max(...topEmployees.map((d) => d.totalAmount), 0);
  const maxDivision = Math.max(...topDivisions.map((d) => d.totalAmount), 0);

  const [activeStatusIdx, setActiveStatusIdx] = React.useState<
    number | undefined
  >(undefined);

  // prepare status donut data from records (if provided)
  const statusData = React.useMemo(() => {
    if (!records || records.length === 0)
      return [] as { name: string; value: number }[];

    // Deduplicate by docNo
    const uniqueByDoc = new Map<string, DisbursementRecord>();
    for (const r of records) {
      const key = r.docNo || String(r.disbursementId);
      if (!uniqueByDoc.has(key)) uniqueByDoc.set(key, r);
    }
    const dedupedRecords = Array.from(uniqueByDoc.values());

    // Aggregate status counts per unique document
    const map = new Map<string, number>();
    for (const r of dedupedRecords) {
      const status =
        r.isPosted === 1
          ? "Posted"
          // : r.approverId != null
          //   ? "Draft"
            : "Pending";
      map.set(status, (map.get(status) || 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [records]);

  const renderActiveShape = (props: unknown) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props as {
        cx: number;
        cy: number;
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        fill?: string;
      };
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expenses by Category (COA) */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category (COA)</CardTitle>
            <CardDescription>Top expense categories by amount</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCategories}
                margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                
                  dataKey="coaTitle"
                  angle={-45}
                  textAnchor="end"
                  // height={30}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) =>
                    v.length > 20 ? v.slice(0, 20) + "" : v
                  }
                  className="text-muted-foreground nowrap "
                />
                <YAxis
                  tickFormatter={(value) => formatTick(value, maxCategory)}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAmount" radius={[4, 4, 0, 0]}>
                  {topCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_LIGHT[index % COLORS_LIGHT.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Expenses per Employee */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses per Payee</CardTitle>
            <CardDescription>Top payee by total expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topEmployees}
                margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="payeeName"
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) =>
                    v.length > 20 ? v.slice(0, 20) + "" : v
                  }
                  className="text-muted-foreground nowrap "
                />
                <YAxis
                  tickFormatter={(value) => formatTick(value, maxEmployee)}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAmount" radius={[4, 4, 0, 0]}>
                  {topEmployees.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_LIGHT[index % COLORS_LIGHT.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Status Donut */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Transaction status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData && statusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Tooltip
                    content={
                      <CustomPieTooltip
                        total={statusData.reduce(
                          (s: number, d: { name: string; value: number }) =>
                            s + d.value,
                          0,
                        )}
                      />
                    }
                  />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={0}
                    outerRadius={100}
                    paddingAngle={2}
                    activeIndex={activeStatusIdx}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, idx) => setActiveStatusIdx(idx)}
                    onMouseLeave={() => setActiveStatusIdx(undefined)}
                    // label={renderStatusPieLabel}
                    // labelLine={false}
                  >
                    {statusData.map((entry, idx) => (
                      <Cell
                        key={`slice-${idx}`}
                        fill={COLORS_LIGHT[idx % COLORS_LIGHT.length]}
                        opacity={
                          activeStatusIdx == null || activeStatusIdx === idx
                            ? 1
                            : 0.35
                        }
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      paddingTop: 8,
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No status data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Division Spending */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Division Spending</CardTitle>
            <CardDescription>Expenses by division</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topDivisions}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => formatTick(value, maxDivision)}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      type="category"
                      dataKey="divisionName"
                      tick={{ fontSize: 11 }}
                      width={120}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
                      {topDivisions.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_LIGHT[index % COLORS_LIGHT.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
