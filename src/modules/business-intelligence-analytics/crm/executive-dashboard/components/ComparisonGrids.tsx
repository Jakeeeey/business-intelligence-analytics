// src/modules/business-intelligence-analytics/crm/executive-dashboard/components/ComparisonGrids.tsx
"use client";

import React from "react";
import { Info, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupplierTradeRecord, SupplierNonTradeRecord, DrillDownCategory } from "../types";

interface ComparisonGridsProps {
  tradeData: SupplierTradeRecord[];
  tradeTotals: Record<string, number>;
  nonTradeData: SupplierNonTradeRecord[];
  nonTradeTotals: Record<string, number>;
  drillDownCategory: DrillDownCategory;
  setDrillDownCategory: (cat: DrillDownCategory) => void;
  loading: boolean;
}

export function ComparisonGrids({
  tradeData,
  tradeTotals,
  nonTradeData,
  nonTradeTotals,
  drillDownCategory,
  setDrillDownCategory,
  loading,
}: ComparisonGridsProps) {
  const formatPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(val);

  // Categories helper mapping for Trade
  const tradeCategories: { key: DrillDownCategory; label: string; sub: string; isNegative?: boolean }[] = [
    { key: "purchases", label: "Purchases", sub: "Trade acquisitions" },
    { key: "sales", label: "Sales", sub: "Gross sales (do not deduct returns)" },
    { key: "arClaims", label: "AR Claims", sub: "Deductions & debit claims", isNegative: true },
    { key: "arTrade", label: "AR Trade", sub: "Accounts receivables from clients" },
    { key: "inventories", label: "Inventories", sub: "Net valuation of inventory stock" },
    { key: "salesReturn", label: "Sales Return", sub: "Returned items value", isNegative: true },
    { key: "accountsPayable", label: "Accounts Payable", sub: "Owed trade liabilities" },
  ];

  // Categories helper mapping for Non-Trade
  const nonTradeCategories: { key: DrillDownCategory; label: string; sub: string }[] = [
    { key: "expenses", label: "Expenses", sub: "General & administrative non-trade" },
    { key: "payablesNonTrade", label: "Payables (Non-trade)", sub: "Non-inventory payables" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* 1. TRADE SECTION CONTAINER */}
      <Card className="xl:col-span-8 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">
                Trade <span className="text-primary">Ledger Summary</span>
              </CardTitle>
              <Badge variant="secondary" className="text-[9px] font-black tracking-widest uppercase px-2 h-4">
                Interactive Grid
              </Badge>
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Select any row category below to drill down into monthly trends
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {tradeData.length > 0 && (
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase px-2 h-5 text-muted-foreground">
                {tradeData.length} Suppliers
              </Badge>
            )}
            <div className="p-2 bg-background rounded-xl border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
              <ClipboardList className="h-4 w-4 text-primary opacity-60" />
            </div>
          </div>
        </CardHeader>

        {/* Scrollable wrapper: Category column is sticky left, Consolidated is sticky right */}
        <CardContent className="p-0 overflow-x-auto">
          {loading && tradeData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                Synthesizing trade matrix...
              </span>
            </div>
          ) : (
            <table className="text-left border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-border/30 bg-muted/5">
                  {/* Sticky Category header */}
                  <th
                    className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground z-20 border-r border-border/20"
                    style={{ position: "sticky", left: 0, minWidth: 180, backgroundColor: "hsl(var(--card))" }}
                  >
                    Category
                  </th>

                  {/* All supplier columns */}
                  {tradeData.map((s, idx) => (
                    <th
                      key={idx}
                      className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center align-bottom"
                      style={{ minWidth: 130, maxWidth: 160 }}
                      title={s.supplierName}
                    >
                      <span className="block whitespace-normal break-words">
                        {s.supplierName || `SUPPLIER ${idx + 1}`}
                      </span>
                    </th>
                  ))}

                  {/* Sticky Consolidated header */}
                  <th
                    className="p-4 text-[10px] font-black uppercase tracking-widest text-primary text-right z-20 border-l border-border/20"
                    style={{ position: "sticky", right: 0, minWidth: 150, backgroundColor: "hsl(var(--card))" }}
                  >
                    Consolidated
                  </th>
                </tr>
              </thead>

              <tbody>
                {tradeCategories.map(({ key, label, sub, isNegative }) => {
                  const isSelected = drillDownCategory === key;
                  return (
                    <tr
                      key={key}
                      onClick={() => setDrillDownCategory(key)}
                      className={`border-b border-border/30 cursor-pointer transition-all duration-200 group/row ${
                        isSelected
                          ? "border-l-4 border-l-primary"
                          : "border-l-4 border-l-transparent hover:brightness-95"
                      }`}
                    >
                      {/* Sticky Category cell — fully opaque via inline backgroundColor */}
                      <td
                        className="p-4 z-10 border-r border-border/20"
                        style={{
                          position: "sticky",
                          left: 0,
                          minWidth: 180,
                          backgroundColor: isSelected
                            ? "color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))"
                            : "hsl(var(--card))",
                        }}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                            {sub}
                          </span>
                        </div>
                      </td>

                      {/* All supplier data cells */}
                      {tradeData.map((s, idx) => {
                        const val = s[key as keyof SupplierTradeRecord] as number;
                        return (
                          <td
                            key={idx}
                            className={`p-4 text-xs font-black tracking-tight text-right italic text-foreground/80 ${
                              isSelected ? "bg-primary/10" : "hover:bg-muted/10"
                            }`}
                            style={{ minWidth: 130 }}
                          >
                            {isNegative && val > 0 ? "-" : ""}
                            {formatPHP(val)}
                          </td>
                        );
                      })}

                      {/* Sticky Consolidated cell — fully opaque via inline backgroundColor */}
                      <td
                        className={`p-4 text-xs font-black tracking-tight text-right italic z-10 border-l border-border/20 ${
                          isSelected ? "text-primary text-sm" : "text-foreground"
                        }`}
                        style={{
                          position: "sticky",
                          right: 0,
                          minWidth: 150,
                          backgroundColor: isSelected
                            ? "color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))"
                            : "hsl(var(--card))",
                        }}
                      >
                        {isNegative && tradeTotals[key] > 0 ? "-" : ""}
                        {formatPHP(tradeTotals[key])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 2. NON-TRADE SECTION CONTAINER */}
      <Card className="xl:col-span-4 shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col group">
        <CardHeader className="border-b border-border/40 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">
                Non-Trade <span className="text-primary">Ledger</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Operating expenditures and general liabilities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {nonTradeData.length > 0 && (
                <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase px-2 h-5 text-muted-foreground">
                  {nonTradeData.length} Payees
                </Badge>
              )}
              <div className="p-2 bg-background rounded-xl border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
                <Info className="h-4 w-4 text-primary opacity-60" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-x-auto">
          {loading && nonTradeData.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                Synthesizing non-trade ledger...
              </span>
            </div>
          ) : (
            <table className="text-left border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-border/30 bg-muted/5">
                  {/* Sticky Category header */}
                  <th
                    className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground z-20 border-r border-border/20"
                    style={{ position: "sticky", left: 0, minWidth: 160, backgroundColor: "hsl(var(--card))" }}
                  >
                    Category
                  </th>

                  {/* All payee columns */}
                  {nonTradeData.map((n, idx) => (
                    <th
                      key={idx}
                      className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center align-bottom"
                      style={{ minWidth: 120, maxWidth: 150 }}
                      title={n.payeeName}
                    >
                      <span className="block whitespace-normal break-words">
                        {n.payeeName || `PAYEE ${idx + 1}`}
                      </span>
                    </th>
                  ))}

                  {/* Sticky Consolidated header */}
                  <th
                    className="p-4 text-[10px] font-black uppercase tracking-widest text-primary text-right z-20 border-l border-border/20"
                    style={{ position: "sticky", right: 0, minWidth: 130, backgroundColor: "hsl(var(--card))" }}
                  >
                    Consolidated
                  </th>
                </tr>
              </thead>

              <tbody>
                {nonTradeCategories.map(({ key, label, sub }) => {
                  const isSelected = drillDownCategory === key;
                  return (
                    <tr
                      key={key}
                      onClick={() => setDrillDownCategory(key)}
                      className={`border-b border-border/30 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-l-4 border-l-primary"
                          : "border-l-4 border-l-transparent hover:brightness-95"
                      }`}
                    >
                      {/* Sticky Category cell — fully opaque via inline backgroundColor */}
                      <td
                        className="p-4 z-10 border-r border-border/20"
                        style={{
                          position: "sticky",
                          left: 0,
                          minWidth: 160,
                          backgroundColor: isSelected
                            ? "color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))"
                            : "hsl(var(--card))",
                        }}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                            {sub}
                          </span>
                        </div>
                      </td>

                      {/* All payee data cells */}
                      {nonTradeData.map((n, idx) => {
                        const val = n[key as keyof SupplierNonTradeRecord] as number;
                        return (
                          <td
                            key={idx}
                            className={`p-4 text-xs font-black tracking-tight text-right italic text-foreground/80 ${
                              isSelected ? "bg-primary/10" : "hover:bg-muted/10"
                            }`}
                            style={{ minWidth: 120 }}
                          >
                            {formatPHP(val)}
                          </td>
                        );
                      })}

                      {/* Sticky Consolidated cell — fully opaque via inline backgroundColor */}
                      <td
                        className={`p-4 text-xs font-black tracking-tight text-right italic z-10 border-l border-border/20 ${
                          isSelected ? "text-primary text-sm" : "text-foreground"
                        }`}
                        style={{
                          position: "sticky",
                          right: 0,
                          minWidth: 130,
                          backgroundColor: isSelected
                            ? "color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))"
                            : "hsl(var(--card))",
                        }}
                      >
                        {formatPHP(nonTradeTotals[key as keyof typeof nonTradeTotals] || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
