"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  DynamicTable, 
  PivotTableView,
  FilterBar,
  ManageReportsModal,
} from "./components";
import { PivotBuilder } from "./components/PivotBuilder";
import { DynamicReportService, ReportLayout } from "./services/DynamicReportService";
import { filterData } from "./utils/filter-utils";
import { RegisteredReport, ReportData, PivotConfig, ColumnFilter, PivotZone, DraggableField, AggregationType, DateGrouping, FilterOperator } from "./types";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Database, Download, LayoutGrid, Layers, RefreshCw, Filter, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ValueFieldWithAgg extends DraggableField {
  aggType: AggregationType;
}

interface ApiResponse {
  data: ReportData[];
}



export default function DynamicReportsModule() {
  const [reports, setReports] = useState<RegisteredReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<RegisteredReport | null>(null);
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [rawFields, setRawFields] = useState<DraggableField[]>([]);
  
  // Date Filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [isPivotMode, setIsPivotMode] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(true);
  const pivotTableRef = useRef<{ exportToExcel: (filename: string) => void } | null>(null);
  const rawTableRef = useRef<{ exportToExcel: (filename: string) => void } | null>(null);
  const [zones, setZones] = useState<Record<string, PivotZone>>({
    available: { id: 'available', fields: [] },
    rows: { id: 'rows', fields: [] },
    columns: { id: 'columns', fields: [] },
    values: { id: 'values', fields: [] },
    filters: { id: 'filters', fields: [] },
  });
  const [savedLayouts, setSavedLayouts] = useState<ReportLayout[]>([]);
  const [activeLayout, setActiveLayout] = useState<ReportLayout | null>(null);
  const [layoutName, setLayoutName] = useState("");

  // Dialog States
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | number | null>(null);

  const pivotConfig: PivotConfig = useMemo(() => ({
    rowFields: zones.rows.fields,
    columnFields: zones.columns.fields,
    valueFields: zones.values.fields.map(f => ({
      key: f.id,
      aggType: (f as unknown as ValueFieldWithAgg).aggType || 'sum'
    })),
    filterFields: zones.filters.fields.map(f => ({
      id: f.id,
      column: f.id,
      operator: f.filterOperator || 'equals',
      value: f.filterValue || ''
    })),
  }), [zones]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<ColumnFilter[]>([]);
  const [rowSort, setRowSort] = useState<'asc' | 'desc' | null>(null);
  const [rowFilters, setRowFilters] = useState<string[] | null>(null);



  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const result = await DynamicReportService.getRegisteredReports();
      setReports(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load reports: " + msg);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const fetchReportData = async (report: RegisteredReport) => {
    if (!report) return;
    
    // Set loading state first to block other interactions
    setIsFetchingData(true);
    setSelectedReport(report);
    
    try {
      // 1. Clean up the base URL to prevent duplication of date parameters
      let baseUrl = report.url;
      
      // Robust fix for 'merged' URLs (e.g. /pathhttp://domain/path)
      if (baseUrl.includes('http') && !baseUrl.startsWith('http')) {
        baseUrl = baseUrl.substring(baseUrl.lastIndexOf('http'));
      }

      // If it's a full URL or relative with params, we use URL object to clean it
      try {
        const urlObj = new URL(baseUrl.startsWith('http') ? baseUrl : `http://localhost${baseUrl}`);
        urlObj.searchParams.delete('startDate');
        urlObj.searchParams.delete('endDate');
        
        // If it was relative, remove the dummy host
        baseUrl = baseUrl.startsWith('http') 
          ? urlObj.toString() 
          : urlObj.toString().replace('http://localhost', '');
      } catch {
        // Fallback simple cleaning if URL object fails
        baseUrl = baseUrl.split('?')[0];
      }

      const separator = baseUrl.includes('?') ? '&' : '?';
      const fullUrl = `${baseUrl}${separator}startDate=${startDate}&endDate=${endDate}`;
      
      const result = await DynamicReportService.fetchReportData(fullUrl);
      
      const normalizedData = Array.isArray(result) 
        ? result as ReportData[]
        : (result && typeof result === 'object' && Array.isArray((result as ApiResponse).data)) 
          ? (result as ApiResponse).data
          : [];

      // Set data directly
      setData(normalizedData);
      
      if (normalizedData.length > 0) {
        const cols = Object.keys(normalizedData[0]);
        setVisibleColumns(cols);
        
        const availableFields: DraggableField[] = cols.map(c => {
          const sample = normalizedData.find((d: ReportData) => d[c] !== null && d[c] !== undefined)?.[c];
          const isNumeric = typeof sample === 'number' || (typeof sample === 'string' && sample.trim() !== '' && !isNaN(Number(sample)));
          
          // Strict Date Detection (Matches YYYY-MM-DD, MM/DD/YYYY, or ISO formats)
          const cLower = c.toLowerCase();
          const dateRegex = /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/;
          const isDateKey = cLower.includes('date') || cLower.includes('time') || cLower.includes('at') || cLower.includes('created');
          const isDateValue = typeof sample === 'string' && dateRegex.test(sample) && !isNaN(Date.parse(sample));

          return {
            id: c,
            name: c,
            type: (isDateKey || isDateValue) ? 'date' : isNumeric ? 'number' : 'string',
            dateGrouping: (isDateKey || isDateValue) ? 'daily' : undefined
          };
        });
        
        setRawFields(availableFields);
        // Always reset to initial zones for fresh load
        setInitialZones(availableFields);
      }
      
      toast.success(`Loaded ${normalizedData.length} records`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(msg);
      setData([]);
    } finally {
      setIsFetchingData(false);
    }
  };

  const loadLayouts = useCallback(async (reportId: string) => {
    try {
      const layouts = await DynamicReportService.getLayouts(reportId);
      setSavedLayouts(layouts);
    } catch (error) {
      console.error("Failed to load layouts:", error);
    }
  }, []);

  const handleApplyLayout = (layout: ReportLayout) => {
    try {
      // Config is stored as { zones: ..., activeFilters: ... }
      const config = layout.config as PivotConfig;
      if (config && config.zones) {
        // 1. Restore zones
        setZones(config.zones);
        
        // 2. Restore active filters (ensuring it's an array)
        if (Array.isArray(config.activeFilters)) {
          setActiveFilters([...config.activeFilters]);
        } else {
          setActiveFilters([]);
        }

        // Restore row-level filters and sort
        setRowSort(config.rowSort || null);
        setRowFilters(config.rowFilters || null);

        // 3. Sync active layout
        setActiveLayout({...layout, config}); // Ensure local config is parsed
        setLayoutName(layout.name);
        toast.success(`Applied layout: ${layout.name}`);
      }
    } catch {
      toast.error("Failed to apply layout");
    }
  };

  const executeSave = async (isUpdate: boolean) => {
    if (!selectedReport || !layoutName.trim()) {
      toast.error("Please enter a layout name");
      return;
    }

    try {
      toast.loading(isUpdate ? "Updating layout..." : "Saving layout...");
      
      const config: PivotConfig = { 
        ...pivotConfig,
        zones,
        activeFilters,
        rowSort,
        rowFilters
      };
      
      if (isUpdate && activeLayout) {
        const updatedLayout = await DynamicReportService.updateLayout(activeLayout.id, config);
        toast.dismiss();
        toast.success("Layout and filters updated successfully!");
        setActiveLayout(updatedLayout);
        setLayoutName(updatedLayout.name);
      } else {
        const newLayout = await DynamicReportService.saveLayout(selectedReport.id.toString(), layoutName, config);
        toast.dismiss();
        toast.success("Layout and filters saved successfully!");
        setActiveLayout(newLayout);
        setLayoutName(newLayout.name);
      }
      
      loadLayouts(selectedReport.id.toString());
      setShowSaveConfirm(false);
      setShowUpdateConfirm(false);
    } catch {
      toast.dismiss();
      toast.error("Failed to save layout");
    }
  };

  const handleSaveClick = () => {
    if (!layoutName.trim()) {
      toast.error("Please enter a name for the layout first");
      return;
    }
    
    if (activeLayout) {
      // If the name is the same as active, it's an update
      if (layoutName === activeLayout.name) {
        setShowUpdateConfirm(true);
      } else {
        // If name changed, treat as "Save As New"
        setShowSaveConfirm(true);
      }
    } else {
      setShowSaveConfirm(true);
    }
  };

  const executeDelete = async () => {
    const id = layoutToDelete || activeLayout?.id;
    if (!id) return;

    try {
      toast.loading("Deleting layout...");
      await DynamicReportService.deleteLayout(id);
      toast.dismiss();
      toast.success("Layout deleted successfully!");
      
      if (activeLayout?.id === id) {
        setActiveLayout(null);
        setLayoutName("");
        // Reset to initial state
        if (rawFields.length > 0) {
          setInitialZones(rawFields);
        }
        setActiveFilters([]);
        setRowSort(null);
        setRowFilters(null);
      }
      
      if (selectedReport) {
        loadLayouts(selectedReport.id.toString());
      }
      setShowDeleteConfirm(false);
      setLayoutToDelete(null);
    } catch {
      toast.dismiss();
      toast.error("Failed to delete layout");
    }
  };

  const handleValueAggChange = (fieldId: string, agg: AggregationType) => {
    setZones(prev => {
      const newValues = prev.values.fields.map(f => 
        f.id === fieldId ? { ...f, aggType: agg } : f
      );
      return {
        ...prev,
        values: { ...prev.values, fields: newValues }
      };
    });
  };



  const handleDateGroupingChange = (zoneId: string, fieldId: string, grouping: DateGrouping) => {
    setZones(prev => {
      const zoneKey = zoneId as keyof typeof prev;
      const newFields = prev[zoneKey].fields.map(f => 
        f.id === fieldId ? { ...f, dateGrouping: grouping } : f
      );
      return {
        ...prev,
        [zoneKey]: { ...prev[zoneKey], fields: newFields }
      };
    });
  };

  const handleFilterChange = (fieldId: string, operator: FilterOperator, value: string) => {
    setZones(prev => {
      const newFields = prev.filters.fields.map(f => 
        f.id === fieldId ? { ...f, filterOperator: operator, filterValue: value } : f
      );
      return {
        ...prev,
        filters: { ...prev.filters, fields: newFields }
      };
    });
  };

  const setInitialZones = (fields: DraggableField[]) => {
    setZones({
      available: { id: 'available', fields: [...fields] },
      rows: { id: 'rows', fields: [] },
      columns: { id: 'columns', fields: [] },
      values: { 
        id: 'values', 
        fields: [] 
      },
      filters: { id: 'filters', fields: [] },
    });
  };

  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const filteredData = useMemo(() => {
    // 1. Apply global search and top-bar filters
    let result = filterData(data, searchTerm, activeFilters);

    // 2. Apply PivotBuilder Zone Filters (ONLY when Pivot Mode is ON)
    if (isPivotMode && zones.filters?.fields && zones.filters.fields.length > 0) {
      zones.filters.fields.forEach(field => {
        const operator = field.filterOperator || 'equals';
        
        result = result.filter(row => {
          const rawValue = row[field.id];
          if (rawValue === undefined || rawValue === null) return false;
          
          // Handle Text Fields (Excel-style Multi-select Checklist)
          if (field.type === 'string' && operator === 'equals') {
             // If filterValue is empty (0/N selected), nothing should match
             if (!field.filterValue) return false;
             
             const selectedValues = field.filterValue.split(',').map(v => v.trim());
             return selectedValues.includes(String(rawValue));
          }
          
          // Numeric/Other filters still need a value to operate
          if (!field.filterValue) return true; 
          
          // Handle Numeric Fields and other operators
          const strVal = String(rawValue).toLowerCase();
          const numVal = Number(rawValue);
          const filterStr = field.filterValue.toLowerCase();
          const filterNum = Number(field.filterValue);

          switch (operator) {
            case 'equals': return strVal === filterStr;
            case 'not_equals': return strVal !== filterStr;
            case 'contains': return strVal.includes(filterStr);
            case 'gt': return !isNaN(numVal) && !isNaN(filterNum) && numVal > filterNum;
            case 'lt': return !isNaN(numVal) && !isNaN(filterNum) && numVal < filterNum;
            default: return true;
          }
        });
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, zones.filters, isPivotMode]);

  const handleExport = (rows?: Record<string, unknown>[], cols?: Record<string, unknown>[]) => {
    const reportName = selectedReport?.name || "report";
    toast.info("Exporting... please wait.");
    
    if (isPivotMode) {
      if (rows && cols) {
        // Manual trigger from component with specific data
        import("./utils/export-styled-utils").then(mod => {
          // Calculate footer row if needed or pass null
          mod.exportStyledPivotToExcel(
            rows as unknown as Parameters<typeof mod.exportStyledPivotToExcel>[0], 
            cols as unknown as Parameters<typeof mod.exportStyledPivotToExcel>[1], 
            `${reportName}_pivoted.xlsx`, 
            undefined
          );
        });
      } else {
        // Fallback to ref-based export
        pivotTableRef.current?.exportToExcel(`${reportName}_pivoted.xlsx`);
      }
    } else {
      rawTableRef.current?.exportToExcel(`${reportName}_raw.xlsx`);
    }
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (selectedReport) {
      loadLayouts(selectedReport.id.toString());
      setActiveLayout(null); // Reset active layout when changing reports
      setLayoutName("");
      setRowSort(null);
      setRowFilters(null);
    }
  }, [selectedReport, loadLayouts]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <FilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actionStrip={
          <div className="flex items-center gap-2 h-10">
            {/* 1. SELECT ENDPOINT SECTION */}
            <div className="h-full flex items-center border border-border bg-background dark:bg-slate-900 rounded-md shadow-sm overflow-hidden">
              <Select 
                onValueChange={(val) => {
                  const r = reports.find(r => r.id.toString() === val);
                  if (r) {
                    setSelectedReport(r);
                  }
                }}
                value={selectedReport?.id?.toString() || undefined}
              >
                <SelectTrigger className="w-44 h-full border-none bg-transparent font-bold tracking-tight text-[10px] focus:ring-0 px-3">
                  <SelectValue placeholder={isLoadingReports ? "LOADING..." : "SELECT ENDPOINT"} />
                </SelectTrigger>
                <SelectContent className="rounded-md border-none shadow-premium z-[600] p-1">
                  <div className="max-h-[300px] overflow-y-auto">
                    {reports.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()} className="rounded-md py-2.5 text-[11px] font-bold focus:bg-primary/5">
                        {r.name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 3. DATE FILTERS SECTION */}
            <div className="h-full flex items-center gap-2 px-2 border border-border bg-background dark:bg-slate-900 rounded-md shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">From</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none border-none p-0 w-24 dark:invert-[0.1]"
                />
              </div>
              <div className="w-[1px] h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">To</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none border-none p-0 w-24 dark:invert-[0.1]"
                />
              </div>
            </div>

            {/* 3. LOAD ACTION */}
            <Button 
              disabled={!selectedReport || isFetchingData}
              onClick={() => selectedReport && fetchReportData(selectedReport)}
              className={cn(
                "h-full px-4 rounded-md font-black text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95",
                isFetchingData ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:shadow-lg"
              )}
            >
              {isFetchingData ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Filter className="w-3.5 h-3.5" />
              )}
              {isFetchingData ? "FETCHING..." : "LOAD DATA"}
            </Button>

            {/* 4. PIVOT SECTION */}
            {selectedReport && (
              <div className="h-full flex items-center gap-1 px-1 bg-muted/20 border border-border rounded-md shadow-sm">
                <div className="flex items-center gap-2 px-2">
                  <Switch 
                    id="pivot-mode" 
                    checked={isPivotMode} 
                    onCheckedChange={setIsPivotMode}
                    className="scale-[0.65]"
                  />
                  <Label htmlFor="pivot-mode" className="text-[9px] font-black tracking-tighter cursor-pointer flex items-center gap-1 whitespace-nowrap">
                    <LayoutGrid className="w-2.5 h-2.5 text-primary" />
                    PIVOT MODE
                  </Label>
                </div>
                {isPivotMode && (
                  <>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsBuilderOpen(!isBuilderOpen)}
                      className={cn(
                        "h-7 px-2 text-[9px] font-black gap-1.5 transition-all",
                        isBuilderOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Settings2 className={cn("w-3 h-3", isBuilderOpen && "animate-spin-slow")} />
                      {isBuilderOpen ? "HIDE LAYOUT" : "SHOW LAYOUT"}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* 5. MANAGE SECTION */}
            <ManageReportsModal 
              reports={reports} 
              onRefresh={loadReports} 
              trigger={
                <button 
                  className="h-full px-4 flex items-center border border-border bg-background hover:bg-muted transition-all active:scale-95 rounded-md shadow-sm"
                >
                  <Layers className="w-3 h-3 mr-2 text-foreground" />
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground">
                    MANAGE
                  </span>
                </button>
              }
            />

            {/* 6. EXPORT SECTION */}
            <button 
              onClick={() => handleExport()} 
              className="h-full px-4 flex items-center border border-border bg-background hover:bg-muted transition-all active:scale-95 rounded-md shadow-sm"
            >
              <Download className="w-3 h-3 mr-2 text-foreground" />
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground">
                EXPORT
              </span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col" style={{ overflow: 'hidden' }}>
        {isFetchingData ? (
          <div className="h-full flex flex-col items-center justify-center p-24 space-y-4 bg-muted/5">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">Synchronizing Analytics Engine...</p>
          </div>
        ) : !selectedReport ? (
          <div className="flex-1 flex flex-col min-h-0 bg-background border border-border shadow-sm rounded-md mx-4 mb-4 select-none items-center justify-center">
            <div className="flex flex-col items-center justify-center opacity-40">
              <Database className="w-16 h-16 mb-4 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic font-mono text-center">Select an analytics endpoint to begin</p>
            </div>
          </div>
        ) : isPivotMode ? (
          <div className="flex-1 flex min-h-0" style={{ overflow: 'hidden' }}>
            {isBuilderOpen && (
              <div className="h-full flex-col shrink-0 animate-in slide-in-from-left-4 duration-300">
                <PivotBuilder 
                  zones={zones} 
                  setZones={setZones} 
                  data={data} // Pass raw data for filter value extraction
                  onValueAggChange={handleValueAggChange}
                  onDateGroupingChange={handleDateGroupingChange}
                  onFilterChange={handleFilterChange}
                  onSaveLayout={handleSaveClick}
                  savedLayouts={savedLayouts}
                  onApplyLayout={handleApplyLayout}
                  onDeleteLayout={(id) => {
                    setLayoutToDelete(id);
                    setShowDeleteConfirm(true);
                  }}
                  onNewLayout={() => {
                    setActiveLayout(null);
                    setLayoutName("");
                    toast.info("Switched to Create New Layout mode. Enter a name and click Save.");
                  }}
                  layoutName={layoutName}
                  onLayoutNameChange={setLayoutName}
                  activeLayoutId={activeLayout?.id}
                />
              </div>
            )}
            <div className={cn(
              "flex-1 min-h-0 h-full p-4 transition-all duration-300 overflow-hidden",
              isBuilderOpen ? "pl-0" : "pl-4"
            )}>
              <PivotTableView 
                ref={pivotTableRef}
                data={filteredData} 
                config={pivotConfig} 
                activeFilters={activeFilters}
                onAddFilter={(f) => setActiveFilters([...activeFilters, f])}
                onRemoveFilter={(id) => setActiveFilters(activeFilters.filter(f => f.id !== id))}
                onClearAll={() => {
                  setActiveFilters([]);
                  setSearchTerm("");
                }}
                rowSort={rowSort}
                onRowSortChange={setRowSort}
                rowFilters={rowFilters}
                onRowFiltersChange={setRowFilters}
                visibleColumns={visibleColumns}
                onToggleColumn={(col) => {
                  setVisibleColumns(prev => 
                    prev.includes(col) 
                      ? (prev.length > 1 ? prev.filter(c => c !== col) : prev) 
                      : [...prev, col]
                  );
                }}
                onExport={(rows, cols) => handleExport(rows, cols)}
              />
            </div>
          </div>
        ) : (
          <DynamicTable 
            ref={rawTableRef}
            data={filteredData} 
            columns={columns}
            activeFilters={activeFilters}
            onAddFilter={(f) => setActiveFilters([...activeFilters, f])}
            onRemoveFilter={(id) => setActiveFilters(activeFilters.filter(f => f.id !== id))}
            onClearAll={() => {
              setActiveFilters([]);
              setSearchTerm("");
            }}
            visibleColumns={visibleColumns}
            onToggleColumn={(col) => {
              setVisibleColumns(prev => 
                prev.includes(col) 
                  ? (prev.length > 1 ? prev.filter(c => c !== col) : prev) 
                  : [...prev, col]
              );
            }}
          />
        )}
      </div>
      {/* CONFIRMATION DIALOGS */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent className="rounded-2xl border-border shadow-premium">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black uppercase tracking-widest">Save New Layout</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium">
              Do you want to save this as a new layout named <span className="font-bold text-primary italic">&quot;{layoutName}&quot;</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-[10px] font-bold uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => executeSave(false)}
              className="rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90"
            >
              Confirm Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <AlertDialogContent className="rounded-2xl border-border shadow-premium">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black uppercase tracking-widest">Update Existing Layout</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium">
              Do you want to update <span className="font-bold text-primary italic">&quot;{activeLayout?.name}&quot;</span> with your current settings and filters?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-[10px] font-bold uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => executeSave(true)}
              className="rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90"
            >
              Update Layout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border-border shadow-premium">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black uppercase tracking-widest text-destructive">Delete Layout</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium">
              Are you sure you want to delete <span className="font-bold text-destructive italic">&quot;{savedLayouts.find(l => l.id === (layoutToDelete || activeLayout?.id))?.name}&quot;</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-[10px] font-bold uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDelete}
              className="rounded-xl text-[10px] font-bold uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
