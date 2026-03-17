"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line } from "recharts";
import { LayoutDashboard, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TargetApprovalChartsProps {
  allocations: { division_name?: string; division_id: number; target_amount: number }[];
  historicalTargets: { fiscal_period: string; target_amount: number }[];
  isLoading?: boolean;
}

export function TargetApprovalCharts({
  allocations,
  historicalTargets,
  isLoading
}: TargetApprovalChartsProps) {
  const formatPHP = (val: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  // Process data for Division Allocation Bar Chart
  const divisionData = allocations
    .map(a => ({
      name: a.division_name || `Div #${a.division_id}`,
      amount: Number(a.target_amount) || 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Process data for Trend Line Chart
  const trendData = historicalTargets
    .map(t => ({
      period: format(parseISO(String(t.fiscal_period)), "MMM yyyy"),
      amount: Number(t.target_amount) || 0
    }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
        <Card className="animate-pulse bg-slate-50 dark:bg-slate-900/40" />
        <Card className="animate-pulse bg-slate-50 dark:bg-slate-900/40" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Allocation Breakdown */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-bold tracking-tight">Allocation by Division</CardTitle>
            <CardDescription className="text-[10px]">Division target distribution</CardDescription>
          </div>
          <LayoutDashboard className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="h-[250px] pt-4">
          {divisionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionData} layout="vertical" margin={{ left: 0, right: 40, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  fontSize={10} 
                  tick={{ fill: 'currentColor', opacity: 0.7 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(v: number) => [formatPHP(v), "Target"]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {divisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              No allocations found for this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Trend */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-bold tracking-tight">Company Target Trend</CardTitle>
            <CardDescription className="text-[10px]">Last 6 months progression</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="h-[250px] pt-4">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis 
                  dataKey="period" 
                  fontSize={10} 
                  tick={{ fill: 'currentColor', opacity: 0.7 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(v: number) => [formatPHP(v), "Target"]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              Historical data not available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
