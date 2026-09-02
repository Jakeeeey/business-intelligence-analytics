import React from 'react';

interface KpiCardsProps {
  metrics: {
    po: number;
    si: number;
    remittance: number;
    variancePoVsSi: number;
    varianceSiVsRemittance: number;
    totalVariance: number;
  };
}

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {/* Total PO */}
      <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-blue-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-blue-800 dark:text-blue-300">Total PO</h3>
        <p title={`₱ ${metrics.po.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-blue-950 dark:text-blue-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.po.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      
      {/* Total SI */}
      <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">Total SI</h3>
        <p title={`₱ ${metrics.si.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-emerald-950 dark:text-emerald-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.si.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      {/* Total Remittance */}
      <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-violet-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-violet-800 dark:text-violet-300">Total Remittance</h3>
        <p title={`₱ ${metrics.remittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-violet-950 dark:text-violet-100 whitespace-nowrap overflow-hidden text-ellipsis">
          ₱ {metrics.remittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* PO vs SI Variance */}
      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-amber-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-amber-800 dark:text-amber-300">PO vs SI Variance</h3>
        <p title={`₱ ${metrics.variancePoVsSi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-amber-950 dark:text-amber-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.variancePoVsSi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      {/* SI vs Remittance Var */}
      <div className="rounded-xl border bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-rose-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-rose-800 dark:text-rose-300">SI vs Remittance Var</h3>
        <p title={`₱ ${metrics.varianceSiVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-rose-950 dark:text-rose-100 whitespace-nowrap overflow-hidden text-ellipsis">
          ₱ {metrics.varianceSiVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Total Variance */}
      <div className="rounded-xl border bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-indigo-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold tracking-tight text-indigo-800 dark:text-indigo-300">Total Variance</h3>
        <p title={`₱ ${metrics.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-indigo-950 dark:text-indigo-100 whitespace-nowrap overflow-hidden text-ellipsis">
          ₱ {metrics.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
