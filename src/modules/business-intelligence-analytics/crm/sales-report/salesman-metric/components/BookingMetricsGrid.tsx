import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { MetricRow } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BookingMetricsGridProps {
  rows: MetricRow[];
  loading: boolean;
  onViewSupplierBreakdown?: (salesmanId: number, salesmanName: string) => void;
  onViewFrequencyDetail?: (salesmanId: number, salesmanCode: string, salesmanName: string) => void;
}
export function BookingMetricsGrid({
  rows,
  loading,
  onViewSupplierBreakdown,
  onViewFrequencyDetail,
}: BookingMetricsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  type SortKey = 'salesmanName' | 'overallAch' | 'targetSales' | 'salesPerformance' | 'salesAchievement' | 'targetFrequency' | 'frequencyAmount' | 'frequencyAchievement';
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const sortedRows = React.useMemo(() => {
    const sortableItems = [...rows];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: number | string = a[sortConfig.key as keyof typeof a] as number | string;
        let bValue: number | string = b[sortConfig.key as keyof typeof b] as number | string;

        if (sortConfig.key === 'overallAch') {
          aValue = ((a.salesAchievement || 0) + (a.frequencyAchievement || 0)) / 2;
          bValue = ((b.salesAchievement || 0) + (b.frequencyAchievement || 0)) / 2;
        } else if (sortConfig.key === 'salesAchievement') {
          aValue = a.salesAchievement || 0;
          bValue = b.salesAchievement || 0;
        } else if (sortConfig.key === 'frequencyAchievement') {
          aValue = a.frequencyAchievement || 0;
          bValue = b.frequencyAchievement || 0;
        } else if (sortConfig.key === 'targetSales') {
          aValue = a.targetSales || 0;
          bValue = b.targetSales || 0;
        } else if (sortConfig.key === 'targetFrequency') {
          aValue = a.targetFrequency || 0;
          bValue = b.targetFrequency || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [rows, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc'; // Default to desc for metrics
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1 opacity-70" /> : <ChevronDown className="h-3 w-3 inline ml-1 opacity-70" />;
  };

  return (
    <Card className="shadow-2xl border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden flex flex-col">
      <CardHeader className="border-b border-border/40 bg-muted/10 py-4 px-6">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black uppercase tracking-tight italic">Booking <span className="text-primary">Metrics</span></CardTitle>
            <div className="p-2 bg-background rounded-xl border border-border/40 shadow-sm">
                <Store className="h-4 w-4 text-primary opacity-80" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <div className="h-10 bg-muted/30 rounded animate-pulse mb-4" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-muted/20 rounded animate-pulse mb-2" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-bold uppercase tracking-widest text-xs">
            No records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-b border-border/40 hover:bg-transparent">
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 pl-6 w-[20%] cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('salesmanName')}
                  >
                    Salesman {renderSortIcon('salesmanName')}
                  </TableHead>
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-center w-[10%] border-r border-border/20 cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('overallAch')}
                  >
                    Overall<br/>Ach % {renderSortIcon('overallAch')}
                  </TableHead>
                  
                  {/* Sales Group */}
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-right pr-4 w-[11%] cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('targetSales')}
                  >
                    Sales Target {renderSortIcon('targetSales')}
                  </TableHead>
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-right pr-4 w-[13%] cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('salesPerformance')}
                  >
                    Sales Actual {renderSortIcon('salesPerformance')}
                  </TableHead>
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-right pr-8 w-[10%] border-r border-border/20 cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('salesAchievement')}
                  >
                    Ach % {renderSortIcon('salesAchievement')}
                  </TableHead>
                  
                  {/* Frequency Group */}
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-right pr-4 pl-8 w-[11%] cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('targetFrequency')}
                  >
                    Freq Target {renderSortIcon('targetFrequency')}
                  </TableHead>
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 text-right pr-4 w-[13%] cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('frequencyAmount')}
                  >
                    Freq Actual {renderSortIcon('frequencyAmount')}
                  </TableHead>
                  <TableHead 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 h-10 pr-6 w-[10%] text-right cursor-pointer select-none hover:text-foreground/80 transition-colors"
                    onClick={() => requestSort('frequencyAchievement')}
                  >
                    Ach % {renderSortIcon('frequencyAchievement')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => {
                  const sAch = row.salesAchievement || 0;
                  const fAch = row.frequencyAchievement || 0;
                  const overallAch = (sAch + fAch) / 2;
                  
                  return (
                    <TableRow
                      key={row.salesmanId}
                      className="border-b border-border/20 hover:bg-primary/5 transition-colors group/row"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <div className="font-black text-[13px] uppercase tracking-wider text-foreground leading-none">{row.salesmanName}</div>
                          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic mt-1">{row.salesmanCode}</div>
                        </div>
                      </TableCell>

                      {/* Overall Achievement */}
                      <TableCell className="py-4 text-center border-r border-border/20">
                        <div className={`text-[13px] font-black italic ${overallAch >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {overallAch.toFixed(1)}%
                        </div>
                      </TableCell>

                      {/* Sales Group */}
                      <TableCell className="py-4 text-right pr-4">
                        <div className="text-[13px] font-bold text-muted-foreground/80 italic">
                          {formatCurrency(row.targetSales || 0)}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 text-right pr-4">
                        <div 
                          className="flex items-center justify-end gap-2 cursor-pointer group/stat w-full"
                          onClick={() => onViewSupplierBreakdown?.(row.salesmanId, row.salesmanName)}
                        >
                          <Eye className="h-3 w-3 opacity-0 group-hover/stat:opacity-100 text-blue-500 transition-opacity" />
                          <span className="text-[15px] font-black italic text-blue-500 dark:text-blue-400 leading-none group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-300 transition-colors">
                            {formatCurrency(row.salesPerformance)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 text-right pr-8 border-r border-border/20">
                        <div className={`text-[12px] font-black italic ${sAch >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {sAch.toFixed(1)}%
                        </div>
                      </TableCell>

                      {/* Frequency Group */}
                      <TableCell className="py-4 text-right pr-4 pl-8">
                        <div className="text-[13px] font-bold text-muted-foreground/80 italic">
                          {row.targetFrequency || 0} <span className="text-[10px]">txns</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 text-right pr-4">
                        <div 
                          className="flex flex-col items-end cursor-pointer group/stat w-full"
                          onClick={() => onViewFrequencyDetail?.(row.salesmanId, row.salesmanCode || "", row.salesmanName)}
                        >
                          <div className="flex items-center gap-2 justify-end">
                              <Eye className="h-3 w-3 opacity-0 group-hover/stat:opacity-100 text-emerald-500 transition-opacity" />
                              <span className="text-[15px] font-black italic text-emerald-500 dark:text-emerald-400 leading-none group-hover/stat:text-emerald-600 dark:group-hover/stat:text-emerald-300 transition-colors">
                                {formatCurrency(row.frequencyAmount)}
                              </span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground italic mt-0.5">{row.frequencyCount} txns</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 pr-6 text-right">
                        <div className={`text-[12px] font-black italic ${fAch >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {fAch.toFixed(1)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
