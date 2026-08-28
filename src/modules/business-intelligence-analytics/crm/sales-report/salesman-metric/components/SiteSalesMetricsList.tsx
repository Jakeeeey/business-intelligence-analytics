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
      <div className="divide-y divide-border/60">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-card grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center animate-pulse border-l-4 border-transparent">
            {/* Salesman Info */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            {/* Core Metrics List */}
            <div className="col-span-1 md:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
            {/* Expander Toggle */}
            <div className="col-span-1 md:col-span-1 flex justify-end">
              <div className="h-8 w-20 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground/60 text-sm font-medium">
        No records found matching your filters.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
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
