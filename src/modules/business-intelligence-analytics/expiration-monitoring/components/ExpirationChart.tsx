"use client";

import * as React from "react";
import { ExpirationRecord } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ExpirationChartProps {
  data: ExpirationRecord[];
}

export function ExpirationChart({ data }: ExpirationChartProps) {
  const chartData = React.useMemo(() => {
    const monthlyData: Record<string, number> = {};

    data.forEach((item) => {
      if (item.expiryDate && item.receivedQuantity) {
        // Parse date
        const date = new Date(item.expiryDate);
        if (!isNaN(date.getTime())) {
          // Format as "MMM YYYY" e.g., "Jan 2026"
          const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
          }
          monthlyData[monthYear] += item.receivedQuantity;
        }
      }
    });

    // Convert to array and sort by actual date
    const sortedArray = Object.entries(monthlyData).map(([key, value]) => {
      return {
        month: key,
        quantity: value,
        // Helper for sorting
        _date: new Date(key).getTime(),
      };
    }).sort((a, b) => a._date - b._date);

    return sortedArray;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 h-[400px] flex items-center justify-center shadow-2xl">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          No data available for chart
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight uppercase">Expiration Timeline</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Quantity of products expiring per month</p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="currentColor" 
              opacity={0.5} 
              fontSize={10} 
              tickMargin={10} 
              tickLine={false} 
              axisLine={false}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              stroke="currentColor" 
              opacity={0.5} 
              fontSize={10} 
              tickMargin={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value: number) => [value.toLocaleString(), "Quantity"]}
            />
            <Line
              type="monotone"
              dataKey="quantity"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
