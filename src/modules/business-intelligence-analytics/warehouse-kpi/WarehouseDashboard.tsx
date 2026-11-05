"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toISODate } from "@/lib/utils";
import { percent, Summary } from "./api";
import { useWarehouseResource } from "./useWarehouseResource";
import KpiDetail from "./KpiDetail";

export default function WarehouseDashboard() {
  const [branchId, setBranchId] = useState("");
  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth();
  const [month, setMonth] = useState(() => new Date().getMonth());
  const from = toISODate(new Date(year, month, 1));
  const to = toISODate(month === currentMonth ? today : new Date(year, month + 1, 0));
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState("");
  const query = new URLSearchParams({ from, to, ...(branchId ? { branchId } : {}) }).toString();

  const { data: summary, error: requestError, loading } = useWarehouseResource<Summary>(`summary?${query}`, revision);
  const error = requestError || (summary && !Array.isArray(summary.cards) ? "Invalid summary response." : "");
  const score = summary?.overallPercent;
  const measured = typeof score === "number" && Number.isFinite(score);
  const progress = measured ? Math.min(100, Math.max(0, score)) : 0;

  return <div className="mx-auto max-w-7xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Warehouse Operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Executive performance</h1><p className="mt-2 text-sm text-muted-foreground">Measured performance, coverage and the documents behind every score.</p></div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      <label className="space-y-1 text-sm">Warehouse<select aria-label="Warehouse" className="block h-9 rounded-md border bg-background px-3" value={branchId} onChange={e => { setBranchId(e.target.value); setSelected(""); }}><option value="">All Warehouses</option><option value="190">Dry</option><option value="194">Frozen</option><option value="196">Industrial</option><option value="278">Central</option></select></label>
      <label className="space-y-1 text-sm">Month<select aria-label="Month" className="block h-9 rounded-md border bg-background px-3" value={month} onChange={e => { setMonth(Number(e.target.value)); setSelected(""); }}>{Array.from({ length: currentMonth + 1 }, (_, index) => <option key={index} value={index}>{new Date(year, index, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</option>)}</select></label>
      <Button variant="outline" onClick={() => setRevision(n => n + 1)}>Refresh</Button>
      <p className="pb-2 text-xs text-muted-foreground">{month === currentMonth ? "Current month through today" : "Full calendar month"}</p>
    </div>
      {loading && <div role="status" className="animate-pulse rounded-xl border p-10">Loading warehouse performance...</div>}
      {error && <div role="alert" className="rounded-xl border border-destructive p-5"><p>{error}</p><Button className="mt-3" onClick={() => setRevision(n => n + 1)}>Retry</Button></div>}
      {!loading && !error && summary && <>
        <Card><CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current Score</h2><p className="text-3xl font-semibold tabular-nums sm:text-4xl">{percent(summary.overallPercent)} <span className="text-sm text-muted-foreground">/ 100%</span></p><span className={`inline-block rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${summary.meetsTarget === true ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{summary.meetsTarget === null ? "No measurable data" : summary.meetsTarget ? `Meets ${summary.targetPercent}% target` : `Below ${summary.targetPercent}% target`}</span></div>
            <div role="img" aria-label={measured ? `Current score: ${percent(score)}` : "Current score: no measurable data"} className="relative size-24 shrink-0 sm:size-32">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" /><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress} className="text-emerald-500 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500" opacity={progress > 0 ? 1 : 0} /></svg>
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums sm:text-xl">{percent(score)}</span>
            </div>
          </div>
          <progress aria-label="Overall score" className="h-2.5 w-full accent-emerald-500" max={100} value={progress} />
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>Target: {summary.targetPercent}%</span><span>Weighted performance of {summary.cardsIncluded} of {summary.cardsTotal} KPIs</span></div><p className="text-sm text-muted-foreground">Based on {summary.weightCovered}% of the total weight. KPIs without data are not counted.</p>
        </CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{summary.cards.map((card, index) => <Card key={card.key}><CardHeader><CardTitle className="text-base">{index + 1}. {card.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-3xl font-semibold tabular-nums">{card.included ? percent(card.scorePercent) : "--"}</p><progress aria-label={`${card.title} score`} className="h-2 w-full accent-primary" max={100} value={card.included ? card.scorePercent ?? 0 : 0} /><div className="flex items-center justify-between text-sm"><span>Weight: {card.weight}%</span><span className="text-muted-foreground">{!card.included ? "Not counted" : "Performance score"}</span></div>{card.key === "customer-satisfaction" ? <p className="text-sm text-muted-foreground">Not implemented by the backend yet.</p> : <Button variant="outline" className="w-full" onClick={() => setSelected(card.key)}>View BIA</Button>}</CardContent></Card>)}</div>
        {selected && <KpiDetail key={`${selected}:${query}:${revision}`} cardKey={selected} query={query} onClose={() => setSelected("")} />}
      </>}
  </div>;
}
