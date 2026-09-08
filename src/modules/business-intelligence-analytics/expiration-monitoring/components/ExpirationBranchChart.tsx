"use client";

import * as React from "react";
import { ExpirationRecord } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ExpirationBranchChartProps {
  data: ExpirationRecord[];
}

export function ExpirationBranchChart({ data }: ExpirationBranchChartProps) {
  const chartData = React.useMemo(() => {
    const branchMap: Record<string, number> = {};

    data.forEach((item) => {
      if (item.branchName && item.itemTotalCost) {
        if (!branchMap[item.branchName]) {
          branchMap[item.branchName] = 0;
        }
        branchMap[item.branchName] += item.itemTotalCost;
      }
    });

    const sortedArray = Object.entries(branchMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 5, combine the rest into "Others"
    if (sortedArray.length > 5) {
      const top5 = sortedArray.slice(0, 5);
      const others = sortedArray.slice(5).reduce((acc, curr) => acc + curr.value, 0);
      top5.push({ name: "OTHERS", value: others });
      return top5;
    }

    return sortedArray;
  }, [data]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--destructive))",
    "#f59e0b", // orange
    "#10b981", // emerald
    "#8b5cf6", // violet
    "hsl(var(--muted-foreground))", // others
  ];

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight uppercase">Value by Branch</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Total cost of expiring items per branch</p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [
                new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value),
                "Total Cost"
              ]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
