"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, TrendingUp, Users } from "lucide-react";

interface TargetHealthMetricsProps {
  totalTarget: number;
  totalAllocated: number;
  approvalCount: number;
  totalApprovers: number;
  isLoading?: boolean;
}

export function TargetHealthMetrics({
  totalTarget,
  totalAllocated,
  approvalCount,
  totalApprovers,
  isLoading
}: TargetHealthMetricsProps) {
  const formatPHP = (val: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);

  const balance = totalTarget - totalAllocated;
  const isBalanced = Math.abs(balance) < 0.01;
  const approvalPercent = totalApprovers > 0 ? (approvalCount / totalApprovers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Root Target */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-1 relative">
          <TrendingUp className="absolute top-2 right-2 h-4 w-4 text-slate-300 dark:text-slate-700" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Target</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 italic">
            {isLoading ? "..." : formatPHP(totalTarget)}
          </p>
        </CardContent>
      </Card>

      {/* Allocated */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm">
        <CardContent className="p-4 flex flex-col gap-1 relative">
          <Badge className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 border-none h-4 px-1.5 text-[8px]">ACTIVE</Badge>
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Allocated</p>
          <p className="text-xl font-black text-blue-700 dark:text-blue-300 italic">
            {isLoading ? "..." : formatPHP(totalAllocated)}
          </p>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card className={`shadow-sm border-2 ${isBalanced 
        ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/10" 
        : "border-amber-500/30 bg-amber-50/30 dark:bg-amber-900/10"}`}>
        <CardContent className="p-4 flex flex-col gap-1 relative">
          {isBalanced ? (
            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-emerald-500" />
          ) : (
            <AlertCircle className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
          )}
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isBalanced ? "text-emerald-600" : "text-amber-600"}`}>
            Remaining Balance
          </p>
          <p className={`text-xl font-black italic ${isBalanced ? "text-emerald-700" : "text-amber-700"}`}>
            {isLoading ? "..." : formatPHP(balance)}
          </p>
        </CardContent>
      </Card>

      {/* Approval Status */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
        <CardContent className="p-4 flex flex-col gap-2 relative">
          <Users className="absolute top-2 right-2 h-4 w-4 text-slate-400" />
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Consensus</p>
            <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{approvalCount}/{totalApprovers}</span>
          </div>
          <Progress value={approvalPercent} className="h-1.5 bg-slate-200 dark:bg-slate-800" />
          <p className="text-[8px] text-slate-400 font-medium tracking-tight">VOTES SUBMITTED</p>
        </CardContent>
      </Card>
    </div>
  );
}
