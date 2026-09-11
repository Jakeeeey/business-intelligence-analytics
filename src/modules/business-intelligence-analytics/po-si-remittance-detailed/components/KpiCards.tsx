'use client';

import React, { useState } from 'react';
import { DetailedMetricsSummary } from '../types';

interface KpiCardsProps {
  summary?: DetailedMetricsSummary;
}

type CardKey = 'so' | 'pdp' | 'cldto' | 'dp' | 'remitted' | 'unf' | 'return' | 'shortage' | 'variance' | null;

export function KpiCards({ summary }: KpiCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<CardKey>(null);

  if (!summary) return null;

  const metrics = {
    so: summary.totalPoAmount,
    pdp: summary.totalCustomerPoAmount,
    cldto: summary.totalAllocatedAmount,
    dp: summary.totalSiAmount,
    remitted: summary.totalRemittanceAmount,
    unf: summary.totalUnfulfilledAmount,
    returnAmount: summary.totalReturnAmount,
    shortage: summary.totalShortage,
    variance: summary.totalVariance,
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val).replace('₱ ', '₱');
  };

  const getActiveCards = (hovered: CardKey): CardKey[] => {
    switch (hovered) {
      case 'so': return ['so', 'variance'];
      case 'pdp': return ['pdp'];
      case 'cldto': return ['cldto'];
      case 'dp': return ['dp', 'shortage'];
      case 'remitted': return ['remitted', 'variance', 'shortage'];
      case 'unf': return ['unf', 'shortage'];
      case 'return': return ['return', 'shortage'];
      case 'shortage': return ['shortage', 'dp', 'remitted', 'unf', 'return'];
      case 'variance': return ['variance', 'so', 'remitted'];
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
      return `${baseClass} opacity-40 grayscale-[30%] blur-[1px]`;
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mt-6">
      <div 
        className={`bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-l-4 border-l-blue-500 ${getCardClass('so')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-blue-800 dark:text-blue-300">SO</h3>
        <p title={formatCurrency(metrics.so)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-blue-950 dark:text-blue-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.so)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-l-4 border-l-cyan-500 ${getCardClass('pdp')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-cyan-800 dark:text-cyan-300">PDP</h3>
        <p title={formatCurrency(metrics.pdp)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-cyan-950 dark:text-cyan-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.pdp)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10 border-l-4 border-l-teal-500 ${getCardClass('cldto')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-teal-800 dark:text-teal-300">CLDTO</h3>
        <p title={formatCurrency(metrics.cldto)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-teal-950 dark:text-teal-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.cldto)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-lime-50 to-lime-100/50 dark:from-lime-950/20 dark:to-lime-900/10 border-l-4 border-l-lime-500 ${getCardClass('dp')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-lime-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-lime-800 dark:text-lime-300">DP</h3>
        <p title={formatCurrency(metrics.dp)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-lime-950 dark:text-lime-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.dp)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10 border-l-4 border-l-violet-500 ${getCardClass('remitted')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-violet-800 dark:text-violet-300">REMITTED</h3>
        <p title={formatCurrency(metrics.remitted)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-violet-950 dark:text-violet-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.remitted)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-l-4 border-l-orange-500 ${getCardClass('unf')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-orange-800 dark:text-orange-300">UNF</h3>
        <p title={formatCurrency(metrics.unf)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-orange-950 dark:text-orange-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.unf)}
        </p>
      </div>

      <div 
        className={`bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-l-4 border-l-red-500 ${getCardClass('return')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-red-800 dark:text-red-300">RETURN</h3>
        <p title={formatCurrency(metrics.returnAmount)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-red-950 dark:text-red-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.returnAmount)}
        </p>
      </div>

      <div 
        onMouseEnter={() => setHoveredCard('shortage')}
        onMouseLeave={() => setHoveredCard(null)}
        className={`bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/10 border-l-4 border-l-pink-500 ${getCardClass('shortage')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-pink-800 dark:text-pink-300">SHORTAGE</h3>
        <p title={formatCurrency(metrics.shortage)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-pink-950 dark:text-pink-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.shortage)}
        </p>
      </div>

      <div 
        onMouseEnter={() => setHoveredCard('variance')}
        onMouseLeave={() => setHoveredCard(null)}
        className={`bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border-l-4 border-l-indigo-500 ${getCardClass('variance')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-300 group-hover:scale-150" />
        <h3 className="text-sm font-semibold tracking-tight text-indigo-800 dark:text-indigo-300">VARIANCE</h3>
        <p title={formatCurrency(metrics.variance)} className="text-lg xl:text-base 2xl:text-xl tracking-tighter font-black mt-2 text-indigo-950 dark:text-indigo-100 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatCurrency(metrics.variance)}
        </p>
      </div>
    </div>
  );
}
