'use client';

import React, { useState } from 'react';

interface KpiCardsProps {
  metrics: {
    po: number;
    si: number;
    remittance: number;
    variancePoVsSi: number;
    varianceSiVsRemittance: number;
    variancePoVsRemittance: number;
    totalVariance: number;
  };
}

type CardKey = 'po' | 'si' | 'remittance' | 'variancePoSi' | 'variancePoRemittance' | 'varianceSiRemittance' | 'totalVariance' | null;

export function KpiCards({ metrics }: KpiCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<CardKey>(null);

  const getActiveCards = (hovered: CardKey): CardKey[] => {
    switch (hovered) {
      case 'po': return ['po', 'variancePoSi', 'variancePoRemittance'];
      case 'si': return ['si', 'variancePoSi', 'varianceSiRemittance'];
      case 'remittance': return ['remittance', 'variancePoRemittance', 'varianceSiRemittance'];
      case 'variancePoSi': return ['variancePoSi', 'po', 'si'];
      case 'variancePoRemittance': return ['variancePoRemittance', 'po', 'remittance'];
      case 'varianceSiRemittance': return ['varianceSiRemittance', 'si', 'remittance'];
      case 'totalVariance': return ['totalVariance', 'variancePoSi', 'varianceSiRemittance'];
      default: return [];
    }
  };

  const activeCards = getActiveCards(hoveredCard);
  const isHoveredState = hoveredCard !== null;

  const getCardClass = (card: CardKey) => {
    const baseClass = "rounded-xl border shadow-sm p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-in-out cursor-default";
    
    if (!isHoveredState) return baseClass;
    
    if (activeCards.includes(card)) {
      return `${baseClass} scale-[1.03] shadow-lg ring-1 ring-foreground/20 z-10`;
    } else {
      return `${baseClass} opacity-30 grayscale-[50%] blur-[1px]`;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Totals */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total PO */}
        <div 
          className={`bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-l-4 border-l-blue-500 ${getCardClass('po')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
          <h3 className="text-sm font-semibold tracking-tight text-blue-800 dark:text-blue-300">Total PO</h3>
          <p title={`₱ ${metrics.po.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-blue-950 dark:text-blue-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.po.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        {/* Total SI */}
        <div 
          className={`bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-l-4 border-l-emerald-500 ${getCardClass('si')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">Total SI</h3>
          <p title={`₱ ${metrics.si.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-emerald-950 dark:text-emerald-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.si.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {/* Total Remittance */}
        <div 
          className={`bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-l-4 border-l-violet-500 ${getCardClass('remittance')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-violet-800 dark:text-violet-300">Total Remittance</h3>
          <p title={`₱ ${metrics.remittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-violet-950 dark:text-violet-100 whitespace-nowrap overflow-hidden text-ellipsis">
            ₱ {metrics.remittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total Variance */}
        <div 
          onMouseEnter={() => setHoveredCard('totalVariance')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border-l-4 border-l-indigo-500 ${getCardClass('totalVariance')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-indigo-800 dark:text-indigo-300">Total Variance</h3>
          <p title={`₱ ${metrics.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-indigo-950 dark:text-indigo-100 whitespace-nowrap overflow-hidden text-ellipsis">
            ₱ {metrics.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Bottom Row: Variances */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        {/* PO vs SI Variance */}
        <div 
          onMouseEnter={() => setHoveredCard('variancePoSi')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-l-4 border-l-amber-500 ${getCardClass('variancePoSi')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-amber-800 dark:text-amber-300">PO vs SI Variance</h3>
          <p title={`₱ ${metrics.variancePoVsSi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-amber-950 dark:text-amber-100 whitespace-nowrap overflow-hidden text-ellipsis">₱ {metrics.variancePoVsSi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {/* PO vs Remittance Variance */}
        <div 
          onMouseEnter={() => setHoveredCard('variancePoRemittance')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 dark:from-fuchsia-950/20 dark:to-fuchsia-900/10 border-l-4 border-l-fuchsia-500 ${getCardClass('variancePoRemittance')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-fuchsia-800 dark:text-fuchsia-300">PO vs Remittance Var</h3>
          <p title={`₱ ${metrics.variancePoVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-fuchsia-950 dark:text-fuchsia-100 whitespace-nowrap overflow-hidden text-ellipsis">
            ₱ {metrics.variancePoVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* SI vs Remittance Var */}
        <div 
          onMouseEnter={() => setHoveredCard('varianceSiRemittance')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 border-l-4 border-l-rose-500 ${getCardClass('varianceSiRemittance')}`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full -mr-8 -mt-8" />
          <h3 className="text-sm font-semibold tracking-tight text-rose-800 dark:text-rose-300">SI vs Remittance Var</h3>
          <p title={`₱ ${metrics.varianceSiVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-rose-950 dark:text-rose-100 whitespace-nowrap overflow-hidden text-ellipsis">
            ₱ {metrics.varianceSiVsRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
