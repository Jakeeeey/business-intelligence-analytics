/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useState } from "react";
import { useRef } from "react";
import { Sparkles, Loader2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useReactToPrint } from "react-to-print";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { LeadTimeRow } from "../types";

// Helper to compute basic metrics so the AI has a summary instead of 1000s of rows
function computeMetrics(rows: LeadTimeRow[]) {
  const diff = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.max(0, Math.floor((d2 - d1) / 86400000));
  };

  const app = rows.map((r) => diff(r.purchasedDate, r.approvedDate)).filter((v): v is number => v !== null);
  const pick = rows.map((r) => diff(r.purchasedDate, r.pickedConsoDate)).filter((v): v is number => v !== null);
  const disp = rows.map((r) => diff(r.purchasedDate, r.dispatchedDate)).filter((v): v is number => v !== null);

  const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : null);

  return {
    totalRows: rows.length,
    approval: { avgDays: mean(app), highestDays: max(app) },
    pickedConso: { avgDays: mean(pick), highestDays: max(pick) },
    dispatch: { avgDays: mean(disp), highestDays: max(disp) },
  };
}

export function AIAnalystReport({ rows, loading: rowsLoading }: { rows: LeadTimeRow[]; loading?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Executive_Lead_Time_Report",
  });

  const generateReport = async () => {
    if (rows.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const metrics = computeMetrics(rows);
      // We only send a sample of rows to avoid token limits
      const sampleRows = rows.slice(0, 50).map(r => ({
        customer: r.customerName,
        poDate: r.purchasedDate,
        approvalDays: diff(r.purchasedDate, r.approvedDate),
        dispatchDays: diff(r.purchasedDate, r.dispatchedDate),
        status: r.status,
      }));

      const res = await fetch("/api/bia/crm/customer-lead-time-tracker/ai-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, rows: sampleRows }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch report from AI");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setReport(data.report);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Utility diff for the sample rows
  const diff = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.max(0, Math.floor((d2 - d1) / 86400000));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
          disabled={rowsLoading || rows.length === 0}
        >
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Analyst Report
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-6 border-b bg-muted/20">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            AI Executive Summary
          </SheetTitle>
          <SheetDescription>
            A comprehensive interpretation of the currently filtered lead time data.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!report && !isGenerating && !error && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to analyze</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  The AI will process the current data metrics and a sample of the rows to provide actionable insights.
                </p>
                <Button onClick={generateReport} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Generate Report
                </Button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-in fade-in zoom-in duration-500">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
              <div>
                <h3 className="font-semibold">Analyzing Data...</h3>
                <p className="text-sm text-muted-foreground">The AI is crunching the numbers and drafting the report.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 max-w-md">
                <h3 className="font-semibold mb-2">Analysis Failed</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={generateReport} variant="outline">Try Again</Button>
            </div>
          )}

          {report && !isGenerating && (
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-transparent">
              <div ref={printRef} className="max-w-none text-sm text-foreground space-y-4 print:p-10 print:text-black">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node: _node, ...props}) => <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-6 mb-4" {...props} />,
                    h2: ({node: _node, ...props}) => <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-6 mb-3" {...props} />,
                    h3: ({node: _node, ...props}) => <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-4 mb-2" {...props} />,
                    p: ({node: _node, ...props}) => <p className="leading-relaxed mb-4" {...props} />,
                    ul: ({node: _node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                    ol: ({node: _node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                    li: ({node: _node, ...props}) => <li className="leading-relaxed" {...props} />,
                    strong: ({node: _node, ...props}) => <strong className="font-semibold text-indigo-900 dark:text-indigo-300" {...props} />,
                    table: ({node: _node, ...props}) => (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse text-sm" {...props} />
                      </div>
                    ),
                    th: ({node: _node, ...props}) => <th className="border-b-2 border-indigo-200 dark:border-indigo-800 p-2 text-left font-semibold text-indigo-900 dark:text-indigo-300" {...props} />,
                    td: ({node: _node, ...props}) => <td className="border-b border-indigo-100 dark:border-indigo-900 p-2" {...props} />,
                  }}
                >
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        
        {report && (
          <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
             <Button variant="outline" onClick={handlePrint} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Download className="h-4 w-4" />
                Download PDF
             </Button>
             <Button variant="outline" onClick={generateReport} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Regenerate
             </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
