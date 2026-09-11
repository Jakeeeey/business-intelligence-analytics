import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DetailedMetricsSummary } from '../types';

interface ChartsProps {
  summary?: DetailedMetricsSummary;
}

export function Charts({ summary }: ChartsProps) {
  if (!summary) return null;

  const volumeData = [
    { name: 'SO/PO', value: summary.totalPoAmount, fill: '#3b82f6' },
    { name: 'PDP', value: summary.totalCustomerPoAmount, fill: '#8b5cf6' },
    { name: 'CLDTO', value: summary.totalAllocatedAmount, fill: '#14b8a6' },
    { name: 'DP', value: summary.totalSiAmount, fill: '#10b981' },
    { name: 'Remitted', value: summary.totalRemittanceAmount, fill: '#f59e0b' },
  ];

  const discrepancyData = [
    { name: 'Unfulfilled', value: summary.totalUnfulfilledAmount, fill: '#f43f5e' },
    { name: 'Return', value: summary.totalReturnAmount, fill: '#e11d48' },
    { name: 'Shortage', value: summary.totalShortage, fill: '#ef4444' },
    { name: 'Variance', value: summary.totalVariance, fill: '#d946ef' },
  ];

  const formatTooltip = (value: number) => `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col min-h-[400px]">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Volume Comparison</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-sm text-muted-foreground" />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={formatTooltip}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {volumeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col min-h-[400px]">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Discrepancies Analysis</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={discrepancyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-sm text-muted-foreground" />
              <YAxis className="text-sm text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={formatTooltip}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {discrepancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
