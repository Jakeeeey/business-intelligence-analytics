"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeadTimeVarianceChartProps {
  data: {
    supplierName: string;
    averageLeadTime: number;
  }[];
}

const chartConfig = {
  averageLeadTime: {
    label: "Avg. Lead Time (Days)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function LeadTimeVarianceChart({ data }: LeadTimeVarianceChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Average Lead Time by Supplier</CardTitle>
        <CardDescription>
          Comparison of average fulfillment duration (Days) per supplier
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="supplierName"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}d`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="averageLeadTime"
                fill="var(--color-averageLeadTime)"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.averageLeadTime > 1
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
