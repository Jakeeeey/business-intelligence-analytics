"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronRight, ArrowLeft, BarChart3, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatVal = (v: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(v);
};

export type RankItem = {
  id: string | number;
  name: string;
  amount: number;
};

type RankingsDashboardProps = {
  salesmenData: RankItem[];
  suppliersData: RankItem[]; // for the selected salesman
  customersData: RankItem[]; // for the selected salesman + supplier combo
  selectedSalesmanId: number | null;
  selectedSalesmanName: string;
  selectedSupplierId: number | null;
  selectedSupplierName: string;
  onSelectSalesman: (id: number | null, name: string) => void;
  onSelectSupplier: (id: number | null, name: string) => void;
};

const CHART_COLORS = [
  "#f59e0b", // Rank 1: Gold / Amber
  "#94a3b8", // Rank 2: Silver / Slate
  "#ea580c", // Rank 3: Bronze / Orange-Copper
  "hsl(var(--primary) / 0.65)",
  "hsl(var(--primary) / 0.45)",
];

export default function RankingsDashboard({
  salesmenData,
  suppliersData,
  customersData,
  selectedSalesmanId,
  selectedSalesmanName,
  selectedSupplierId,
  selectedSupplierName,
  onSelectSalesman,
  onSelectSupplier,
}: RankingsDashboardProps) {
  // Determine active tier
  const tier = React.useMemo(() => {
    if (selectedSalesmanId === null) return "salesman";
    if (selectedSupplierId === null) return "supplier";
    return "customer";
  }, [selectedSalesmanId, selectedSupplierId]);

  // Determine active dataset
  const activeData = React.useMemo(() => {
    if (tier === "salesman") return salesmenData;
    if (tier === "supplier") return suppliersData;
    return customersData;
  }, [tier, salesmenData, suppliersData, customersData]);

  // Top 5 for chart
  const topFive = React.useMemo(() => {
    return activeData.slice(0, 5);
  }, [activeData]);

  // Max value for progress bars
  const maxAmount = React.useMemo(() => {
    if (activeData.length === 0) return 1;
    return Math.max(...activeData.map((d) => d.amount));
  }, [activeData]);

  // Navigation handlers
  const handleBack = () => {
    if (tier === "customer") {
      onSelectSupplier(null, "");
    } else if (tier === "supplier") {
      onSelectSalesman(null, "");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Visual Chart Card */}
      <Card className="lg:col-span-2 border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b px-4 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {tier === "salesman" && "Top Salesman Contribution"}
              {tier === "supplier" && `Suppliers for ${selectedSalesmanName}`}
              {tier === "customer" && `Customers for ${selectedSupplierName}`}
            </CardTitle>
          </div>
          {tier !== "salesman" && (
            <button
              onClick={handleBack}
              className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}
        </CardHeader>
        <CardContent className="p-4 flex items-center justify-center min-h-[300px]">
          {topFive.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No sales records for the selected period.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFive} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as RankItem;
                        return (
                          <div className="bg-background/95 border shadow-md rounded-lg p-2 text-xs">
                            <span className="font-bold text-foreground block mb-0.5">{item.name}</span>
                            <span className="text-primary font-black">{formatVal(item.amount)}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {topFive.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rankings List Card */}
      <Card className="border shadow-xs overflow-hidden flex flex-col">
        <CardHeader className="bg-muted/30 border-b px-4 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {tier === "salesman" && "Salesman Rankings"}
              {tier === "supplier" && "Supplier Rankings"}
              {tier === "customer" && "Customer Rankings"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto max-h-[350px] flex-1 scrollbar-thin">
          {activeData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No rankings available.
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {activeData.map((item, idx) => {
                  const percent = (item.amount / maxAmount) * 100;
                  const isSelectable = tier !== "customer";

                  // Top 3 style customization helper
                  let rankBg = "bg-primary/10 text-primary";
                  let nameStyle = "text-foreground";
                  let barColor = "bg-primary";
                  let showTrophy = false;
                  let trophyColor = "";

                  if (idx === 0) {
                    rankBg = "bg-amber-500 text-white font-black";
                    nameStyle = "text-amber-600 font-extrabold";
                    barColor = "bg-amber-500";
                    showTrophy = true;
                    trophyColor = "text-amber-500 animate-pulse";
                  } else if (idx === 1) {
                    rankBg = "bg-slate-400 text-white font-bold";
                    nameStyle = "text-slate-600 font-bold";
                    barColor = "bg-slate-400";
                    showTrophy = true;
                    trophyColor = "text-slate-400";
                  } else if (idx === 2) {
                    rankBg = "bg-orange-600 text-white font-bold";
                    nameStyle = "text-orange-700 font-bold";
                    barColor = "bg-orange-600";
                    showTrophy = true;
                    trophyColor = "text-orange-600";
                  }

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        if (tier === "salesman") {
                          onSelectSalesman(Number(item.id), item.name);
                        } else if (tier === "supplier") {
                          onSelectSupplier(Number(item.id), item.name);
                        }
                      }}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors duration-150 ${
                        isSelectable ? "cursor-pointer hover:bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] shrink-0 ${rankBg}`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-xs block truncate ${nameStyle}`}>
                              {item.name}
                            </span>
                            {showTrophy && (
                              <Trophy className={`h-3 w-3 shrink-0 ${trophyColor}`} />
                            )}
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full bg-muted/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-black ${idx <= 2 ? nameStyle : "text-primary"}`}>
                          {formatVal(item.amount)}
                        </span>
                        {isSelectable && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
