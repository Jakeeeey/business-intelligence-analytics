"use client";

import type { TacticalSkuKpis } from "../types";
import { formatNumber, formatPercent } from "../utils/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TacticalSkuKpisProps = {
  kpis: TacticalSkuKpis;
};

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="shadow-sm transition-all hover:bg-accent/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

export function TacticalSkuKpisBar({ kpis }: TacticalSkuKpisProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard title="Total Products" value={formatNumber(kpis.totalProducts)} />
      <KpiCard title="Total Inventory" value={formatNumber(kpis.totalInventory)} />
      <KpiCard title="Total Reach" value={formatNumber(kpis.totalReach)} />
      <KpiCard title="Total Target" value={formatNumber(kpis.totalTarget)} />
      <KpiCard title="Overall Target %" value={formatPercent(kpis.overallPercent)} />
    </div>
  );
}