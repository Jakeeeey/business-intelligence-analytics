"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { TacticalSkuCharts } from "./components/TacticalSkuCharts";
import { TacticalSkuFiltersBar } from "./components/TacticalSkuFilters";
import { TacticalSkuKpisBar } from "./components/TacticalSkuKpis";
import { TacticalSkuTable } from "./components/TacticalSkuTable";
import { useTacticalSkuReport } from "./hooks/useTacticalSkuReport";

export default function TacticalSkuModule() {
	const report = useTacticalSkuReport();

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-2xl font-bold tracking-tight">Tactical SKU Report</h2>
				<p className="text-sm text-muted-foreground">
					Product inventory, salesman reach, and target attainment overview.
				</p>
			</div>

			<TacticalSkuFiltersBar
				value={report.filters}
				onChange={report.setFilters}
				onGenerate={report.generateReport}
				loading={report.loading}
			/>

			{!!report.error && (
				<Card>
					<CardContent className="pt-6 text-sm text-destructive">{report.error}</CardContent>
				</Card>
			)}

			{!!report.warnings.length && (
				<Card>
					<CardContent className="space-y-1 pt-6 text-sm text-amber-600">
						{report.warnings.map((warning, idx) => (
							<div key={`${warning}-${idx}`}>{warning}</div>
						))}
					</CardContent>
				</Card>
			)}

			<div className="relative mt-4">
				{report.loading && (
					<div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
						<div className="flex flex-col items-center justify-center gap-3 rop-shadow-md">
							<Spinner className="size-8 text-primary" />
							<span className="text-sm font-medium text-muted-foreground animate-pulse">
								Generating Report...
							</span>
						</div>
					</div>
				)}

				<div className={cn("space-y-4 transition-all duration-300", report.loading && "opacity-60 pointer-events-none")}>
					<TacticalSkuKpisBar kpis={report.kpis} />
					<TacticalSkuCharts data={report.chartData} />

					<TacticalSkuTable
						rows={report.rows}
						expandedKey={report.expandedKey}
						onToggle={report.toggleExpanded}
						loading={report.loading}
					/>
				</div>
			</div>
		</div>
	);
}
