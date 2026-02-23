"use client";

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StockOutRiskAlertProps {
  criticalCount: number;
}

export function StockOutRiskAlert({ criticalCount }: StockOutRiskAlertProps) {
  const hasRisk = criticalCount > 0;

  if (!hasRisk) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
        <div className="bg-emerald-100 p-3 rounded-full">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-emerald-900">All Clear!</h3>
          <p className="text-sm text-emerald-700">No stock-out risks detected. All inventory levels are healthy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-red-500 p-2 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-900 uppercase">ACTION REQUIRED: Stock-Out Risk Alert</h3>
          <p className="text-xs text-red-700 leading-tight">
            Items with ≤15 days of stock remaining (based on 30-day trailing ADS)
          </p>
        </div>
      </div>
      
      <Button variant="destructive" className="h-9 px-4 rounded-lg font-bold">
        {criticalCount} Critical Items
      </Button>
    </div>
  );
}
