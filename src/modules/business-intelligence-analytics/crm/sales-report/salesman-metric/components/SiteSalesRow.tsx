"use client";

import React, { useState } from "react";
import { ChevronDown, ExternalLink, Eye, Plus, Target } from "lucide-react";
import { MetricRow } from "../types";

interface SiteSalesRowProps {
  row: MetricRow;
  onViewSupplierBreakdown?: (salesmanId: number, salesmanName: string) => void;
  onViewReachBreakdown?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewFrequencyDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewNewAccountsDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewProductiveOutletDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewLineSalesDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewBasketCountDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewTacticalSkuDetail?: (salesmanId: number, salesmanName: string) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(val);

const formatPercentage = (value?: number | null) => {
  if (value === undefined || value === null || isNaN(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
};

const getColorVariant = (achievement: number, status: string) => {
  const s = status.toLowerCase();
  if (s.includes("no target") || s.includes("none")) return "slate";
  if (achievement >= 100) return "emerald";
  if (achievement >= 50) return "orange";
  return "rose";
};

const colorClasses = {
  emerald: "bg-emerald-500 text-emerald-600",
  blue: "bg-blue-500 text-blue-600",
  orange: "bg-orange-400 text-orange-500",
  rose: "bg-rose-500 text-rose-600",
  slate: "bg-slate-400 text-slate-400",
};

export function SiteSalesRow({
  row,
  onViewSupplierBreakdown,
  onViewReachBreakdown,
  onViewFrequencyDetail,
  onViewNewAccountsDetail,
  onViewProductiveOutletDetail,
  onViewLineSalesDetail,
  onViewBasketCountDetail,
  onViewTacticalSkuDetail,
}: SiteSalesRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isZeroState = row.reach === 0 && row.salesPerformance === 0;

  // Build target array dynamically
  const targets = [
    {
      id: "productive",
      name: "Productive Outlets (M5)",
      actual: row.productiveOutletsActual,
      target: row.productiveOutletsTarget,
      achievement: row.productiveOutletsAchievement,
      status: row.productiveOutletsStatus,
      onView: () => onViewProductiveOutletDetail?.(row.salesmanId, row.salesmanName),
    },
    {
      id: "linesales",
      name: "Line Sales (M6)",
      actual: row.lineSalesActualReceipts,
      target: row.lineSalesTargetReceiptCount,
      achievement: row.lineSalesAchievement,
      status: row.lineSalesStatus,
      onView: () => onViewLineSalesDetail?.(row.salesmanId, row.salesmanName),
    },
    {
      id: "basketcount",
      name: "Basket Count (M7)",
      actual: row.basketCountActualReceipts,
      target: row.basketCountTargetReceiptCount,
      achievement: row.basketCountAchievement,
      status: row.basketCountStatus,
      onView: () => onViewBasketCountDetail?.(row.salesmanId, row.salesmanName),
    },
    {
      id: "tacticalsku",
      name: "Tactical SKU (M8)",
      actual: row.tacticalSkuActualQty,
      target: row.tacticalSkuTargetQty,
      achievement: row.tacticalSkuAchievement,
      status: row.tacticalSkuStatus,
      onView: () => onViewTacticalSkuDetail?.(row.salesmanId, row.salesmanName),
    },
  ];

  return (
    <div className="bg-card">
      <div
        className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors border-l-4 border-transparent ${
          isZeroState ? "hover:border-slate-300 dark:hover:border-slate-600" : "hover:border-blue-500"
        }`}
      >
        {/* Salesman Info */}
        <div className="col-span-1 md:col-span-2">
          <div className="font-bold text-foreground text-[15px]">{row.salesmanName}</div>
          <div className="text-[11px] text-muted-foreground uppercase">{row.salesmanCode}</div>
        </div>

        {/* Core Metrics List */}
        <div className="col-span-1 md:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sales (Metric 1)</div>
            <button
              onClick={() => onViewSupplierBreakdown?.(row.salesmanId, row.salesmanName)}
              className="flex items-center gap-2 group/btn"
            >
              <span
                className={`font-black text-base ${
                  isZeroState ? "text-foreground/70" : "text-foreground"
                }`}
              >
                {formatCurrency(row.salesPerformance)}
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground/60 group-hover/btn:text-blue-500" />
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Reach (Metric 2)</div>
            <button
              onClick={() =>
                !isZeroState && onViewReachBreakdown?.(row.salesmanId, row.salesmanCode, row.salesmanName)
              }
              className={`flex items-center gap-2 group/btn ${isZeroState ? "opacity-60 cursor-default" : ""}`}
            >
              <span className={`text-sm ${isZeroState ? "font-bold text-muted-foreground" : "font-bold text-foreground/90"}`}>
                {row.reach} Customers
              </span>
              {!isZeroState && <Eye className="w-3 h-3 text-muted-foreground/60 group-hover/btn:text-blue-500" />}
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Frequency (Metric 3)</div>
            <button
              onClick={() =>
                !isZeroState && onViewFrequencyDetail?.(row.salesmanId, row.salesmanCode, row.salesmanName)
              }
              className={`text-left group/btn ${isZeroState ? "opacity-60 cursor-default" : ""}`}
            >
              <div className={`text-sm flex items-center gap-2 ${isZeroState ? "font-bold text-muted-foreground" : "font-bold text-foreground/90"}`}>
                {row.frequencyCount} Transactions{" "}
                {!isZeroState && <Eye className="w-3 h-3 text-muted-foreground/60 group-hover/btn:text-blue-500" />}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                {formatCurrency(row.frequencyAmount)}
              </div>
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">New Accounts (Metric 4)</div>
            <button
              onClick={() =>
                !isZeroState && onViewNewAccountsDetail?.(row.salesmanId, row.salesmanCode, row.salesmanName)
              }
              className={`flex items-center gap-2 group/btn ${isZeroState ? "opacity-60 cursor-default" : ""}`}
            >
              <span className={`text-sm ${isZeroState ? "font-bold text-muted-foreground" : "font-bold text-foreground/90"}`}>
                {row.newAccounts} Accounts
              </span>
              {!isZeroState && <Plus className="w-3 h-3 text-muted-foreground/60 group-hover/btn:text-blue-500" />}
            </button>
          </div>
        </div>

        {/* Expander Toggle */}
        <div className="col-span-1 md:col-span-1 flex justify-end">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              isZeroState
                ? "text-muted-foreground hover:text-foreground bg-muted/40"
                : "text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300"
            }`}
          >
            Targets <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Target Metrics Expansion */}
      {expanded && (
        <div className="bg-muted/10 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            {targets.map((target) => {
              const isSet = target.target > 0;
              const percent = Math.min(Math.max(target.achievement || 0, 0), 100);
              const variant = getColorVariant(target.achievement, target.status);
              const colors = colorClasses[variant as keyof typeof colorClasses];
              const [bgClass, textClass] = colors.split(" ");

              return (
                <div
                  key={target.id}
                  className={`bg-card p-4 rounded-xl border border-border/60 shadow-sm ${
                    !isSet ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {target.name}
                    </h4>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <div className={`text-2xl font-black ${isSet ? "text-foreground" : "text-muted-foreground"}`}>
                      {target.actual}
                      <span className={`text-sm ${isSet ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                        /{target.target}
                      </span>
                    </div>
                    <div className={`text-xs font-bold ${isSet ? textClass : "text-muted-foreground"}`}>
                      {formatPercentage(target.achievement)}
                    </div>
                  </div>

                  {isSet ? (
                    <>
                      <div className="w-full bg-muted/60 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${bgClass}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <button
                        onClick={target.onView}
                        className="w-full text-center text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1.5 rounded border border-blue-100 dark:border-blue-900/50 transition-colors"
                      >
                        View Details
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between mt-4 border-t border-border/40 pt-3">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        No Target Set
                      </span>
                      <button
                        onClick={target.onView}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
