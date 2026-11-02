/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Download,
  MessageSquare,
  FileText,
  Send,
  Bot,
  User,
  RotateCcw,
} from "lucide-react";
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

function cleanMarkdownLatex(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Remove display math blocks $$...$$ or \[...\]
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, "$1");

  // 2. Remove inline math delimiters \(...\)
  cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, "$1");

  // 3. LaTeX text wrappers with space normalization: \text{...}, \mathrm{...}, \textbf{...}, etc.
  cleaned = cleaned.replace(/(\d)\s*\\(?:text|mathrm|mathbf|textit|mathit|textbf|bold)\{([^}]*)\}/g, "$1 $2");
  cleaned = cleaned.replace(/\\(?:text|mathrm|mathbf|textit|mathit|textbf|bold)\{([^}]*)\}/g, "$1");

  // 4. LaTeX math relational & arithmetic operators
  cleaned = cleaned.replace(/\\(?:le|leq)(?=[^a-zA-Z]|$)\s*/g, "≤ ");
  cleaned = cleaned.replace(/\\(?:ge|geq)(?=[^a-zA-Z]|$)\s*/g, "≥ ");
  cleaned = cleaned.replace(/\\(?:ne|neq)(?=[^a-zA-Z]|$)\s*/g, "≠ ");
  cleaned = cleaned.replace(/\\(?:approx|sim)(?=[^a-zA-Z]|$)\s*/g, "≈ ");
  cleaned = cleaned.replace(/\\pm(?=[^a-zA-Z]|$)\s*/g, "± ");
  cleaned = cleaned.replace(/\\times(?=[^a-zA-Z]|$)\s*/g, "× ");
  cleaned = cleaned.replace(/\\cdot(?=[^a-zA-Z]|$)\s*/g, "· ");
  cleaned = cleaned.replace(/\\(?:dots|ldots)(?=[^a-zA-Z]|$)\s*/g, "...");
  cleaned = cleaned.replace(/\\infty(?=[^a-zA-Z]|$)\s*/g, "∞");
  cleaned = cleaned.replace(/\\(?:lt)(?=[^a-zA-Z]|$)\s*/g, "< ");
  cleaned = cleaned.replace(/\\(?:gt)(?=[^a-zA-Z]|$)\s*/g, "> ");

  // 5. LaTeX spacing and escaped symbols
  cleaned = cleaned.replace(/\\(?:quad|qquad)\s*/g, " ");
  cleaned = cleaned.replace(/\\[,;:!]\s*/g, " ");
  cleaned = cleaned.replace(/\\%/g, "%");
  cleaned = cleaned.replace(/\\_/g, "_");

  // 6. Strip math dollar signs: e.g. "$≤ 1.0 Day$" or "$90.0%$"
  cleaned = cleaned.replace(/\$([^\$\n]*?(?:[≤≥≠≈±×·<>]|%|\b(?:Days?|Hours?|Mins?|Secs?)\b)[^\$\n]*?)\$/gi, "$1");
  cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    // Preserve pure currency like $100 or $25.50
    if (/^\s*[\d,]+(?:\.\d+)?\s*$/.test(inner)) return match;
    return inner;
  });

  // 7. Clean up accidental multiple spaces (preserving newlines)
  cleaned = cleaned.replace(/([^\S\r\n]{2,})/g, " ");

  return cleaned.trim();
}

// Helper to compute basic metrics so the AI has a summary instead of 1000s of rows
function computeMetrics(rows: LeadTimeRow[]) {
  const diff = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.max(0, Math.floor((d2 - d1) / 86400000));
  };

  const app = rows
    .map((r) => diff(r.purchasedDate, r.approvedDate))
    .filter((v): v is number => v !== null);
  const pick = rows
    .map((r) => diff(r.purchasedDate, r.pickedConsoDate))
    .filter((v): v is number => v !== null);
  const disp = rows
    .map((r) => diff(r.purchasedDate, r.dispatchedDate))
    .filter((v): v is number => v !== null);

  const mean = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : null);

  return {
    totalRows: rows.length,
    approval: { avgDays: mean(app), highestDays: max(app) },
    pickedConso: { avgDays: mean(pick), highestDays: max(pick) },
    dispatch: { avgDays: mean(disp), highestDays: max(disp) },
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Which stage has the biggest bottleneck?",
  "Which customers experienced critical delays (>3 days)?",
  "How can we optimize dispatch and improve our OTIF rate?",
  "Give me a 3-step action plan to fix approval lags.",
];

export function AIAnalystReport({
  rows,
  loading: rowsLoading,
}: {
  rows: LeadTimeRow[];
  loading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "chat">("report");

  // Report state
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Executive_Lead_Time_Report",
  });

  // Utility diff for the sample rows
  const diff = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2)) return null;
    return Math.max(0, Math.floor((d2 - d1) / 86400000));
  };

  const getPayloadData = () => {
    const metrics = computeMetrics(rows);
    // Send 25 sample rows to optimize payload size and response latency
    const sampleRows = rows.slice(0, 25).map((r) => ({
      customer: r.customerName,
      poDate: r.purchasedDate,
      approvalDays: diff(r.purchasedDate, r.approvedDate),
      dispatchDays: diff(r.purchasedDate, r.dispatchedDate),
      status: r.status,
    }));
    return { metrics, rows: sampleRows };
  };

  // Generate Report
  const generateReport = async () => {
    if (rows.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const { metrics, rows: sampleRows } = getPayloadData();

      const res = await fetch(
        "/api/bia/crm/customer-lead-time-tracker/ai-analyst",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "report", metrics, rows: sampleRows }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch report from AI");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setReport(data.report);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto seed initial bot greeting when switching to chat
  useEffect(() => {
    if (activeTab === "chat" && chatMessages.length === 0) {
      const nowStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setChatMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content:
            "👋 **Hello! I'm your AI Lead Time Analyst.**\n\nI have loaded your filtered customer lead time metrics and orders. You can ask me anything about:\n- Specific customer bottlenecks and delayed POs\n- Fulfillment stage durations (Approval, Picking, Dispatch)\n- Concrete operational recommendations to hit SLA targets",
          timestamp: nowStr,
        },
      ]);
    }
  }, [activeTab, chatMessages.length]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatSending, activeTab]);

  // Send message to Chatbot
  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || isChatSending) return;

    const nowStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: nowStr,
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setInputQuestion("");
    setIsChatSending(true);

    try {
      const { metrics, rows: sampleRows } = getPayloadData();

      // Convert to simplified history for API
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(
        "/api/bia/crm/customer-lead-time-tracker/ai-analyst",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "chat",
            metrics,
            rows: sampleRows,
            messages: apiMessages,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const botReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.report || "No answer provided.",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatMessages((prev) => [...prev, botReply]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to deliver message.";
      const errorReply: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Error:** ${errorMsg}\n\nPlease try again or verify your API configuration.`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
      >
        {/* Header with Title & Tab Switcher */}
        <SheetHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  AI Lead Time Analyst
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time intelligence and interactive recommendations
                </SheetDescription>
              </div>
            </div>

            {/* Tab Pill Buttons */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("report")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === "report"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Executive Report</span>
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                <span>Ask AI Chatbot</span>
                {chatMessages.length > 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Tab 1: Executive Report View */}
        {activeTab === "report" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {!report && !isGenerating && !error && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1">
                    Ready to Analyze Lead Time
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    The AI will process the current data metrics and sample rows
                    to formulate an executive report with bottleneck diagnoses
                    and operational recommendations.
                  </p>
                  <Button
                    onClick={generateReport}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 animate-in fade-in duration-300">
                <Loader2 className="h-9 w-9 text-indigo-500 animate-spin" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Analyzing Lead Time &amp; Delays...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Synthesizing approval, picking, and dispatch duration trends.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900 max-w-md text-xs">
                  <h3 className="font-bold mb-1 text-sm">Analysis Failed</h3>
                  <p>{error}</p>
                </div>
                <Button onClick={generateReport} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            )}

            {report && !isGenerating && (
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                <div
                  ref={printRef}
                  className="max-w-none text-sm text-slate-900 dark:text-slate-100 space-y-4 print:p-10 print:text-black"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node: _node, ...props }) => (
                        <h1
                          className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-6 mb-4"
                          {...props}
                        />
                      ),
                      h2: ({ node: _node, ...props }) => (
                        <h2
                          className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-6 mb-3"
                          {...props}
                        />
                      ),
                      h3: ({ node: _node, ...props }) => (
                        <h3
                          className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-4 mb-2"
                          {...props}
                        />
                      ),
                      p: ({ node: _node, ...props }) => (
                        <p className="leading-relaxed mb-4" {...props} />
                      ),
                      ul: ({ node: _node, ...props }) => (
                        <ul
                          className="list-disc pl-6 mb-4 space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ node: _node, ...props }) => (
                        <ol
                          className="list-decimal pl-6 mb-4 space-y-1"
                          {...props}
                        />
                      ),
                      li: ({ node: _node, ...props }) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                      strong: ({ node: _node, ...props }) => (
                        <strong
                          className="font-semibold text-indigo-900 dark:text-indigo-300"
                          {...props}
                        />
                      ),
                      table: ({ node: _node, ...props }) => (
                        <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <table
                            className="w-full border-collapse text-xs"
                            {...props}
                          />
                        </div>
                      ),
                      th: ({ node: _node, ...props }) => (
                        <th
                          className="border-b-2 border-indigo-200 dark:border-indigo-800 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-left font-bold text-indigo-900 dark:text-indigo-300"
                          {...props}
                        />
                      ),
                      td: ({ node: _node, ...props }) => (
                        <td
                          className="border-b border-slate-100 dark:border-slate-800/80 p-2.5"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {cleanMarkdownLatex(report)}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Report Footer Actions */}
            {report && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("chat")}
                  className="gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Chat about this report →</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 text-xs border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateReport}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Chatbot View */}
        {activeTab === "chat" && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/40 dark:bg-slate-900/40">
            {/* Quick Questions Chips */}
            <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Suggestions:
              </span>
              {QUICK_PROMPTS.map((promptText, i) => (
                <button
                  key={i}
                  disabled={isChatSending}
                  onClick={() => handleSendMessage(promptText)}
                  className="shrink-0 text-left px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 transition cursor-pointer disabled:opacity-50"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {chatMessages.map((msg) => {
                const isBot = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                        isBot
                          ? "bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80"
                          : "bg-indigo-600 text-white rounded-br-xs"
                      }`}
                    >
                      {isBot ? (
                        <div className="space-y-2 prose-xs">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node: _node, ...props }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                              ),
                              strong: ({ node: _node, ...props }) => (
                                <strong
                                  className="font-semibold text-indigo-950 dark:text-indigo-200"
                                  {...props}
                                />
                              ),
                              ul: ({ node: _node, ...props }) => (
                                <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />
                              ),
                              ol: ({ node: _node, ...props }) => (
                                <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />
                              ),
                              li: ({ node: _node, ...props }) => (
                                <li className="leading-relaxed" {...props} />
                              ),
                              table: ({ node: _node, ...props }) => (
                                <div className="overflow-x-auto my-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                                  <table className="w-full border-collapse text-[11px]" {...props} />
                                </div>
                              ),
                              th: ({ node: _node, ...props }) => (
                                <th
                                  className="border-b border-indigo-200 dark:border-indigo-800 bg-slate-50 dark:bg-slate-700/50 p-1.5 font-bold text-left"
                                  {...props}
                                />
                              ),
                              td: ({ node: _node, ...props }) => (
                                <td className="border-b border-slate-100 dark:border-slate-700/60 p-1.5" {...props} />
                              ),
                            }}
                          >
                            {cleanMarkdownLatex(msg.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      <div
                        className={`text-[9px] mt-1.5 font-mono text-right ${
                          isBot
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-indigo-200"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {!isBot && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isChatSending && (
                <div className="flex items-start gap-2.5 justify-start animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Analyzing data &amp; drafting recommendation...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about bottlenecks, orders, or recommendations..."
                  value={inputQuestion}
                  disabled={isChatSending}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
                />

                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuestion.trim() || isChatSending}
                  size="sm"
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-40"
                >
                  {isChatSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
                <span>Press Enter to send</span>
                <span>Powered by Gemini AI Lead Time Intelligence</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default AIAnalystReport;
