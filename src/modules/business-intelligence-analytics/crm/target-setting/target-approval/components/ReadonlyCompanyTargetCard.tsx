"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";
import type { TargetSettingExecutive } from "../types";

interface ReadonlyCompanyTargetCardProps {
  target: TargetSettingExecutive | null;
  isLoading: boolean;
}

export function ReadonlyCompanyTargetCard({ target, isLoading }: ReadonlyCompanyTargetCardProps) {
  const currency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <Card className="w-full relative overflow-hidden border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white dark:from-slate-950 dark:to-slate-900">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Target className="h-32 w-32" />
      </div>
      <CardHeader>
        <CardTitle className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Total Company Target
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-sm">
              {target ? currency(target.target_amount) : <span className="text-slate-600">Not Set</span>}
            </div>
            <p className="text-slate-400 font-medium">Approved ceiling for all divisions and departments.</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Status</span>
            <Badge variant="outline" className={`
              px-4 py-1 text-xs font-bold border-2 transition-colors
              ${target?.status === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                target?.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                'bg-slate-800 text-slate-300 border-slate-700'}
            `}>
              {target?.status || 'NO TARGET'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
