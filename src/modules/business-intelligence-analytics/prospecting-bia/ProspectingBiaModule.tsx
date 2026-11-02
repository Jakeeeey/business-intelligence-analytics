"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import Filters from "./components/Filters";
import ProspectingBiaTable from "./components/ProspectingBiaTable";
import { ProspectDetailsModal } from "./components/ProspectDetailsModal";
import { MultiSelectOption } from "./components/MultiSelect";
import type {
  CustomerProspect,
  Salesman,
  StoreType,
  ProspectingDataPayload,
  ProspectGroupedItem,
  ProspectStatus,
} from "./types";
import { normalizeProspectStatus } from "./utils/prospect-status";

type StatusTab = "pending" | "contacted" | "converted" | "dropped" | "all";

// `matches` lists the statuses a tab covers; null means "everything".
// Contacted deliberately covers both `contacted` and `follow-up`, so a prospect
// with a scheduled follow-up stays under the Contacted tab.
const STATUS_TABS: {
  value: StatusTab;
  label: string;
  matches: ProspectStatus[] | null;
  dot: string;
  active: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    matches: ["pending"],
    dot: "bg-info",
    active:
      "data-[state=active]:bg-info-bg data-[state=active]:text-info dark:data-[state=active]:bg-info-bg dark:data-[state=active]:text-info data-[state=active]:ring-info/30",
  },
  {
    value: "contacted",
    label: "Contacted",
    matches: ["contacted", "follow-up"],
    dot: "bg-warning",
    active:
      "data-[state=active]:bg-warning-bg data-[state=active]:text-warning dark:data-[state=active]:bg-warning-bg dark:data-[state=active]:text-warning data-[state=active]:ring-warning/30",
  },
  {
    value: "converted",
    label: "Converted",
    matches: ["converted"],
    dot: "bg-success",
    active:
      "data-[state=active]:bg-success-bg data-[state=active]:text-success dark:data-[state=active]:bg-success-bg dark:data-[state=active]:text-success data-[state=active]:ring-success/30",
  },
  {
    value: "dropped",
    label: "Dropped",
    matches: ["dropped"],
    dot: "bg-destructive",
    active:
      "data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive dark:data-[state=active]:bg-destructive/10 dark:data-[state=active]:text-destructive data-[state=active]:ring-destructive/30",
  },
  {
    value: "all",
    label: "All",
    matches: null,
    dot: "bg-muted-foreground/50",
    active:
      "data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary data-[state=active]:ring-primary/30",
  },
];

export default function ProspectingBiaModule() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Raw states
  const [prospects, setProspects] = React.useState<CustomerProspect[]>([]);
  const [salesmen, setSalesmen] = React.useState<Salesman[]>([]);
  const [storeTypes, setStoreTypes] = React.useState<StoreType[]>([]);

  // Filter selections
  const [statusTab, setStatusTab] = React.useState<StatusTab>("pending");
  const [selectedSalesmen, setSelectedSalesmen] = React.useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([]);
  const [selectedStoreTypes, setSelectedStoreTypes] = React.useState<string[]>([]);

  // Selected prospect for the detail dialog
  const [selectedProspectId, setSelectedProspectId] = React.useState<number | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/bia/prospecting-bia");
      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.statusText}`);
      }
      const data: ProspectingDataPayload = await res.json();
      setProspects(data.customerProspects || []);
      setSalesmen(data.salesmen || []);
      setStoreTypes(data.storeTypes || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Map IDs to Names
  const salesmenMap = React.useMemo(() => {
    return new Map(salesmen.map((s) => [s.id, s.salesman_name]));
  }, [salesmen]);

  const storeTypesMap = React.useMemo(() => {
    return new Map(storeTypes.map((t) => [t.id, t.store_type]));
  }, [storeTypes]);

  // Flatten the prospects into grouped rows (grouped by salesman → province → store type)
  const allCombinations = React.useMemo<ProspectGroupedItem[]>(() => {
    const list: ProspectGroupedItem[] = [];
    const seen = new Set<string>();

    for (const p of prospects) {
      const status = normalizeProspectStatus(p.prospect_status);
      const salesmanName = (p.salesman_id ? salesmenMap.get(p.salesman_id) : null) || "Unknown Salesman";
      const province = (p.province && p.province.trim()) || "Unknown Area";
      const storeTypeName = (p.store_type ? storeTypesMap.get(p.store_type) : null) || "Unknown Store Type";
      const customerName = (p.customer_name && p.customer_name.trim()) || "Unknown Customer";
      const probability =
        p.percentage === null || p.percentage === undefined || String(p.percentage).trim() === ""
          ? null
          : String(p.percentage);
      const schedule = p.schedule ?? null;

      const key = `${p.id}||${salesmanName}||${province}||${storeTypeName}||${customerName}||${probability}||${status}||${schedule ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: p.id, salesmanName, province, storeTypeName, customerName, probability, status, schedule });
      }
    }

    // Sort to group them for rowSpan logic
    return list.sort((a, b) => {
      const cmpSalesman = a.salesmanName.localeCompare(b.salesmanName);
      if (cmpSalesman !== 0) return cmpSalesman;

      const cmpProvince = a.province.localeCompare(b.province);
      if (cmpProvince !== 0) return cmpProvince;

      const cmpStoreType = a.storeTypeName.localeCompare(b.storeTypeName);
      if (cmpStoreType !== 0) return cmpStoreType;

      const cmpCustomer = a.customerName.localeCompare(b.customerName);
      if (cmpCustomer !== 0) return cmpCustomer;

      return (a.probability ?? "").localeCompare(b.probability ?? "");
    });
  }, [prospects, salesmenMap, storeTypesMap]);

  // Per-status counts for the tab labels
  const statusCounts = React.useMemo(() => {
    const counts: Record<ProspectStatus, number> = {
      pending: 0,
      contacted: 0,
      "follow-up": 0,
      converted: 0,
      dropped: 0,
    };
    for (const p of prospects) {
      counts[normalizeProspectStatus(p.prospect_status)] += 1;
    }
    return counts;
  }, [prospects]);

  // Statuses covered by the active tab (null = all).
  const activeMatches = React.useMemo(
    () => STATUS_TABS.find((tab) => tab.value === statusTab)?.matches ?? null,
    [statusTab]
  );

  // Options for multi-select dropdown filters based on the combinations
  const filterOptions = React.useMemo(() => {
    const salesmenSet = new Set<string>();
    const areasSet = new Set<string>();
    const storeTypesSet = new Set<string>();

    for (const item of allCombinations) {
      salesmenSet.add(item.salesmanName);
      areasSet.add(item.province);
      storeTypesSet.add(item.storeTypeName);
    }

    const salesmanOptions: MultiSelectOption[] = Array.from(salesmenSet)
      .sort()
      .map((s) => ({ label: s, value: s }));

    const areaOptions: MultiSelectOption[] = Array.from(areasSet)
      .sort()
      .map((a) => ({ label: a, value: a }));

    const storeTypeOptions: MultiSelectOption[] = Array.from(storeTypesSet)
      .sort()
      .map((t) => ({ label: t, value: t }));

    return {
      salesmanOptions,
      areaOptions,
      storeTypeOptions,
    };
  }, [allCombinations]);

  // Reset all filters
  const handleResetFilters = React.useCallback(() => {
    setSelectedSalesmen([]);
    setSelectedAreas([]);
    setSelectedStoreTypes([]);
  }, []);

  // Filtered combinations (status tab + multi-select filters)
  const filteredData = React.useMemo(() => {
    return allCombinations.filter((item) => {
      if (activeMatches !== null && !activeMatches.includes(item.status)) {
        return false;
      }
      if (selectedSalesmen.length > 0 && !selectedSalesmen.includes(item.salesmanName)) {
        return false;
      }
      if (selectedAreas.length > 0 && !selectedAreas.includes(item.province)) {
        return false;
      }
      if (selectedStoreTypes.length > 0 && !selectedStoreTypes.includes(item.storeTypeName)) {
        return false;
      }
      return true;
    });
  }, [allCombinations, activeMatches, selectedSalesmen, selectedAreas, selectedStoreTypes]);

  // Prospect currently open in the detail dialog
  const selectedProspect = React.useMemo(
    () => (selectedProspectId === null ? null : prospects.find((p) => p.id === selectedProspectId) ?? null),
    [prospects, selectedProspectId]
  );

  const selectedSalesmanName =
    (selectedProspect?.salesman_id ? salesmenMap.get(selectedProspect.salesman_id) : null) || "Unknown Salesman";
  const selectedStoreTypeName =
    (selectedProspect?.store_type ? storeTypesMap.get(selectedProspect.store_type) : null) || "Unknown Store Type";

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status workflow tabs */}
      <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as StatusTab)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-full border border-border bg-muted/50 p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "min-h-11 md:min-h-0 gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground ring-1 ring-transparent transition-colors hover:text-foreground data-[state=active]:font-semibold dark:data-[state=active]:border-transparent",
                tab.active
              )}
            >
              <span className={cn("size-2 rounded-full", tab.dot)} aria-hidden />
              {tab.label}
              <span className="text-xs tabular-nums opacity-70">
                {tab.matches === null
                  ? prospects.length
                  : tab.matches.reduce((sum, s) => sum + statusCounts[s], 0)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters section */}
      <Filters
        salesmanOptions={filterOptions.salesmanOptions}
        areaOptions={filterOptions.areaOptions}
        storeTypeOptions={filterOptions.storeTypeOptions}
        selectedSalesmen={selectedSalesmen}
        onSalesmenChange={setSelectedSalesmen}
        selectedAreas={selectedAreas}
        onAreasChange={setSelectedAreas}
        selectedStoreTypes={selectedStoreTypes}
        onStoreTypesChange={setSelectedStoreTypes}
        onReset={handleResetFilters}
      />

      {/* Loading state or grouped table view */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <ProspectingBiaTable
          data={filteredData}
          onSelectCustomer={setSelectedProspectId}
          showSchedule={statusTab === "contacted" || statusTab === "all"}
        />
      )}

      {/* Detail + workflow dialog */}
      <ProspectDetailsModal
        prospect={selectedProspect}
        open={selectedProspectId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProspectId(null);
        }}
        salesmanName={selectedSalesmanName}
        storeTypeName={selectedStoreTypeName}
        onChanged={loadData}
      />
    </div>
  );
}
