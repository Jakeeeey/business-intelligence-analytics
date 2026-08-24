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
      <div className="p-8 text-center text-muted-foreground/60 text-sm font-medium animate-pulse">
        Loading metrics...
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
