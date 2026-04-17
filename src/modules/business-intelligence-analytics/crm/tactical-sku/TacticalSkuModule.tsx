"use client";

import * as React from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { TacticalSkuCharts } from "./components/TacticalSkuCharts";
import { TacticalSkuFiltersBar } from "./components/TacticalSkuFilters";
import { TacticalSkuKpisBar } from "./components/TacticalSkuKpis";
import { TacticalSkuTable } from "./components/TacticalSkuTable";
import { useTacticalSkuReport } from "./hooks/useTacticalSkuReport";
import { printTacticalSkuReport } from "./utils/printHelper";

export default function TacticalSkuModule() {
	const report = useTacticalSkuReport();
	const [printing, setPrinting] = React.useState(false);

	const handlePrint = React.useCallback(async () => {
		if (report.loading || printing) return;
		if (!report.rawRows.length) {
			toast.warning("No report data to print.");
			return;
		}

		setPrinting(true);
		try {
			await printTacticalSkuReport({
				month: report.filters.month,
				rows: report.rawRows,
				kpis: report.kpis,
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Failed to print Tactical SKU report.";
			toast.error(message);
		} finally {
			setPrinting(false);
		}
	}, [printing, report.filters.month, report.kpis, report.loading, report.rawRows]);

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
				onPrint={handlePrint}
				loading={report.loading}
				printing={printing}
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
