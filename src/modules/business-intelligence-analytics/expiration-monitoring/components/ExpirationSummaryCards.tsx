"use client";

import * as React from "react";
import { ExpirationRecord } from "../types";
import { AlertTriangle, PackageOpen, CircleDollarSign } from "lucide-react";

interface ExpirationSummaryCardsProps {
  data: ExpirationRecord[];
}

export function ExpirationSummaryCards({ data }: ExpirationSummaryCardsProps) {
  const stats = React.useMemo(() => {
    let totalQuantity = 0;
    let totalCost = 0;
    let expiredCount = 0;
    let criticalCount = 0; // < 3 months
    let warningCount = 0;  // < 6 months

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    data.forEach((item) => {
      totalQuantity += item.receivedQuantity || 0;
      totalCost += item.itemTotalCost || 0;

      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        if (!isNaN(expiry.getTime())) {
          if (expiry < today) {
            expiredCount++;
          } else if (expiry <= threeMonthsFromNow) {
            criticalCount++;
          } else if (expiry <= sixMonthsFromNow) {
            warningCount++;
          }
        }
      }
    });

    return { totalQuantity, totalCost, expiredCount, criticalCount, warningCount };
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Expired */}
      <div className="bg-rose-600/10 border border-rose-600/20 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group h-[140px]">
        <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
          <AlertTriangle size={100} className="text-rose-600" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black tracking-widest text-rose-600 dark:text-rose-500 uppercase">Expired</p>
          <p className="text-4xl font-black text-rose-700 dark:text-rose-600">
            {stats.expiredCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-rose-600/70 uppercase font-bold tracking-wider leading-tight">Products past expiration</p>
        </div>
      </div>

      {/* Critical */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group h-[140px]">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
          <AlertTriangle size={100} className="text-red-500" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black tracking-widest text-red-500 uppercase">&lt; 3 Months</p>
          <p className="text-4xl font-black text-red-500">
            {stats.criticalCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-red-500/70 uppercase font-bold tracking-wider leading-tight">Critical expiration risk</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group h-[140px]">
        <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
          <AlertTriangle size={100} className="text-orange-500" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black tracking-widest text-orange-500 uppercase">&lt; 6 Months</p>
          <p className="text-4xl font-black text-orange-500">
            {stats.warningCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-orange-500/70 uppercase font-bold tracking-wider leading-tight">Products nearing expiration</p>
        </div>
      </div>

      {/* Total Quantity */}
      <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group h-[140px]">
        <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500">
          <PackageOpen size={100} className="text-foreground" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Total Quantity</p>
          <p className="text-4xl font-black text-foreground">
            {stats.totalQuantity.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase leading-tight">Units in inventory</p>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden group h-[140px]">
        <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500">
          <CircleDollarSign size={100} className="text-foreground" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Total Cost</p>
          <p className="text-3xl font-black text-foreground">
            ₱{stats.totalCost > 1000000 ? (stats.totalCost / 1000000).toFixed(1) + 'M' : stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase leading-tight">Value of tracked products</p>
        </div>
      </div>
    </div>
  );
}
