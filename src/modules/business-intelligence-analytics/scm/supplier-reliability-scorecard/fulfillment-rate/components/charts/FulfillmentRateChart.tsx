"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, AlertCircle } from "lucide-react";

interface FulfillmentRateChartProps {
  data: {
    name: string;
    fulfillmentRate: number;
  }[];
}

const chartConfig = {
  fulfillmentRate: {
    label: "Fulfillment Rate",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function FulfillmentRateChart({ data }: FulfillmentRateChartProps) {
  // Slice to bottom 10 performers for optimal UI/UX
  const slicedData = useMemo(() => data.slice(0, 10), [data]);

  const avgRate =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.fulfillmentRate, 0) / data.length
      : 0;

  return (
    <Card className="shadow-xs gap-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Bottom 10 Performers</CardTitle>
          <CardDescription>
            Suppliers with the lowest fulfillment rates (Target: 95%)
          </CardDescription>
        </div>
        {avgRate < 95 && (
          <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 px-2 py-1 rounded-md border border-destructive/10">
            <AlertCircle className="h-4 w-4" />
            Below 95% Target
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="w-full h-[400px]">
          <BarChart
            accessibilityLayer
            data={slicedData}
            margin={{ top: 30, right: 10, left: 0, bottom: 60 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
              tickFormatter={(value: string) =>
                value.length > 5 ? `${value.slice(0, 5)}...` : value
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={95}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{
                value: "95% Target",
                position: "insideTopRight",
                fill: "hsl(var(--destructive))",
                fontSize: 10,
                fontWeight: 500,
                offset: 10,
              }}
            />
            <Bar dataKey="fulfillmentRate" radius={6} minPointSize={2}>
              {slicedData.map(
                (
                  entry: { name: string; fulfillmentRate: number },
                  index: number,
                ) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.fulfillmentRate < 95
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--primary))"
                    }
                    fillOpacity={0.8}
                  />
                ),
              )}
              <LabelList
                dataKey="fulfillmentRate"
                position="top"
                offset={12}
                className="fill-foreground font-medium"
                formatter={(value: number) => `${value.toFixed(0)}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {avgRate >= 95 ? (
            <>
              Overall performance is on target{" "}
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </>
          ) : (
            <>
              Average fulfillment rate is {avgRate.toFixed(1)}%{" "}
              <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing worst 10 out of {data.length} total suppliers
        </div>
      </CardFooter>
    </Card>
  );
}
