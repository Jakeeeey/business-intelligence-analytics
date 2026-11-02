import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function CustomerAnnualSalesSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 h-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[500px] rounded-xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-3 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-52 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
