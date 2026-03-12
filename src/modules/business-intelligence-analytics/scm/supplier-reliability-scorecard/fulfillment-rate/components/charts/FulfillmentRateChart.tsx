"use client";

import React from "react";
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
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function FulfillmentRateChart({ data }: FulfillmentRateChartProps) {
  const avgRate =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.fulfillmentRate, 0) / data.length
      : 0;

  return (
    <Card className="shadow-xs gap-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Supplier Performance</CardTitle>
          <CardDescription>
            Fulfillment rates per supplier (Target: 100%)
          </CardDescription>
        </div>
        {avgRate < 100 && (
          <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 px-2 py-1 rounded-md border border-destructive/10">
            <AlertCircle className="h-4 w-4" />
            Below 100% Target
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="w-full h-[400px]">
          <BarChart
            accessibilityLayer
            data={data}
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
              y={100}
              stroke="#f97316"
              strokeDasharray="4 4"
              label={{
                value: "100% Target",
                position: "insideTopRight",
                fill: "#f97316",
                fontSize: 10,
                fontWeight: 500,
                offset: 10,
              }}
            />
            <Bar dataKey="fulfillmentRate" radius={6} minPointSize={2}>
              {data.map(
                (
                  entry: { name: string; fulfillmentRate: number },
                  index: number,
                ) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.fulfillmentRate < 80 || entry.fulfillmentRate >= 120
                        ? "hsl(var(--destructive))"
                        : entry.fulfillmentRate < 100
                          ? "#f97316" // Orange for Warning
                          : "hsl(var(--primary))" // Blue for Good
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
          {avgRate >= 100 ? (
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
          Showing all {data.length} suppliers
        </div>
      </CardFooter>
    </Card>
  );
}
