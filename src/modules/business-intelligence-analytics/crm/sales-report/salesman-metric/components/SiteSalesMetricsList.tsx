import React from "react";
import { MetricRow } from "../types";
import { SiteSalesRow } from "./SiteSalesRow";

interface SiteSalesMetricsListProps {
  rows: MetricRow[];
  loading: boolean;
  onViewSupplierBreakdown?: (salesmanId: number, salesmanName: string) => void;
  onViewReachBreakdown?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewFrequencyDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewNewAccountsDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
  onViewProductiveOutletDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewLineSalesDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewBasketCountDetail?: (salesmanId: number, salesmanName: string) => void;
  onViewTacticalSkuDetail?: (salesmanId: number, salesmanName: string) => void;
}

export function SiteSalesMetricsList({
  rows,
  loading,
  onViewSupplierBreakdown,
  onViewReachBreakdown,
  onViewFrequencyDetail,
  onViewNewAccountsDetail,
  onViewProductiveOutletDetail,
  onViewLineSalesDetail,
  onViewBasketCountDetail,
  onViewTacticalSkuDetail,
}: SiteSalesMetricsListProps) {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="group relative p-4 rounded-2xl border border-border/40 bg-muted/5 overflow-hidden animate-pulse">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-muted rounded w-16"></div>
                    <div className="h-5 bg-muted rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
        No records found matching your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {rows.map((row) => (
        <SiteSalesRow
          key={row.salesmanId}
          row={row}
          onViewSupplierBreakdown={onViewSupplierBreakdown}
          onViewReachBreakdown={onViewReachBreakdown}
          onViewFrequencyDetail={onViewFrequencyDetail}
          onViewNewAccountsDetail={onViewNewAccountsDetail}
          onViewProductiveOutletDetail={onViewProductiveOutletDetail}
          onViewLineSalesDetail={onViewLineSalesDetail}
          onViewBasketCountDetail={onViewBasketCountDetail}
          onViewTacticalSkuDetail={onViewTacticalSkuDetail}
        />
      ))}
    </div>
  );
}
