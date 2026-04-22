"use client";

import React, { useState, useEffect } from "react";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, LayoutGrid, ChevronDown, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PivotResult } from "../utils/pivot-utils";

interface PivotTableViewProps {
  pivotData: PivotResult;
  rowLabel: string;
}

export function PivotTableView({ pivotData, rowLabel }: PivotTableViewProps) {
  const { rows, columns, matrix, rowTotals, colTotals, grandTotal } = pivotData;
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    setShowTopShadow(scrollTop > 10);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
  };

  useEffect(() => {
    // Initial check for scrollability
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      setShowBottomShadow(viewport.scrollHeight > viewport.clientHeight);
    }
  }, [pivotData]);

  // Base styling for sticky elements
  const headerStickyBase = "sticky bg-muted/95 backdrop-blur-md z-40 border-b border-r shadow-[inset_0_-1px_0_rgba(0,0,0,0.1),inset_-1px_0_0_rgba(0,0,0,0.1)]";
  const cellStickyBase = "sticky left-0 bg-background/95 backdrop-blur-sm z-30 border-r shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)]";

  return (
    <Card className="rounded-2xl border-none shadow-premium bg-background/50 backdrop-blur-md overflow-hidden relative">
      {/* Scroll Shadows */}
      <div 
        className={cn(
          "absolute top-[52px] left-0 right-0 h-8 z-50 pointer-events-none transition-opacity duration-300 bg-gradient-to-b from-background/20 to-transparent",
          showTopShadow ? "opacity-100" : "opacity-0"
        )} 
      />
      <div 
        className={cn(
          "absolute bottom-[44px] left-0 right-0 h-12 z-50 pointer-events-none transition-opacity duration-300 bg-gradient-to-t from-background/40 to-transparent",
          showBottomShadow ? "opacity-100" : "opacity-0"
        )} 
      />

      <ScrollArea 
        className="h-[75vh] w-full"
        onScrollCapture={handleScroll}
      >
        <table className="w-full caption-bottom text-sm border-separate border-spacing-0 min-w-full">
          <TableHeader className="relative z-50">
            <TableRow className="hover:bg-transparent border-none">
              {/* Top-Left Corner */}
              <TableHead 
                className={cn(
                  headerStickyBase, 
                  "left-0 top-0 z-[60] font-black tracking-tighter text-foreground px-6 py-4"
                )}
              >
                {rowLabel}
              </TableHead>
              
              {/* Column Headers */}
              {columns.map((col) => (
                <TableHead 
                  key={col} 
                  className={cn(
                    headerStickyBase, 
                    "top-0 font-black tracking-tighter text-foreground whitespace-nowrap px-6 py-4 text-center min-w-[150px]"
                  )}
                >
                  {col}
                </TableHead>
              ))}
              
              {/* Row Total Header */}
              <TableHead 
                className={cn(
                  headerStickyBase, 
                  "top-0 font-black tracking-tighter text-primary whitespace-nowrap px-6 py-4 text-center bg-primary/10"
                )}
              >
                Grand Total
              </TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {rows.map((rowKey) => (
              <TableRow key={rowKey} className="group border-none transition-all duration-200 hover:bg-primary/5 even:bg-muted/5">
                <TableCell 
                  className={cn(
                    cellStickyBase,
                    "font-bold text-sm py-4 px-6 group-hover:bg-primary/10 border-b border-muted/10"
                  )}
                >
                  {rowKey}
                </TableCell>
                
                {columns.map((colKey) => {
                  const val = matrix[rowKey][colKey];
                  return (
                    <TableCell 
                      key={`${rowKey}-${colKey}`} 
                      className="text-sm py-4 text-center border-b border-muted/10 whitespace-nowrap px-6"
                    >
                      {val === true ? (
                        <div className="flex justify-center">
                          <div className="p-1 px-2 rounded-lg bg-primary/10 text-primary">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : val !== undefined ? (
                        <span className="font-medium tabular-nums">
                          {typeof val === 'number' ? val.toLocaleString() : val}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/20 italic">-</span>
                      )}
                    </TableCell>
                  );
                })}

                <TableCell className="text-center bg-primary/5 border-b border-primary/5 px-6">
                  <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/10 text-primary font-black tabular-nums">
                    {rowTotals[rowKey]?.toLocaleString() || 0}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}

            {/* Viewport Padding Spacer */}
            <TableRow className="bg-transparent pointer-events-none">
                <TableCell colSpan={columns.length + 2} className="h-20 border-none" />
            </TableRow>

            {/* Footer Row (Sticky Bottom) */}
            <TableRow className="relative z-40 bg-primary/5 font-black shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-none">
              <TableCell 
                className={cn(
                  cellStickyBase,
                  "bottom-0 left-0 bg-primary/15 border-t border-primary/20 py-6 px-6 z-50 shadow-[0_-1px_0_rgba(0,0,0,0.1)]"
                )}
                style={{ position: 'sticky', bottom: 0, left: 0 }}
              >
                GRAND TOTAL
              </TableCell>
              
              {columns.map((colKey) => (
                <TableCell 
                  key={`total-${colKey}`} 
                  className="text-center py-6 text-primary tabular-nums border-t border-primary/20 bg-primary/5 sticky bottom-0 z-40"
                >
                  {colTotals[colKey]?.toLocaleString() || 0}
                </TableCell>
              ))}
              
              <TableCell 
                className="text-center py-6 bg-primary text-primary-foreground font-black text-lg tabular-nums sticky bottom-0 right-0 z-50 border-t border-primary/20"
              >
                {grandTotal.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </table>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <div className="flex items-center justify-between bg-muted/20 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-t border-muted/10 relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-primary">
            <LayoutGrid className="w-3.5 h-3.5" />
            {rows.length} Rows Matrix
          </div>
          <span className="opacity-20">|</span>
          <div className="flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" />
             Pan to View All
          </div>
        </div>
        <div className="flex items-center gap-2">
            {showBottomShadow && (
                <div className="flex items-center gap-1.5 animate-pulse text-primary/60">
                    <ChevronDown className="w-3.5 h-3.5" />
                    More Data Below
                </div>
            )}
        </div>
      </div>
    </Card>
  );
}
