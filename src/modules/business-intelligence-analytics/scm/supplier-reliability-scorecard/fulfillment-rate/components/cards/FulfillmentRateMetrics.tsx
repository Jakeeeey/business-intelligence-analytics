import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FulfillmentRateMetricsProps {
  metrics: {
    avgFulfillmentRate: number;
    suppliersBelow95Count: number;
    totalSuppliers: number;
    totalPOs: number;
    totalFulfillmentPct: number;
  };
}

export function FulfillmentRateMetrics({
  metrics,
}: FulfillmentRateMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Fulfillment Rate
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avgFulfillmentRate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                metrics.avgFulfillmentRate >= 95 ? "default" : "destructive"
              }
              className="text-[10px] h-4"
            >
              {metrics.avgFulfillmentRate >= 95 ? "On Target" : "Below Target"}
            </Badge>
            {metrics.avgFulfillmentRate < 95 && (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Suppliers Below 95%
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.suppliersBelow95Count}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            of {metrics.totalSuppliers} total suppliers
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Purchase Orders
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalPOs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            in selected period
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Fulfillment
          </CardTitle>
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalFulfillmentPct.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            across all suppliers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
