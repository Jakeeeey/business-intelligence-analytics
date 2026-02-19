import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
} from "@/components/ui/card";

interface FulfillmentRateChartProps {
  data: {
    name: string;
    fulfillmentRate: number;
  }[];
}

export function FulfillmentRateChart({ data }: FulfillmentRateChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Fulfillment Rate by Supplier</CardTitle>
        <CardDescription>
          Suppliers below 95% threshold are flagged in red
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="name"
              fontSize={10}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              fontSize={12}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.2)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
              }}
              formatter={(val: number) => [
                `${val.toFixed(1)}%`,
                "Fulfillment Rate",
              ]}
            />
            <ReferenceLine
              y={95}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              label={{
                value: "95%",
                position: "right",
                fill: "hsl(var(--destructive))",
                fontSize: 10,
              }}
            />
            <Bar dataKey="fulfillmentRate" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.fulfillmentRate < 95
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--foreground))"
                  }
                />
              ))}
              <LabelList
                dataKey="fulfillmentRate"
                position="top"
                formatter={(val: number) => `${val.toFixed(0)}%`}
                style={{
                  fontSize: "10px",
                  fill: "hsl(var(--muted-foreground))",
                }}
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
