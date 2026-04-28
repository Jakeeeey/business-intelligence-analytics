"use client";

import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  flexRender,
  GroupingState,
  ExpandedState,
  Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ReportData, PivotConfig, ColumnFilter } from "../types";
import { createPivotColumns, pivotAggregationFns, formatDateValue } from "../utils/tanstack-pivot-adapter";

interface PivotTableViewProps {
  data: ReportData[];
  config: PivotConfig;
  activeFilters: ColumnFilter[];
  onAddFilter: (filter: ColumnFilter) => void;
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  visibleColumns: string[];
  onToggleColumn: (col: string) => void;
  onExport?: (rows: Record<string, unknown>[], columns: Record<string, unknown>[]) => void;
  rowSort?: 'asc' | 'desc' | null;
  onRowSortChange?: (sort: 'asc' | 'desc' | null) => void;
  rowFilters?: string[] | null;
  onRowFiltersChange?: (filters: string[] | null) => void;
}

export interface PivotTableViewRef {
  exportToExcel: (fileName: string) => void;
}

export const PivotTableView = forwardRef<PivotTableViewRef, PivotTableViewProps>(({ 
  data, 
  config,
  rowSort: initialRowSort = null,
  onRowSortChange,
  rowFilters: initialRowFilters = null,
  onRowFiltersChange
}, ref) => {
  const [grouping, setGrouping] = useState<GroupingState>(config.rowFields.map(f => f.id));
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSort, setRowSort] = useState<'asc' | 'desc' | null>(initialRowSort);
  const [rowFilters, setRowFilters] = useState<string[] | null>(initialRowFilters);

  // Sync with props
  useEffect(() => {
    setRowSort(initialRowSort);
  }, [initialRowSort]);

  useEffect(() => {
    setRowFilters(initialRowFilters);
  }, [initialRowFilters]);

  // Sync with external config changes
  useEffect(() => {
    setGrouping(config.rowFields.map(f => f.id));
  }, [config.rowFields]);

  // Apply row-level filtering and sorting
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Filter
    if (rowFilters && config.rowFields.length > 0) {
      const primaryField = config.rowFields[0];
      result = result.filter(row => {
        const rawVal = row[primaryField.id as keyof ReportData];
        const formattedVal = primaryField.type === 'date' 
          ? formatDateValue(rawVal, primaryField.dateGrouping)
          : String(rawVal ?? "");
        return rowFilters.includes(formattedVal);
      });
    }
    
    // Sort
    if (rowSort && config.rowFields.length > 0) {
      const primaryField = config.rowFields[0].id;
      result.sort((a, b) => {
        const valA = String(a[primaryField]);
        const valB = String(b[primaryField]);
        return rowSort === 'asc' 
          ? valA.localeCompare(valB, undefined, { numeric: true })
          : valB.localeCompare(valA, undefined, { numeric: true });
      });
    }
    
    return result;
  }, [data, rowSort, rowFilters, config.rowFields]);

  const columns = useMemo(
    () => createPivotColumns(config, data, { // Use original data for metadata/filters
      onSort: (s) => {
        setRowSort(s);
        if (onRowSortChange) onRowSortChange(s);
      },
      onFilter: (f) => {
        setRowFilters(f);
        if (onRowFiltersChange) onRowFiltersChange(f);
      }
    }),
    [config, data, onRowSortChange, onRowFiltersChange] // REMOVED rowFilters to keep columns stable
  );

  // CRITICAL: Ensure grouping/visibility only refers to columns that actually exist in the current definition
  // This prevents the "Column with id 'X' does not exist" crash during schema transitions.
  const validatedGrouping = useMemo(() => {
    const existingIds = new Set(columns.map(c => c.id));
    return grouping.filter(id => existingIds.has(id));
  }, [grouping, columns]);

  const validatedVisibility = useMemo(() => {
    const existingIds = new Set(columns.map(c => c.id));
    const visibility: Record<string, boolean> = {};
    config.rowFields.forEach(f => {
      if (existingIds.has(f.id)) {
        visibility[f.id] = false;
      }
    });
    return visibility;
  }, [config.rowFields, columns]);

  const table = useReactTable({
    data: processedData,
    columns,
    state: {
      grouping: validatedGrouping,
      expanded,
      columnVisibility: validatedVisibility,
    },
    meta: {
      rowFilters,
      rowSort
    },
    columnResizeMode: 'onChange',
    autoResetExpanded: false,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    aggregationFns: pivotAggregationFns,
  });

  const { rows } = table.getRowModel();

    // ═══════════════════════════════════════════════════════════════════
    // EXPORT LOGIC (Exposed to parent)
    // ═══════════════════════════════════════════════════════════════════
    useImperativeHandle(ref, () => {
      const calculateFooterRow = () => {
        const leafCols = table.getAllLeafColumns().filter(col => {
          const isRowField = config.rowFields.some(f => f.id === col.id);
          const isRowLabels = col.id === "rowLabels";
          return isRowLabels || !isRowField;
        });
        
        return leafCols.reduce((acc: Record<string, unknown>, col) => {
          if (col.id === 'rowLabels') {
            acc[col.id] = "GRAND TOTAL";
          } else {
            const topLevelRows = table.getGroupedRowModel().rows;
            acc[col.id] = topLevelRows.reduce((sum, r) => sum + (Number(r.getValue(col.id)) || 0), 0);
          }
          return acc;
        }, {});
      };

      return {
        getFooterRow: calculateFooterRow,
        exportToExcel: (fileName: string) => {
          const leafColumns = table.getAllLeafColumns().filter(col => {
            const isRowField = config.rowFields.some(f => f.id === col.id);
            const isRowLabels = col.id === "rowLabels";
            return isRowLabels || !isRowField;
          });

          // Get the actual header groups (multi-level)
          const headerGroups = table.getHeaderGroups();
          const multiLevelHeaders = headerGroups.map(group => {
            return group.headers
              .filter(header => {
                const colId = header.column.id;
                const isRowField = config.rowFields.some(f => f.id === colId);
                const isRowLabels = colId === "rowLabels";
                return isRowLabels || !isRowField;
              })
              .map(header => ({
                id: header.column.id,
                header: typeof header.column.columnDef.header === 'string' 
                  ? header.column.columnDef.header 
                  : (header.column.id === 'rowLabels' ? 'ROW LABELS' : header.column.id),
                colSpan: header.colSpan,
                isPlaceholder: header.isPlaceholder
              }));
          });

          const exportCols = leafColumns.map(col => {
            const header = col.columnDef.header;
            let headerTitle = typeof header === 'string' ? header : col.id;
            if (col.id === 'rowLabels') headerTitle = 'ROW LABELS';
            
            return {
              id: col.id,
              header: headerTitle
            };
          });

          // Helper to recursively collect all rows in the tree regardless of expansion state
          const getAllRowsRecursively = (rows: Row<ReportData>[]): { depth: number; getValue: (colId: string) => unknown }[] => {
            let all: { depth: number; getValue: (colId: string) => unknown }[] = [];
            rows.forEach(row => {
              // Only include grouped rows (those that have a dimension label)
              // This removes the redundant 'leaf' data rows that just repeat the total
              if (row.getIsGrouped()) {
                all.push({
                  depth: row.depth,
                  getValue: (colId: string) => {
                    if (colId === 'rowLabels') {
                      return row.getValue(row.groupingColumnId!);
                    }
                    return row.getValue(colId);
                  }
                });
                
                if (row.subRows && row.subRows.length > 0) {
                  all = [...all, ...getAllRowsRecursively(row.subRows)];
                }
              }
            });
            return all;
          };

          const allRows = getAllRowsRecursively(table.getGroupedRowModel().rows);

          import("../utils/export-styled-utils").then(mod => {
            mod.exportStyledPivotToExcel(allRows, exportCols, fileName, calculateFooterRow(), multiLevelHeaders);
          });
        }
      };
    });

  const headerGroups = table.getHeaderGroups();
  const footerGroups = table.getFooterGroups();

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-8 text-muted-foreground bg-muted/5 font-mono text-xs uppercase tracking-widest border border-slate-200/50 rounded-xl">
        No analytics data loaded
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col bg-background font-sans text-[11px] leading-none overflow-hidden border border-border rounded-xl">
      
      {/* Viewport: The window that allows both vertical and horizontal scrolling */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative bg-background dark:bg-slate-950">
        
        {/* Canvas: The actual wide area containing the table */}
        {/* CRITICAL: width:100% fills viewport when cols are few (no orphan space) */}
        {/* minWidth:max-content expands BEYOND viewport when cols are many → triggers scroll */}
        <div
          className="flex flex-col relative min-h-full"
          style={{ minWidth: 'max-content' }}
        >
          
          {/* HEADER ROW */}
            <div className="sticky top-0 z-40 flex flex-col shrink-0 bg-muted/90 dark:bg-slate-950 border-b border-border"
            style={{ minWidth: 'max-content' }}>
            {headerGroups.map((headerGroup) => (
              <div key={headerGroup.id} className="flex border-b border-border last:border-b-0 h-10">
                {headerGroup.headers.map((header) => (
                  <div 
                    key={header.id}
                    style={{ 
                      width: header.getSize(),
                      flex: `0 0 ${header.getSize()}px`,
                      position: 'relative'
                    }}
                    className="px-5 flex items-center text-foreground font-black uppercase tracking-tight border-r border-border last:border-r-0 bg-muted/50 dark:bg-slate-950"
                  >
                    <div className="truncate flex-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    
                    {/* HIGH-VISIBILITY INDUSTRIAL RESIZER */}
                    <div
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: cn(
                          "absolute right-0 top-0 h-full w-4 cursor-col-resize select-none touch-none z-30 flex items-center justify-center transition-all group/resizer",
                          header.column.getIsResizing() ? "translate-x-0" : "translate-x-1/2"
                        ),
                      }}
                    >
                      <div className={cn(
                        "w-1 h-[60%] rounded-full transition-all flex flex-col items-center justify-center gap-0.5",
                        header.column.getIsResizing() 
                          ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                          : "bg-slate-800 group-hover/resizer:bg-slate-600"
                      )}>
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-400/20" />
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-400/20" />
                      </div>
                    </div>

                    {header.column.getIsResizing() && (
                      <div className="absolute right-0 top-0 h-[1000vh] w-[1px] bg-emerald-500/50 z-50 pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* BODY ROWS */}
          <div className="flex flex-col bg-white" style={{ minWidth: 'max-content' }}>
            {rows.map((row) => {
              // Option A: Strict Pivot - Do not render raw leaf rows
              if (!row.getIsGrouped()) return null;

              // Determine if this is the deepest grouping level
              const isLastGroupLevel = row.depth >= config.rowFields.length - 1;
              const canExpand = row.getCanExpand() && !isLastGroupLevel;

              return (
                <div 
                  key={row.id}
                  className={cn(
                    "flex border-b border-border transition-colors h-10 items-center group bg-background dark:bg-slate-950",
                    "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isRowLabelColumn = cell.column.id === "rowLabels";
                    const isPlaceholder = cell.getIsPlaceholder();

                    return (
                      <div 
                        key={cell.id}
                        style={{ 
                          width: cell.column.getSize(),
                          flex: `0 0 ${cell.column.getSize()}px`,
                          paddingLeft: isRowLabelColumn ? `${(row.depth * 20) + 16}px` : undefined
                        }}
                        className={cn(
                          "px-5 flex items-center border-r border-border h-full truncate transition-colors",
                          isRowLabelColumn 
                            ? cn(
                                "tracking-tight bg-muted/5 dark:bg-slate-900/20 justify-start",
                                row.depth === 0 ? "font-bold text-slate-900 dark:text-slate-50" : 
                                row.depth === 1 ? "font-semibold text-slate-800 dark:text-slate-100" : 
                                "font-medium text-slate-700 dark:text-slate-300"
                              ) 
                            : "text-slate-900 dark:text-slate-50 font-black font-mono tabular-nums text-[13px] justify-end text-right"
                        )}
                      >
                        {isRowLabelColumn ? (
                          <div className="flex items-center gap-2 truncate w-full">
                            {canExpand && (
                              <button
                                onClick={row.getToggleExpandedHandler()}
                                className="shrink-0 p-0.5 rounded-md hover:bg-slate-200/50 text-slate-500 transition-colors"
                              >
                                {row.getIsExpanded() ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            {!canExpand && (
                              <span className="shrink-0 w-[18px]" /> // Spacer matches exactly the button width (14px icon + 4px padding)
                            )}
                            <span className="truncate">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </span>
                          </div>
                        ) : cell.getIsAggregated() ? (
                          <span className="font-black text-slate-900 dark:text-slate-50">
                            {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        ) : (
                          <span className="truncate font-black text-slate-900 dark:text-slate-50">
                            {isPlaceholder ? "" : flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* FOOTER ROW (GRAND TOTAL) - STICKY BOTTOM */}
          <div 
            className="sticky bottom-0 z-40 flex shrink-0 bg-background dark:bg-slate-950 border-t-2 border-border h-14"
            style={{ minWidth: 'max-content' }}
          >
            {footerGroups[0].headers.map((header, idx) => (
              <div 
                key={header.id}
                style={{ 
                  width: header.getSize(),
                  flex: `0 0 ${header.getSize()}px`
                }}
                className={cn(
                  "px-5 flex items-center border-r border-border last:border-r-0 h-full bg-muted dark:bg-slate-950",
                  idx === 0 
                    ? "text-muted-foreground font-black uppercase tracking-widest text-[9px] justify-start" 
                    : "text-slate-900 dark:text-slate-50 font-black text-base font-mono tabular-nums justify-end text-right"
                )}
              >
                {idx === 0 ? (
                  <div className="flex flex-col">
                    <span className="text-[8px] opacity-40 leading-none mb-1">SUMMARY</span>
                    <span>Grand Total</span>
                  </div>
                ) : flexRender(header.column.columnDef.footer, header.getContext())}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
});
PivotTableView.displayName = "PivotTableView";
