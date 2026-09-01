"use client";

import React, { useState } from "react";
import { ChevronDown, ExternalLink, Eye, Plus } from "lucide-react";
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
    <div className={`group relative rounded-2xl border border-border/40 transition-all duration-300 overflow-hidden ${expanded ? 'bg-card/60 backdrop-blur-xl border-primary/30 shadow-xl' : 'bg-muted/5 hover:bg-primary/5 hover:border-primary/20'}`}>
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Salesman Info and Overall Achievement */}
        <div className="flex flex-col min-w-[220px]">
          <div className="font-black text-[13px] uppercase tracking-wider text-foreground leading-none">{row.salesmanName}</div>
          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic mt-1 mb-3">{row.salesmanCode}</div>
          
          <div className="flex flex-col mt-auto">
            <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Overall Ach %</span>
            <span className={`text-xl font-black italic leading-none mt-1 ${isZeroState ? 'text-foreground/50' : (((row.salesAchievement || 0) + (row.reachAchievement || 0) + (row.frequencyAchievement || 0) + (row.newAccountsAchievement || 0)) / 4) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {(((row.salesAchievement || 0) + (row.reachAchievement || 0) + (row.frequencyAchievement || 0) + (row.newAccountsAchievement || 0)) / 4).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Core Metrics List */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Sales Perf */}
          <div 
            onClick={() => onViewSupplierBreakdown?.(row.salesmanId, row.salesmanName)}
            className="flex flex-col cursor-pointer group/stat bg-muted/5 p-3 rounded-xl hover:bg-blue-500/5 transition-colors border border-transparent hover:border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-1">
                Sales <ExternalLink className="h-3 w-3 text-blue-500/50" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/50">Target: {formatCurrency(row.targetSales || 0)}</span>
            </div>
            <span className={`text-lg font-black italic leading-none mb-2 ${isZeroState ? 'text-foreground/50' : 'text-blue-500 dark:text-blue-400 group-hover/stat:text-blue-600 transition-colors'}`}>
              {formatCurrency(row.salesPerformance)}
            </span>
            <div className="mt-auto flex justify-between items-end border-t border-border/40 pt-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50">Ach %</span>
              <span className={`text-[11px] font-black italic ${(row.salesAchievement || 0) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {(row.salesAchievement || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Reach */}
          <div 
            onClick={() => !isZeroState && onViewReachBreakdown?.(row.salesmanId, row.salesmanCode, row.salesmanName)}
            className={`flex flex-col group/stat bg-muted/5 p-3 rounded-xl transition-colors border border-transparent ${isZeroState ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-purple-500/5 hover:border-purple-500/20'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-1">
                Reach <Eye className="h-3 w-3 text-purple-500/50" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/50">Target: {row.targetReach || 0} Cust</span>
            </div>
            <span className="text-lg font-black italic leading-none mb-2 text-purple-500 dark:text-purple-400 group-hover/stat:text-purple-600 transition-colors">
              {row.reach} <span className="text-[10px] font-bold text-muted-foreground not-italic tracking-normal">Cust</span>
            </span>
            <div className="mt-auto flex justify-between items-end border-t border-border/40 pt-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50">Ach %</span>
              <span className={`text-[11px] font-black italic ${(row.reachAchievement || 0) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {(row.reachAchievement || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Frequency */}
          <div 
            onClick={() => !isZeroState && onViewFrequencyDetail?.(row.salesmanId, row.salesmanCode, row.salesmanName)}
            className={`flex flex-col group/stat bg-muted/5 p-3 rounded-xl transition-colors border border-transparent ${isZeroState ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/20'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-1">
                Frequency <Eye className="h-3 w-3 text-emerald-500/50" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/50">Target: {row.targetFrequency || 0} Txns</span>
            </div>
            <span className="text-lg font-black italic leading-none mb-2 text-emerald-500 dark:text-emerald-400 group-hover/stat:text-emerald-600 transition-colors">
              {row.frequencyCount} <span className="text-[10px] font-bold text-muted-foreground not-italic tracking-normal">Txns</span>
            </span>
            <div className="mt-auto flex justify-between items-end border-t border-border/40 pt-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50">Ach %</span>
              <span className={`text-[11px] font-black italic ${(row.frequencyAchievement || 0) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {(row.frequencyAchievement || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* New Accounts */}
          <div 
            onClick={() => !isZeroState && onViewNewAccountsDetail?.(row.salesmanId, row.salesmanCode, row.salesmanName)}
            className={`flex flex-col group/stat bg-muted/5 p-3 rounded-xl transition-colors border border-transparent ${isZeroState ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/20'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-1">
                New Acc <Plus className="h-3 w-3 text-amber-500/50" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/50">Target: {row.targetNewAccounts || 0} Accs</span>
            </div>
            <span className="text-lg font-black italic leading-none mb-2 text-amber-500 dark:text-amber-400 group-hover/stat:text-amber-600 transition-colors">
              {row.newAccounts} <span className="text-[10px] font-bold text-muted-foreground not-italic tracking-normal">Accs</span>
            </span>
            <div className="mt-auto flex justify-between items-end border-t border-border/40 pt-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50">Ach %</span>
              <span className={`text-[11px] font-black italic ${(row.newAccountsAchievement || 0) >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {(row.newAccountsAchievement || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Expander Toggle */}
        <div className="flex justify-end min-w-[100px]">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-colors ${
              expanded 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            Targets <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Target Metrics Expansion */}
      {expanded && (
        <div className="border-t border-border/20 bg-background/30 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {targets.map((target) => {
              const isSet = target.target > 0;
              const percent = Math.min(Math.max(target.achievement || 0, 0), 100);
              const variant = getColorVariant(target.achievement, target.status);
              
              const isEmerald = variant === "emerald";
              const isAmber = variant === "orange";
              const isRose = variant === "rose";

              const barColor = isEmerald ? "bg-emerald-500" : isAmber ? "bg-amber-500" : isRose ? "bg-destructive" : "bg-slate-400";
              const shadowColor = isEmerald ? "shadow-[0_0_10px_rgba(16,185,129,0.3)]" : isAmber ? "shadow-[0_0_10px_rgba(245,158,11,0.3)]" : isRose ? "shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "";
              const textColor = isEmerald ? "text-emerald-500" : isAmber ? "text-amber-500" : isRose ? "text-destructive" : "text-slate-400";

              return (
                <div
                  key={target.id}
                  className={`bg-card/50 p-5 rounded-2xl border border-border/40 shadow-lg backdrop-blur-sm group/target transition-all hover:bg-card hover:border-border/80 cursor-pointer ${
                    !isSet ? "opacity-60" : ""
                  }`}
                  onClick={target.onView}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {target.name}
                    </h4>
                    {!isSet && <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">No Target</span>}
                  </div>
                  
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Actual / Target</span>
                        <div className={`text-xl font-black italic leading-none mt-1 ${isSet ? "text-foreground" : "text-muted-foreground"}`}>
                            {target.actual} <span className="text-sm text-muted-foreground/50">/ {target.target}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Achv</span>
                        <div className={`text-lg font-black italic leading-none mt-1 ${isSet ? textColor : "text-muted-foreground"}`}>
                            {formatPercentage(target.achievement)}
                        </div>
                    </div>
                  </div>

                  {isSet && (
                    <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden border border-border/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${barColor} ${shadowColor}`}
                        style={{ width: `${percent}%` }}
                      />
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
