"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toISODate } from "@/lib/utils";
import { Branch, percent, Summary } from "./api";
import { useWarehouseResource } from "./useWarehouseResource";

export default function WarehouseDashboard() {
  const [branchId, setBranchId] = useState("");
  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth();
  const [month, setMonth] = useState(() => new Date().getMonth());
  const from = toISODate(new Date(year, month, 1));
  const to = toISODate(month === currentMonth ? today : new Date(year, month + 1, 0));
  const [revision, setRevision] = useState(0);
  const query = new URLSearchParams({ from, to, ...(branchId ? { branchId } : {}) }).toString();

  const { data: summary, error: requestError, loading } = useWarehouseResource<Summary>(`summary?${query}`, revision);
  const { data: branchData, error: branchError, loading: branchesLoading } = useWarehouseResource<{ branches: Branch[] }>("branches", revision);
  const error = requestError || (summary && !Array.isArray(summary.cards) ? "Invalid summary response." : "");
  const score = summary?.overallPercent;
  const measured = typeof score === "number" && Number.isFinite(score);
  const progress = measured ? Math.min(100, Math.max(0, score)) : 0;

  return <div className="mx-auto max-w-7xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Warehouse Operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Executive performance</h1><p className="mt-2 text-sm text-muted-foreground">Measured performance, coverage and the documents behind every score.</p></div>
    <Card><CardContent className="flex flex-wrap items-end gap-3 pt-6">
      <div className="w-full space-y-2 sm:w-64"><Label htmlFor="warehouse-branch">Warehouse</Label><Select value={branchId || "all"} onValueChange={value => setBranchId(value === "all" ? "" : value)} disabled={branchesLoading || Boolean(branchError)}><SelectTrigger id="warehouse-branch" className="w-full" aria-label="Warehouse"><SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select branch"} /></SelectTrigger><SelectContent><SelectItem value="all">All Branches</SelectItem>{branchData?.branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select>{branchesLoading && <p role="status" className="text-xs text-muted-foreground">Loading branches...</p>}{branchData?.branches.length === 0 && <p className="text-xs text-muted-foreground">No branches are configured.</p>}</div>
      <div className="w-full space-y-2 sm:w-56"><Label htmlFor="warehouse-month">Month</Label><Select value={String(month)} onValueChange={value => setMonth(Number(value))}><SelectTrigger id="warehouse-month" className="w-full" aria-label="Month"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: currentMonth + 1 }, (_, index) => <SelectItem key={index} value={String(index)}>{new Date(year, index, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</SelectItem>)}</SelectContent></Select></div>
      <Button variant="outline" onClick={() => setRevision(n => n + 1)}>Refresh</Button>
      <p className="pb-2 text-xs text-muted-foreground">{month === currentMonth ? "Current month through today" : "Full calendar month"}</p>
    </CardContent></Card>
      {branchError && <Alert variant="destructive"><AlertDescription><p>{branchError}</p><Button variant="outline" className="mt-2" onClick={() => setRevision(n => n + 1)}>Retry branches</Button></AlertDescription></Alert>}
      {loading && <div role="status" className="space-y-3"><span className="sr-only">Loading warehouse performance...</span><Skeleton className="h-52 w-full rounded-xl" /><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(index => <Skeleton key={index} className="h-40 rounded-xl" />)}</div></div>}
      {error && <Alert variant="destructive"><AlertDescription><p>{error}</p><Button className="mt-3" onClick={() => setRevision(n => n + 1)}>Retry</Button></AlertDescription></Alert>}
      {!loading && !error && summary && <>
        <Card><CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current Score</h2><p className="text-3xl font-semibold tabular-nums sm:text-4xl">{percent(summary.overallPercent)} <span className="text-sm text-muted-foreground">/ 100%</span></p><Badge variant="secondary" className={summary.meetsTarget === true ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : undefined}>{summary.meetsTarget === null ? "No measurable data" : summary.meetsTarget ? `Meets ${summary.targetPercent}% target` : `Below ${summary.targetPercent}% target`}</Badge></div>
            <div role="img" aria-label={measured ? `Current score: ${percent(score)}` : "Current score: no measurable data"} className="relative size-24 shrink-0 sm:size-32">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" /><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress} className="text-emerald-500 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500" opacity={progress > 0 ? 1 : 0} /></svg>
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums sm:text-xl">{percent(score)}</span>
            </div>
          </div>
          <Progress aria-label="Overall score" className="h-2.5 bg-emerald-500/20 [&_[data-slot=progress-indicator]]:bg-emerald-500" value={progress} />
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>Target: {summary.targetPercent}%</span><span>Weighted performance of {summary.cardsIncluded} of {summary.cardsTotal} KPIs</span></div><p className="text-sm text-muted-foreground">Based on {summary.weightCovered}% of the total weight. KPIs without data are not counted.</p>
        </CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{summary.cards.map((card, index) => <Card key={card.key}><CardHeader><CardTitle className="text-base">{index + 1}. {card.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-3xl font-semibold tabular-nums">{card.included ? percent(card.scorePercent) : "--"}</p><Progress aria-label={`${card.title} score`} value={card.included ? Math.min(100, Math.max(0, card.scorePercent ?? 0)) : 0} /><div className="flex items-center justify-between text-sm"><span>Weight: {card.weight}%</span><span className="text-muted-foreground">{!card.included ? "Not counted" : "Performance score"}</span></div>{card.key === "customer-satisfaction" && <p className="text-sm text-muted-foreground">Not implemented by the backend yet.</p>}</CardContent></Card>)}</div>
      </>}
  </div>;
}
