import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsProps {
  metrics: {
    po: number;
    si: number;
    remittance: number;
    variancePoVsSi: number;
    varianceSiVsRemittance: number;
    totalVariance: number;
  };
}

export function Charts({ metrics }: ChartsProps) {
  const chartData = [
    {
      name: 'Totals',
      PO: metrics.po,
      SI: metrics.si,
      Remittance: metrics.remittance,
    }
  ];

  const varianceData = [
    { name: 'PO vs SI', variance: metrics.variancePoVsSi, fill: '#f59e0b' },
    { name: 'SI vs Remittance', variance: metrics.varianceSiVsRemittance, fill: '#f43f5e' },
    { name: 'Total Variance', variance: metrics.totalVariance, fill: '#6366f1' }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col min-h-[400px]">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Volume Comparison</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-sm text-muted-foreground" />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={(value: number) => `₱ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend />
              <Bar dataKey="PO" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SI" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Remittance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col min-h-[400px]">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Variance Analysis</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={varianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-sm text-muted-foreground" />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={(value: number) => `₱ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Bar dataKey="variance" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
