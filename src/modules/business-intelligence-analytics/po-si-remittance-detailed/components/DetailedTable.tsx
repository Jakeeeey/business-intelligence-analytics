import React from 'react';
import { DetailedMetricRow, DetailedMetricsSummary } from '../types';

interface DetailedTableProps {
  rows: DetailedMetricRow[];
  summary?: DetailedMetricsSummary;
}

export function DetailedTable({ rows, summary }: DetailedTableProps) {
  const formatCurrency = (val: number) => {
    // Some browsers add a space after ₱, some don't. We replace the space to match the design.
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val).replace('₱ ', '₱');
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-card text-card-foreground shadow-sm mt-6">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
          <tr>
            <th className="px-6 py-4 font-medium">Supplier</th>
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 font-medium text-right">SO/PO</th>
            <th className="px-6 py-4 font-medium text-right">PDP</th>
            <th className="px-6 py-4 font-medium text-right">CLDTO</th>
            <th className="px-6 py-4 font-medium text-right">DP</th>
            <th className="px-6 py-4 font-medium text-right">REMITTED</th>
            <th className="px-6 py-4 font-medium text-right">UNF</th>
            <th className="px-6 py-4 font-medium text-right">RETURN</th>
            <th className="px-6 py-4 font-medium text-right">SHORTAGE</th>
            <th className="px-6 py-4 font-medium text-right">VARIANCE</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">
                No data available for the selected filters.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 truncate max-w-[200px]" title={row.supplierName}>
                  {row.supplierName}
                </td>
                <td className="px-6 py-4">{row.date}</td>
                <td className="px-6 py-4 font-medium text-right">{formatCurrency(row.poAmount)}</td>
                <td className="px-6 py-4 font-medium text-right">{formatCurrency(row.customerPoAmount)}</td>
                <td className="px-6 py-4 font-medium text-right">{formatCurrency(row.allocatedAmount)}</td>
                <td className="px-6 py-4 font-medium text-right">{formatCurrency(row.siAmount)}</td>
                <td className="px-6 py-4 font-medium text-right">{formatCurrency(row.remittanceAmount)}</td>
                <td className="px-6 py-4 font-medium text-right text-[#f43f5e]">{formatCurrency(row.unfulfilledAmount)}</td>
                <td className="px-6 py-4 font-medium text-right text-[#f43f5e]">{formatCurrency(row.returnAmount)}</td>
                <td className="px-6 py-4 font-medium text-right text-[#e11d48]">{formatCurrency(row.shortage)}</td>
                <td className="px-6 py-4 font-medium text-right text-[#f59e0b]">{formatCurrency(row.variance)}</td>
              </tr>
            ))
          )}
        </tbody>
        {summary && rows.length > 0 && (
          <tfoot className="bg-muted/20 font-bold border-t">
            <tr>
              <td className="px-6 py-4" colSpan={2}>TOTALS</td>
              <td className="px-6 py-4 text-right">{formatCurrency(summary.totalPoAmount)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(summary.totalCustomerPoAmount)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(summary.totalAllocatedAmount)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(summary.totalSiAmount)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(summary.totalRemittanceAmount)}</td>
              <td className="px-6 py-4 text-right text-[#f43f5e]">{formatCurrency(summary.totalUnfulfilledAmount)}</td>
              <td className="px-6 py-4 text-right text-[#f43f5e]">{formatCurrency(summary.totalReturnAmount)}</td>
              <td className="px-6 py-4 text-right text-[#e11d48]">{formatCurrency(summary.totalShortage)}</td>
              <td className="px-6 py-4 text-right text-[#f59e0b]">{formatCurrency(summary.totalVariance)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
