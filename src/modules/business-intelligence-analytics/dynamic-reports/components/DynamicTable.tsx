"use client";

import React, { useMemo, useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportData } from "../types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  LayoutPanelLeft, 
  GripHorizontal,
  Settings2,
  GripVertical,
  MousePointer2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Plus,
  LayoutGrid,
  RefreshCw,
  Cpu,
  X
} from "lucide-react";
import { FilterOperator, ColumnFilter } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DynamicTableProps {
  data: ReportData[];
  columns: string[];
  activeFilters: ColumnFilter[];
  onAddFilter: (filter: ColumnFilter) => void;
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  visibleColumns: string[];
  onToggleColumn: (col: string) => void;
}

export interface DynamicTableRef {
  exportToExcel: (fileName: string) => void;
}

const formatHeader = (key: string): string => {
  if (!key) return "";
  
  // Handle cases like "PARENTMODULEID" or "SCREAMING_SNAKE_CASE"
  let result = key.replace(/_/g, ' ');

  // Handle camelCase or PascalCase (insert space before capital letters)
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Handle acronyms like "ID" or "URL"
  result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

  // If it's just one long block of caps like "PARENTMODULEID"
  if (!result.includes(' ') && key === key.toUpperCase()) {
    return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  }

  // Final pass: Capitalize first letter of each word
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const DynamicTable = forwardRef<DynamicTableRef, DynamicTableProps>(({ 
  data = [], 
  columns, 
  activeFilters, 
  onAddFilter, 
  onRemoveFilter, 
  onClearAll,
  visibleColumns,
  onToggleColumn
}, ref) => {
  const [newFilter, setNewFilter] = useState<Partial<ColumnFilter>>({
    column: "",
    operator: "contains",
    value: "",
  });

  const handleAddFilter = () => {
    if (newFilter.column && newFilter.operator && newFilter.value) {
      onAddFilter({
        id: Math.random().toString(36).substr(2, 9),
        column: newFilter.column,
        operator: newFilter.operator as FilterOperator,
        value: newFilter.value,
      });
      setNewFilter({ column: "", operator: "contains", value: "" });
    }
  };
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  
  // UX State: Settings
  const [resizingGuideX, setResizingGuideX] = useState<number | null>(null);
  const [isHittingBoundary, setIsHittingBoundary] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | 'none' }>({ 
    key: '', 
    direction: 'none' 
  });

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT LOGIC (Exposed to parent)
  // ═══════════════════════════════════════════════════════════════════
  useImperativeHandle(ref, () => ({
    exportToExcel: (fileName: string) => {
      import("../utils/export-styled-utils").then(mod => {
        mod.exportStyledRawToExcel(sortedData, activeColumns, fileName);
      });
    }
  }));

  // Auto-fit Logic: Calculate width based on content
  const autoFitColumn = useCallback((field: string) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = "bold 11px JetBrains Mono, monospace"; 
    
    let maxWidth = 100; 
    data.forEach(row => {
      const text = String(row[field] ?? "");
      const metrics = context.measureText(text);
      maxWidth = Math.max(maxWidth, metrics.width + 48); 
    });
    
    setColumnWidths(prev => ({ ...prev, [field]: Math.min(600, maxWidth) }));
  }, [data]);
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingColumn = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ col: string; side: 'left' | 'right' } | null>(null);

  // Initialize widths
  useEffect(() => {
    if (columns.length > 0) {
      setColumnWidths(prev => {
        const next = { ...prev };
        columns.forEach(col => { if (!next[col]) next[col] = 200; });
        return next;
      });
    }
  }, [columns]);

  const activeColumns = useMemo(() => 
    columns.filter(col => visibleColumns.includes(col)), 
  [columns, visibleColumns]);

  // Sorting Logic
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key, direction: 'none' };
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (sortConfig.direction === 'none') return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Numeric Sort
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String Sort (Case-insensitive)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      return sortConfig.direction === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }, [data, sortConfig]);

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedColumn(col);
    e.dataTransfer.setData("text/plain", col);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetCol) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDropIndicator({ col: targetCol, side: x < rect.width / 2 ? 'left' : 'right' });
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetCol) return;
    // Note: Reordering is handled via visibleColumns in the parent now if we want it to persist,
    // but for now we keep it simple or implement it via onReorderColumn if needed.
    setDropIndicator(null);
    setDraggedColumn(null);
  };

  const startResizing = (field: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizingColumn.current = { field, startX: e.pageX, startWidth: columnWidths[field] || 200 };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn.current) return;
    const { field, startX, startWidth } = resizingColumn.current;
    const newWidth = startWidth + (e.pageX - startX);
    
    // Haptic Logic: Hit Boundary
    if (newWidth <= 80 || newWidth >= 800) {
      setIsHittingBoundary(true);
    } else {
      setIsHittingBoundary(false);
    }

    setColumnWidths(prev => ({ ...prev, [field]: Math.max(80, Math.min(800, newWidth)) }));
    
    // Update guide line position
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setResizingGuideX(e.clientX - containerRect.left);
    }
  }, []);

  const stopResizing = useCallback(() => {
    resizingColumn.current = null;
    setResizingGuideX(null);
    setIsHittingBoundary(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  useEffect(() => {
    if (bodyRef.current) setScrollbarWidth(bodyRef.current.offsetWidth - bodyRef.current.clientWidth);
  }, [data, visibleColumns, columnWidths]);

  const handleScroll = useCallback(() => {
    if (bodyRef.current && headerRef.current) headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
  }, []);

  const TOTAL_WIDTH = activeColumns.reduce((acc, col) => acc + (columnWidths[col] || 200), 0);

  const ColGroup = () => (
    <colgroup>
      {activeColumns.map((col) => (
        <col key={col} style={{ width: columnWidths[col] || 200, minWidth: columnWidths[col] || 200 }} />
      ))}
    </colgroup>
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border/50">
        No Data Records Found
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex-1 flex flex-col min-h-0 bg-background font-mono leading-none overflow-hidden border border-border shadow-sm rounded-md mx-4 mb-4 select-none transition-all duration-300 text-[11px]",
        isHittingBoundary && "animate-shake"
      )}
    >
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
        .animate-shake {
          animation: shake 0.1s ease-in-out infinite;
        }
      `}</style>

      {/* 1. TOP RIBBON */}
      <div className="shrink-0 h-10 flex items-center px-2 bg-muted/20 border-b border-border/50 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter gap-2 bg-background border-border/50 hover:border-primary/50 transition-all">
              <LayoutPanelLeft className="w-3.5 h-3.5 text-primary" />
              Layout <Badge count={visibleColumns.length} total={columns.length} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 rounded-2xl border-border shadow-premium z-[400]" align="start">
            <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Column Controls</span>
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {columns.map(col => (
                <div key={col} className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 rounded-xl cursor-pointer group transition-colors" onClick={() => onToggleColumn(col)}>
                  <Checkbox checked={visibleColumns.includes(col)} className="h-4 w-4 rounded-md pointer-events-none" />
                  <span className={cn("text-[11px] font-bold truncate flex-1 transition-all", !visibleColumns.includes(col) && "text-muted-foreground/40")}>{formatHeader(col)}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-7 px-3 text-[10px] font-black uppercase tracking-tighter gap-2 bg-background border-border/50 hover:border-primary/50 transition-all",
                activeFilters.length > 0 && "border-primary/30 bg-primary/5"
              )}
            >
              <Filter className={cn("w-3.5 h-3.5", activeFilters.length > 0 ? "text-primary" : "text-muted-foreground/40")} />
              Filter {activeFilters.length > 0 && <Badge count={activeFilters.length} total={0} hideTotal />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 rounded-2xl border-border shadow-premium p-3 bg-popover z-[400]" align="start">
            <div className="space-y-3 font-mono">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Filter</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Select
                    value={newFilter.column}
                    onValueChange={(val) => setNewFilter({ ...newFilter, column: val })}
                  >
                    <SelectTrigger className="rounded-lg h-9 text-[11px] border-border bg-muted/30">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border z-[500]">
                      {columns.map((col) => (
                        <SelectItem key={col} value={col} className="text-[11px]">{formatHeader(col)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={newFilter.operator}
                    onValueChange={(val: FilterOperator) => setNewFilter({ ...newFilter, operator: val })}
                  >
                    <SelectTrigger className="rounded-lg h-9 text-[11px] border-border bg-muted/30">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border z-[500]">
                      <SelectItem value="equals" className="text-[11px]">Equals</SelectItem>
                      <SelectItem value="contains" className="text-[11px]">Contains</SelectItem>
                      <SelectItem value="not_equals" className="text-[11px]">Not Equals</SelectItem>
                      <SelectItem value="gt" className="text-[11px]">Greater Than</SelectItem>
                      <SelectItem value="lt" className="text-[11px]">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Value..."
                  value={newFilter.value as string}
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                  className="rounded-lg h-9 text-[11px] border-border bg-muted/30 placeholder:text-muted-foreground/40"
                />
                <Button
                  onClick={handleAddFilter}
                  className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-tighter"
                  disabled={!newFilter.column || !newFilter.value}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Filter
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* ACTIVE FILTERS CHIPS */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/50 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5">
            {activeFilters.map((filter) => (
              <div 
                key={filter.id}
                className="flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 bg-background border border-border/40 rounded-full shadow-sm hover:border-primary/30 transition-all whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">{formatHeader(filter.column)}</span>
                  <span className="text-[8px] font-black text-primary uppercase">{filter.operator === 'equals' ? '=' : filter.operator === 'not_equals' ? '≠' : filter.operator}</span>
                  <span className="text-[9px] font-bold text-foreground max-w-[80px] truncate">&quot;{filter.value}&quot;</span>
                </div>
                
                <button 
                  onClick={() => onRemoveFilter(filter.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground text-muted-foreground/40 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            
            <button 
              onClick={onClearAll}
              className="shrink-0 text-[8px] font-black text-destructive/60 hover:text-destructive hover:bg-destructive/5 uppercase tracking-widest px-2 py-1 rounded-md transition-all ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 2. FIXED HEADER AREA */}
      <div className="shrink-0 overflow-hidden bg-muted/40 border-b border-border/50 z-20 relative" style={{ paddingRight: `${scrollbarWidth}px` }}>
        {/* Resizing Guide Line */}
        {resizingGuideX !== null && (
          <div 
            className={cn(
              "absolute top-0 bottom-0 w-0.5 z-50 pointer-events-none transition-colors",
              isHittingBoundary ? "bg-destructive shadow-[0_0_10px_rgba(var(--destructive-rgb),0.5)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            )}
            style={{ left: resizingGuideX, height: '2000px' }} 
          />
        )}
        <div ref={headerRef} className="overflow-hidden scrollbar-hide">
          <div style={{ width: TOTAL_WIDTH }}>
            <Table className="border-separate border-spacing-0 table-fixed" style={{ width: TOTAL_WIDTH }}>
              <ColGroup />
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0">
                  {activeColumns.map((col) => (
                    <TableHead 
                      key={col} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, col)} 
                      onDragOver={(e) => handleDragOver(e, col)} 
                      onDrop={(e) => handleDrop(e, col)}
                      onDragEnd={() => { setDraggedColumn(null); setDropIndicator(null); }}
                      className={cn(
                        "h-10 p-0 relative border-b border-foreground/10 cursor-grab active:cursor-grabbing transition-all bg-background",
                        draggedColumn === col && "opacity-20",
                        dropIndicator?.col === col && dropIndicator.side === 'left' && "border-l-2 border-l-primary/50",
                        dropIndicator?.col === col && dropIndicator.side === 'right' && "border-r-2 border-r-primary/50",
                        sortConfig.key === col && sortConfig.direction !== 'none' && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center h-full px-4 gap-2.5 group/header">
                        <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground/20 group-hover/header:text-primary/40 transition-colors shrink-0" />
                        
                        <div 
                          onClick={() => handleSort(col)}
                          className="flex-1 flex items-center gap-2 cursor-pointer py-1"
                        >
                          <div className="truncate font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter">{formatHeader(col)}</div>
                          
                          {/* Sort Indicator */}
                          <div className="shrink-0 w-3 h-3 flex items-center justify-center">
                            {sortConfig.key === col && sortConfig.direction === 'asc' && (
                              <ArrowUp className="w-3 h-3 text-primary animate-in fade-in zoom-in duration-300" />
                            )}
                            {sortConfig.key === col && sortConfig.direction === 'desc' && (
                              <ArrowDown className="w-3 h-3 text-primary animate-in fade-in zoom-in duration-300" />
                            )}
                            {sortConfig.key !== col && (
                              <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 transition-all" />
                            )}
                          </div>
                        </div>
                        
                        {/* Advanced Resizer Handle */}
                        <div 
                          onMouseDown={(e) => startResizing(col, e)} 
                          onDoubleClick={() => autoFitColumn(col)}
                          className={cn(
                            "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group/resizer z-30 transition-all flex items-center justify-center",
                            "hover:w-4 hover:bg-primary/10",
                            resizingColumn.current?.field === col && "bg-primary/20 w-4"
                          )}
                        >
                          {/* Permanent Signifier */}
                          <div className={cn(
                            "w-[3px] h-6 rounded-full transition-all duration-300",
                            "bg-primary/30 group-hover/resizer:bg-primary group-hover/resizer:h-full",
                            resizingColumn.current?.field === col && "bg-primary h-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                          )} />

                          {/* Expansion Icon */}
                          <GripVertical className="absolute w-3 h-3 text-primary opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>
        </div>
      </div>

      {/* 3. SCROLLABLE BODY AREA */}
      <div ref={bodyRef} onScroll={handleScroll} className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent outline-none">
        {/* Ghost-Width Preview Overlay */}
        {resizingColumn.current && (
          <div 
            className="absolute top-0 bottom-0 bg-primary/5 border-r border-primary/20 pointer-events-none z-10"
            style={{ 
              left: activeColumns.slice(0, activeColumns.indexOf(resizingColumn.current.field)).reduce((acc, c) => acc + (columnWidths[c] || 200), 0),
              width: columnWidths[resizingColumn.current.field]
            }} 
          />
        )}
        
        <div style={{ width: TOTAL_WIDTH }}>
          <Table className="border-separate border-spacing-0 table-fixed" style={{ width: TOTAL_WIDTH }}>
            <ColGroup />
            <TableBody>
              {sortedData.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  className="group border-0 relative transition-none bg-transparent"
                >
                  {activeColumns.map((col, colIdx) => {
                    const value = row[col];
                    const isEven = rowIndex % 2 === 0;
                    return (
                      <TableCell 
                        key={`${rowIndex}-${col}`} 
                        className={cn(
                          "px-4 py-2 border-b border-r border-border dark:border-border whitespace-nowrap text-[14px] font-black text-slate-900 dark:text-slate-50 relative transition-none",
                          // High-Visibility "Solid" Theme-Aware Zebra Striping (Cell-Level)
                          isEven ? "bg-muted/30 dark:bg-slate-900/40" : "bg-background dark:bg-slate-950",
                          // Neutral Industrial Hover (Solid Override)
                          "group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-foreground",
                          colIdx === 0 && "font-black text-slate-900 dark:text-slate-50 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[3px] after:bg-primary after:opacity-0 group-hover:after:opacity-100"
                        )}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{String(value ?? "-")}</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* 4. COMPACT LAYMAN FOOTER */}
      <div className="shrink-0 h-8 bg-muted/20 border-t border-border/40 flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-4 text-[9px] font-black tracking-widest text-muted-foreground/60 uppercase">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3 text-primary/40" />
            <span>{data.length} Total items found</span>
          </div>
          
          <div className="h-3 w-[1px] bg-border/40" />
          
          <div className="flex items-center gap-1.5">
            <MousePointer2 className="w-3 h-3 text-primary/40" />
            <span>Click headers to sort data</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-2.5 h-2.5 text-green-500/40" />
            <span>Latest data loaded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-2.5 h-2.5" />
            <span>System v6.0</span>
          </div>
        </div>
      </div>
    </div>
  );
});
DynamicTable.displayName = "DynamicTable";

function Badge({ count, total, hideTotal }: { count: number, total: number, hideTotal?: boolean }) {
  return <span className="ml-1 bg-primary/10 px-2 py-0.5 rounded-full text-[9px] font-black text-primary border border-primary/20 shadow-sm">{count}{!hideTotal && `/${total}`}</span>;
}
