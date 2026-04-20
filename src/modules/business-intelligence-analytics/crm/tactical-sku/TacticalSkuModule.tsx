"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { TacticalSkuCharts } from "./components/TacticalSkuCharts";
import { TacticalSkuFiltersBar } from "./components/TacticalSkuFilters";
import { TacticalSkuKpisBar } from "./components/TacticalSkuKpis";
import { TacticalSkuTable } from "./components/TacticalSkuTable";
import { useTacticalSkuReport } from "./hooks/useTacticalSkuReport";
import { printTacticalSkuReport } from "./utils/printHelper";

const MONTH_OPTIONS = [
	{ value: "01", label: "January" },
	{ value: "02", label: "February" },
	{ value: "03", label: "March" },
	{ value: "04", label: "April" },
	{ value: "05", label: "May" },
	{ value: "06", label: "June" },
	{ value: "07", label: "July" },
	{ value: "08", label: "August" },
	{ value: "09", label: "September" },
	{ value: "10", label: "October" },
	{ value: "11", label: "November" },
	{ value: "12", label: "December" },
];

function parseMonthValue(value: string): { year: string; month: string } {
	const now = new Date();
	const current = {
		year: String(now.getFullYear()),
		month: String(now.getMonth() + 1).padStart(2, "0"),
	};

	if (!/^\d{4}-\d{2}$/.test(value)) return current;

	const [year, month] = value.split("-");
	if (!MONTH_OPTIONS.some((m) => m.value === month)) return current;

	return { year, month };
}

type TacticalSkuModuleProps = {
	userName?: string;
};

export default function TacticalSkuModule({ userName }: TacticalSkuModuleProps) {
	const report = useTacticalSkuReport();
	const [printing, setPrinting] = React.useState(false);
	const currentYear = new Date().getFullYear();
	const minYear = 2000;
	const maxYear = currentYear + 100;
	const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, idx) => String(minYear + idx));
	const { year, month } = parseMonthValue(report.filters.month);

	const handleMonthChange = (nextMonth: string) => {
		report.setFilters({ ...report.filters, month: `${year}-${nextMonth}` });
	};

	const handleYearChange = (nextYear: string) => {
		report.setFilters({ ...report.filters, month: `${nextYear}-${month}` });
	};

	const handlePrint = React.useCallback(async () => {
		if (report.loading || printing) return;
		if (!report.rows.length) {
			toast.warning("No report data to print.");
			return;
		}

		setPrinting(true);
		try {
			await printTacticalSkuReport({
				month: report.filters.month,
				rows: report.rows,
				kpis: report.kpis,
				generatedBy: userName,
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Failed to print Tactical SKU report.";
			toast.error(message);
		} finally {
			setPrinting(false);
		}
	}, [printing, report.filters.month, report.kpis, report.loading, report.rows, userName]);

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-2xl font-bold tracking-tight">Tactical SKU Report</h2>
				<p className="text-sm text-muted-foreground">
					Product inventory, salesman reach, and target attainment overview.
				</p>
			</div>

			<div className="grid gap-3 lg:grid-cols-[560px_1fr]">
				<Card>
					<CardContent className="pt-2">
						<p className="mb-1 text-sm text-muted-foreground">
							Choose the reporting period, then generate the current report.
						</p>
						<div className="grid gap-3 md:grid-cols-[240px_auto]">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Month & Year</p>
								<div className="grid grid-cols-2 gap-2">
									<Select value={month} onValueChange={handleMonthChange} disabled={report.loading || printing}>
										<SelectTrigger aria-label="Report month">
											<SelectValue placeholder="Month" />
										</SelectTrigger>
										<SelectContent>
											{MONTH_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								
									<Select value={year} onValueChange={handleYearChange} disabled={report.loading || printing}>
										<SelectTrigger aria-label="Report year">
											<SelectValue placeholder="Year" />
										</SelectTrigger>
										<SelectContent>
											{yearOptions.map((opt) => (
												<SelectItem key={opt} value={opt}>
													{opt}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-end gap-2">
								<Button onClick={report.generateReport} disabled={report.loading || printing}>
									{report.loading ? "Loading..." : "Generate Report"}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<TacticalSkuFiltersBar
					value={report.filters}
					onChange={report.setFilters}
					skuOptions={report.skuOptions}
					salesmanOptions={report.salesmanOptions}
					onPrint={handlePrint}
					printing={printing}
					disabled={report.loading || printing}
				/>
			</div>

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
