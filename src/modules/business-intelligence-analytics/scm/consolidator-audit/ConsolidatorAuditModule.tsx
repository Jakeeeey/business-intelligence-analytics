"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Package,
  FileSpreadsheet,
  AlertCircle,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConsolidatorAudit } from "./hooks/useConsolidatorAudit";
import { Filters } from "./components/Filters";
import { AuditDataTable } from "./components/DataTable";
import { StatusDistributionCharts } from "./components/StatusDistributionCharts";

import { PdfEngine } from "@/components/pdf-layout-design/PdfEngine";
import { renderElement } from "@/components/pdf-layout-design/PdfGenerator";
import { PAPER_SIZES } from "@/components/pdf-layout-design/constants";
import { CompanyData } from "@/components/pdf-layout-design/types";
import { PdfTemplate, pdfTemplateService } from "@/components/pdf-layout-design/services/pdf-template";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function getLoggedInUser(): { firstName: string; lastName: string } {
  if (typeof window === "undefined") return { firstName: "", lastName: "" };
  let token = getCookie("vos_access_token") || window.localStorage.getItem("access_token");
  if (!token) return { firstName: "System", lastName: "User" };

  try {
    const parts = token.split(".");
    if (parts.length < 2) return { firstName: "System", lastName: "User" };
    const p = parts[1];
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(
      window.atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    const firstName = payload.Firstname || payload.FirstName || payload.firstName || "";
    const lastName = payload.LastName || payload.Lastname || payload.lastName || "";
    return { firstName, lastName };
  } catch (e) {
    console.error("Failed to decode token", e);
    return { firstName: "System", lastName: "User" };
  }
}

function ConsolidatorAuditSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Filters Card Skeleton */}
      <div className="border rounded-xl p-4 space-y-4 dark:border-zinc-800 bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 md:col-span-2" />
          <Skeleton className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 md:col-span-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <Skeleton className="h-9 w-full bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-9 w-full bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-9 w-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex justify-end gap-2 w-full">
            <Skeleton className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Charts Skeleton */}
      <Skeleton className="h-64 w-full bg-zinc-200 dark:bg-zinc-800" />

      {/* Table Skeleton */}
      <div className="border rounded-xl overflow-hidden dark:border-zinc-800 bg-card">
        <div className="bg-muted/10 p-4 border-b dark:border-zinc-800">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-5 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-5 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-5 w-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-16 w-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-16 w-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ConsolidatorAuditModuleProps {
  userName?: string;
}

export default function ConsolidatorAuditModule({ userName = "System User" }: ConsolidatorAuditModuleProps) {
  const hook = useConsolidatorAudit();

  // Printing dependencies
  const [templates, setTemplates] = React.useState<PdfTemplate[]>([]);
  const [companyData, setCompanyData] = React.useState<CompanyData | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        const cached = localStorage.getItem("pdf_company_data");
        if (cached) setCompanyData(JSON.parse(cached));

        const [compRes, tpls] = await Promise.all([
          fetch("/api/pdf/company"),
          pdfTemplateService.fetchTemplates(),
        ]);

        if (compRes.ok) {
          const result = await compRes.json();
          const company = result.data?.[0] || (Array.isArray(result.data) ? null : result.data);
          setCompanyData(company);
          if (company) {
            localStorage.setItem("pdf_company_data", JSON.stringify(company));
          }
        }
        setTemplates(tpls);
      } catch (error) {
        console.error("Error loading PDF engine dependencies:", error);
      }
    };
    init();
  }, []);

  const handlePrint = async () => {
    if (templates.length === 0) {
      toast.error("No PDF templates found in database.");
      return;
    }
    if (!companyData) {
      toast.warning("Company data not loaded yet. Please wait.");
      return;
    }

    setIsGenerating(true);
    try {
      const templateName = templates[0].name;

      const doc = await PdfEngine.generateWithFrame(templateName, companyData, (doc, startY, config) => {
        const margins = config.margins || { top: 10, bottom: 10, left: 10, right: 10 };
        
        const baseSize = config.paperSize === "Custom" ? config.customSize : (PAPER_SIZES[config.paperSize] || PAPER_SIZES.A4);
        const paperHeight = config.orientation === "landscape" ? baseSize.width : baseSize.height;
        const bottomMargin = config.bodyEnd ? (paperHeight - config.bodyEnd) : margins.bottom;

        // Header Title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(24, 24, 27); // zinc-900
        doc.text("CONSOLIDATOR AUDIT REPORT", margins.left, startY, { baseline: "top" });

        // Date formatter helper inside printable
        const formatDate = (dateStr: string | null): string => {
          if (!dateStr) return "—";
          try {
            const date = new Date(dateStr.replace(" ", "T"));
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Manila",
            });
          } catch {
            return dateStr;
          }
        };

        const activeFilters = hook.activeFilters;
        
        // Two column data structure: Col 1 aligned left, Col 2 aligned right
        const filtersData = [
          [
            `Date Range: ${activeFilters.startDate} to ${activeFilters.endDate}`,
            `Created By: ${userName}`
          ],
          [
            `PDP Status: ${activeFilters.pdpStatus || "ALL"}`,
            `Created At: ${formatDate(new Date().toISOString())}`
          ],
          [
            `Consolidator Status: ${activeFilters.consolidatorStatus || "ALL"}`,
            ""
          ],
          [
            `DP Status: ${activeFilters.dpStatus || "ALL"}`,
            ""
          ]
        ];

        // Draw Filters section as a clean, borderless table
        autoTable(doc, {
          startY: startY + 8,
          margin: { left: margins.left, right: margins.right },
          body: filtersData,
          theme: "plain",
          styles: { fontSize: 8, cellPadding: 1.5, textColor: [113, 113, 122] }, // zinc-500
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" }
          }
        });

        // The data table should start below the filters table
        const currentY = (doc as any).lastAutoTable.finalY + 6;

        const head = [["Pre Dispatch Plan", "Consolidation", "Dispatch Plan"]];
        const body = hook.data.map((row) => {
          const pdpText = `${row.pdpNo || "Unknown PDP"} (${row.pdpStatus || "N/A"})\n${formatDate(row.pdpCreatedAt)}`;
          const consolText = `${row.consolidatorNo || "Unknown Consolidator"} (${row.consolidatorStatus || "N/A"})\n${formatDate(row.consolidatorCreatedAt)}`;
          
          let dpText = "";
          if (row.dpNo) {
            dpText = `${row.dpNo} (${row.dpStatus || "N/A"})\n${formatDate(row.dpCreatedAt)}`;
          } else {
            dpText = "Unknown Dispatch Plan (N/A)";
          }

          return [pdpText, consolText, dpText];
        });

        autoTable(doc, {
          startY: currentY,
          margin: { top: startY, bottom: bottomMargin, left: margins.left, right: margins.right },
          head,
          body,
          theme: "grid",
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: "bold", fontSize: 9, halign: "center" },
          styles: { fontSize: 8, cellPadding: 4, valign: "middle", halign: "center" },
          didDrawPage: (data) => {
            if (data.pageNumber > 1 && config && config.elements) {
              Object.values(config.elements).forEach((el) => {
                renderElement(doc, el, companyData);
              });
            }
          },
        });
      });

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to generate report PDF:", error);
      toast.error("Failed to generate PDF printable report.");
    } finally {
      setIsGenerating(false);
    }
  };

  // First-load page skeleton loader
  if (hook.loading && !hook.loadedOnce) {
    return <ConsolidatorAuditSkeleton />;
  }

  // Calculate quick summary metrics
  const uniquePdps = new Set(hook.data.map((r) => r.pdpNo).filter(Boolean));
  const uniqueConsols = new Set(hook.data.map((r) => r.consolidatorNo).filter(Boolean));
  const uniqueDps = new Set(hook.data.map((r) => r.dpNo).filter(Boolean));

  const totalPdps = uniquePdps.size;
  const totalConsolidators = uniqueConsols.size;
  const totalDps = uniqueDps.size;

  // Compute status breakdowns for tooltips
  const pdpStatusCounts: Record<string, number> = {};
  const consolStatusCounts: Record<string, number> = {};
  const dpStatusCounts: Record<string, number> = {};
  hook.data.forEach((r) => {
    if (r.pdpStatus)
      pdpStatusCounts[r.pdpStatus] =
        (pdpStatusCounts[r.pdpStatus] || 0) + 1;
    if (r.consolidatorStatus)
      consolStatusCounts[r.consolidatorStatus] =
        (consolStatusCounts[r.consolidatorStatus] || 0) + 1;
    if (r.dpStatus)
      dpStatusCounts[r.dpStatus] = (dpStatusCounts[r.dpStatus] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* --- HEADER (Breadcrumb + Title unified) --- */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic leading-none">
          Consolidator <span className="text-primary">Report</span>
        </h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Real-time consolidator audit trail across pre-dispatch, consolidation,
          and dispatch plans
        </p>
      </div>

      {/* Filters Panel */}
      <Filters
        filters={hook.draftFilters}
        onChange={hook.setDraftFilters}
        uniqueStatuses={hook.uniqueStatuses}
        onSearch={hook.handleSearch}
        onClear={hook.handleClear}
        onPrint={handlePrint}
        loading={hook.loading || isGenerating}
      />

      {/* Error Banner */}
      {hook.error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:border-destructive/40">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{hook.error}</span>
        </div>
      )}

      {hook.loadedOnce && hook.data.length > 0 && (
        <>
          {/* Refresh Loader */}
          {hook.loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-ping" />
              Updating audit records…
            </div>
          )}

          {/* --- KPI METRIC CARDS --- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pre-Dispatch Plans */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ClipboardList className="h-16 w-16 text-blue-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">
                        Pre-Dispatch Plans
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalPdps}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-blue-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Unique PDPs in current dataset
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">PDP Status Breakdown</span>
                    {Object.entries(pdpStatusCounts).length > 0 ? (
                      Object.entries(pdpStatusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between gap-6"
                        >
                          <span className="text-muted-foreground">
                            {status}
                          </span>
                          <span className="font-medium tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Consolidators Linked */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package className="h-16 w-16 text-sky-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] mb-1">
                        Consolidators Linked
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalConsolidators}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-sky-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Linked across {totalPdps} PDP
                        {totalPdps !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">
                      Consolidator Status Breakdown
                    </span>
                    {Object.entries(consolStatusCounts).length > 0 ? (
                      Object.entries(consolStatusCounts).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex justify-between gap-6"
                          >
                            <span className="text-muted-foreground">
                              {status}
                            </span>
                            <span className="font-medium tabular-nums">
                              {count}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Dispatch Plans Tagged */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden dark:border-zinc-700 cursor-default hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <FileSpreadsheet className="h-16 w-16 text-emerald-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                    <CardContent className="p-6 flex flex-col gap-1 relative z-10">
                      <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">
                        Dispatch Plans Tagged
                      </p>
                      <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums italic">
                        {totalDps}
                      </p>
                      <div className="mt-2 h-1 w-12 bg-emerald-500/40 rounded-full" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Linked across {totalConsolidators} consolidator
                        {totalConsolidators !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs rounded-lg border bg-background text-foreground p-3 shadow-lg text-sm dark:border-zinc-700"
                >
                  <div className="space-y-1">
                    <span className="font-medium">
                      Dispatch Plan Status Breakdown
                    </span>
                    {Object.entries(dpStatusCounts).length > 0 ? (
                      Object.entries(dpStatusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between gap-6"
                        >
                          <span className="text-muted-foreground">
                            {status}
                          </span>
                          <span className="font-medium tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* --- STATUS DISTRIBUTION CHARTS --- */}
          <StatusDistributionCharts data={hook.data} />

          {/* --- TABLE VIEW --- */}
          <div className="mt-4">
            <AuditDataTable data={hook.data} loading={hook.loading} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!hook.loading && hook.loadedOnce && hook.data.length === 0 && (
        <Card className="dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center p-8">
            {hook.hasRawData ? (
              <>
                <p className="text-lg font-semibold">No matching records found for the applied filters</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your document search or status filters.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">No data loaded for this date range</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your dates and clicking Search.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Initial State (never loaded yet) */}
      {!hook.loading && !hook.loadedOnce && (
        <Card className="dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Welcome to Consolidator Report
            </p>
            <p className="text-sm text-muted-foreground">
              Select filters or a date range to load audit data and view
              insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
