"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  ReportConfigModal, 
  DynamicTable, 
  DeleteReportDialog,
  PivotTableView,
  PivotControls,
  FilterBar,
  pivotData,
  filterData,
  exportPivotToExcel,
  exportRawToExcel,
  saveFiltersToLocal,
  loadFiltersFromLocal,
  AggregationType,
  ColumnFilter
} from "@/modules/business-intelligence-analytics/dynamic-reports";
import { DynamicReportService } from "@/modules/business-intelligence-analytics/dynamic-reports/services/DynamicReportService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Database, RefreshCcw, FileText, Download, LayoutGrid, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";

export default function DynamicReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Pivot States
  const [isPivotMode, setIsPivotMode] = useState(false);
  const [pivotConfig, setPivotConfig] = useState({
    rowKey: "",
    colKey: "",
    valueKey: "",
    aggType: "presence" as AggregationType
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<ColumnFilter[]>([]);

  // Load persistence on mount
  useEffect(() => {
    const saved = loadFiltersFromLocal();
    setSearchTerm(saved.searchTerm);
    setActiveFilters(saved.filters);
  }, []);

  // Save persistence on change
  useEffect(() => {
    saveFiltersToLocal(activeFilters, searchTerm);
  }, [activeFilters, searchTerm]);

  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const result = await DynamicReportService.getRegisteredReports();
      setReports(result);
    } catch (error: any) {
      toast.error("Failed to load reports: " + error.message);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const fetchReportData = async (report: any) => {
    setSelectedReport(report);
    setIsFetchingData(true);
    setData([]);
    try {
      const result = await DynamicReportService.fetchReportData(report.url);
      setData(result);
      
      // Auto-configure pivot if columns exist
      if (result.length > 0) {
        const cols = Object.keys(result[0]);
        setPivotConfig({
          rowKey: cols[0] || "",
          colKey: cols[1] || "",
          valueKey: cols[0] || "",
          aggType: "presence"
        });
      }
      
      toast.success(`Loaded ${result.length} records`);
    } catch (error: any) {
      toast.error(error.message);
      setData([]);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleDeleted = () => {
    setSelectedReport(null);
    setData([]);
    loadReports();
  };

  // Memoized columns for controls
  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  // APPLY DYNAMIC FILTERING
  const filteredData = useMemo(() => {
    return filterData(data, searchTerm, activeFilters);
  }, [data, searchTerm, activeFilters]);

  // Memoized pivoted data (uses filteredData now)
  const pivotedData = useMemo(() => {
    if (!isPivotMode || filteredData.length === 0 || !pivotConfig.rowKey || !pivotConfig.colKey) return null;
    return pivotData(
      filteredData, 
      pivotConfig.rowKey, 
      pivotConfig.colKey, 
      pivotConfig.valueKey, 
      pivotConfig.aggType
    );
  }, [filteredData, isPivotMode, pivotConfig]);

  const handleExport = () => {
    if (isPivotMode && pivotedData) {
      exportPivotToExcel(pivotedData, pivotConfig.rowKey, pivotConfig.colKey, `${selectedReport.name}_pivot.xlsx`);
      toast.success("Pivot report exported!");
    } else {
      exportRawToExcel(filteredData, `${selectedReport.name}_raw.xlsx`);
      toast.success("Filtered report exported!");
    }
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="p-6 md:p-10 max-w-[1750px] mx-auto space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Dynamic Reports
          </h1>
          <p className="text-muted-foreground font-medium">
            Register and view table data from any Spring Boot API endpoint.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <ReportConfigModal onSuccess={loadReports} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Registered Reports */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Saved Endpoints
            </h2>
            <Button variant="ghost" size="icon" onClick={loadReports} className="h-6 w-6 rounded-full">
              <RefreshCcw className={`w-3 h-3 ${isLoadingReports ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Card className="rounded-2xl border-none shadow-premium bg-background/50 backdrop-blur-md overflow-hidden">
            <div className="divide-y divide-muted/10">
              {isLoadingReports ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No reports registered yet.
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`group relative overflow-hidden transition-all ${
                      selectedReport?.id === report.id ? "bg-primary/10" : "hover:bg-primary/5"
                    }`}
                  >
                    {selectedReport?.id === report.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => fetchReportData(report)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className={`p-2 rounded-xl transition-colors ${
                          selectedReport?.id === report.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/20"
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm tracking-tight truncate">{report.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {report.url}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ReportConfigModal 
                          mode="edit" 
                          initialData={report} 
                          onSuccess={loadReports} 
                        />
                        <DeleteReportDialog 
                          reportId={report.id} 
                          reportName={report.name} 
                          onSuccess={handleDeleted} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>

        {/* Main Content: Data View */}
        <main className="lg:col-span-3 space-y-6">
          {/* TOP TOOLBAR: FILTERING & SEARCH (Visible if a report is selected) */}
          {selectedReport && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <FilterBar 
                columns={columns}
                searchTerm={searchTerm}
                activeFilters={activeFilters}
                onSearchChange={setSearchTerm}
                onAddFilter={(f) => setActiveFilters([...activeFilters, f])}
                onRemoveFilter={(id) => setActiveFilters(activeFilters.filter(f => f.id !== id))}
                onClearAll={() => {
                  setActiveFilters([]);
                  setSearchTerm("");
                }}
              />
            </div>
          )}

          {/* VIEW MODE SELECTOR */}
          {selectedReport && !isFetchingData && data.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-muted">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="pivot-mode" 
                    checked={isPivotMode} 
                    onCheckedChange={setIsPivotMode} 
                  />
                  <Label htmlFor="pivot-mode" className="font-black tracking-tighter cursor-pointer flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Pivot Table Mode
                  </Label>
                </div>
                {isPivotMode && (
                  <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black uppercase tracking-widest">
                    Alpha Preview
                  </div>
                )}
              </div>
              <Button 
                onClick={handleExport} 
                variant="outline" 
                size="sm"
                className="rounded-xl font-bold tracking-tight gap-2"
              >
                <Download className="w-4 h-4" />
                Download Filtered Report
              </Button>
            </div>
          )}

          {isPivotMode && selectedReport && !isFetchingData && data.length > 0 && (
            <PivotControls 
              columns={columns} 
              config={pivotConfig} 
              onChange={setPivotConfig} 
              onExport={handleExport}
            />
          )}

          {isFetchingData ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4 border-2 border-dashed rounded-2xl bg-muted/10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-bold tracking-tighter text-xl">Processing Data...</p>
                <p className="text-sm text-muted-foreground">This may take a moment for larger reports.</p>
              </div>
            </div>
          ) : selectedReport ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">{selectedReport.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedReport.url}</p>
                </div>
                <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Matching Records
                  </p>
                  <p className="text-xl font-black tracking-tighter">
                    {filteredData.length} <span className="text-sm text-muted-foreground">/ {data.length} total</span>
                  </p>
                </div>
              </div>

              {filteredData.length === 0 && data.length > 0 ? (
                <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-2xl text-muted-foreground">
                  <SearchIcon className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-lg font-medium">No results matching your filters</p>
                  <Button variant="link" onClick={() => { setActiveFilters([]); setSearchTerm(""); }}>
                    Reset all filters
                  </Button>
                </div>
              ) : filteredData.length === 0 && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/5">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium italic">Empty Dataset</p>
                  <p className="text-sm opacity-60">The selected report returned no data from the API.</p>
                </div>
              ) : isPivotMode && pivotedData ? (
                <PivotTableView pivotData={pivotedData} rowLabel={pivotConfig.rowKey} />
              ) : (
                <DynamicTable data={filteredData} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-2xl text-muted-foreground">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a report from the list to begin</p>
              <p className="text-sm opacity-60">Search and Filtering will be available after loading.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
