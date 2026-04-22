"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Database, MousePointer2, ChevronDown, CheckCircle2 } from "lucide-react";

interface DynamicTableProps {
  data: any[];
}

export function DynamicTable({ data }: DynamicTableProps) {
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
        <Database className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-lg font-bold tracking-tighter">No data available</p>
        <p className="text-sm">Select a report or check the API endpoint.</p>
      </div>
    );
  }

  // Discover columns from the first object
  const columns = Object.keys(data[0]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    setShowTopShadow(scrollTop > 10);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
  };

  // Initial check for bottom shadow
  useEffect(() => {
    if (viewportRef.current) {
        const { scrollHeight, clientHeight } = viewportRef.current;
        setShowBottomShadow(scrollHeight > clientHeight);
    }
  }, [data]);

  const formatHeader = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .split(/_|-|\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const headerStickyBase = "sticky top-0 bg-muted/95 backdrop-blur-md z-40 border-b border-r shadow-[inset_0_-1px_0_rgba(0,0,0,0.1),inset_-1px_0_0_rgba(0,0,0,0.1)]";
  const cellStickyBase = "sticky left-0 bg-background/95 backdrop-blur-sm z-30 border-r shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)]";

  return (
    <Card className="rounded-2xl border-none shadow-premium bg-background/50 backdrop-blur-md overflow-hidden relative">
      {/* Dynamic Scroll Shadows */}
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
        onScrollCapture={handleScroll} // Use capture to ensure we get events from the viewport
      >
        <table className="w-full caption-bottom text-sm border-separate border-spacing-0 min-w-full">
          <TableHeader className="relative z-50">
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((col, index) => (
                <TableHead 
                  key={col} 
                  className={cn(
                    headerStickyBase,
                    "font-black tracking-tighter text-foreground whitespace-nowrap py-4 px-6",
                    index === 0 && "left-0 z-[60]"
                  )}
                  style={index === 0 ? { position: 'sticky', left: 0, top: 0, zIndex: 60 } : {}}
                >
                  {formatHeader(col)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex} 
                className="group border-none transition-all duration-200 hover:bg-primary/5 even:bg-muted/5"
              >
                {columns.map((col, colIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${col}`} 
                    className={cn(
                      "text-sm py-4 px-6 border-b border-muted/10 transition-colors",
                      colIndex === 0 && cellStickyBase + " group-hover:bg-primary/10"
                    )}
                  >
                    {formatValue(row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            
            {/* Viewport Bottom Padding to avoid "bitin" feeling */}
            <TableRow className="bg-transparent pointer-events-none">
                <TableCell colSpan={columns.length} className="h-20 border-none" />
            </TableRow>
          </TableBody>
          
          {/* Summary Footer for Raw Table */}
          <tfoot className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-sm border-t border-muted/20 shadow-[0_-1px_0_rgba(0,0,0,0.1)]">
            <TableRow className="hover:bg-transparent border-none">
               <TableCell className="py-4 px-6 font-black tracking-tighter text-xs uppercase text-muted-foreground sticky left-0 bg-background/95 border-r border-t border-muted/10 z-50">
                  Data Summary
               </TableCell>
               <TableCell colSpan={columns.length - 1} className="py-4 px-6 border-t border-muted/10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-primary">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Records: {data.length}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        End of Dataset reached
                    </div>
                  </div>
               </TableCell>
            </TableRow>
          </tfoot>
        </table>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
      
      {/* Global Status Bar */}
      <div className="flex items-center justify-between bg-muted/20 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t border-muted/10 relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-primary">
            <Database className="w-3 h-3" />
            Live Analytics
          </div>
          <span className="opacity-20">|</span>
          <div className="flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" />
             Hold Shift to Scroll
          </div>
        </div>
        <div className="flex items-center gap-2">
            {showBottomShadow && (
                <div className="flex items-center gap-1 animate-bounce text-primary/60">
                    <ChevronDown className="w-3 h-3" />
                    Scroll for more
                </div>
            )}
        </div>
      </div>
    </Card>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
