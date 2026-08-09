"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Filters from "./components/Filters";
import KpiCards from "./components/KpiCards";
import ActivationTable, { ActivationItem } from "./components/ActivationTable";
import { MultiSelectOption } from "./components/MultiSelect";
import type { CustomerProspect, Customer, ProspectingActivationPayload } from "./types";

export default function ProspectingActivationReportModule() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Raw states
  const [prospects, setProspects] = React.useState<CustomerProspect[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);

  // Filter selections
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([]);
  const [selectedStoreTypes, setSelectedStoreTypes] = React.useState<string[]>([]);
  const [activationStatus, setActivationStatus] = React.useState<"all" | "activated" | "pending">("all");

  // Load datasets on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/bia/prospecting-activation-report");
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.statusText}`);
        }
        const data: ProspectingActivationPayload = await res.json();
        setProspects(data.customerProspects || []);
        setCustomers(data.customers || []);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Compute lookup set for activated customer codes
  const activatedCodesSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) {
      if (c.customer_code && c.customer_code.trim()) {
        set.add(c.customer_code.trim().toLowerCase());
      }
    }
    return set;
  }, [customers]);

  // Construct comparison items from approved prospects
  const comparisonItems = React.useMemo<ActivationItem[]>(() => {
    return prospects.map((p) => {
      const customerCode = p.customer_code ? p.customer_code.trim() : "";
      const isActivated = customerCode ? activatedCodesSet.has(customerCode.toLowerCase()) : false;

      return {
        id: p.id,
        customerCode,
        customerName: p.customer_name || "Unknown Customer",
        storeName: p.store_name || "Unknown Store",
        province: (p.province && p.province.trim()) || "Unknown Area",
        storeType: p.store_type ? String(p.store_type) : "Unknown",
        dateEntered: p.date_entered || "",
        isActivated,
      };
    });
  }, [prospects, activatedCodesSet]);

  // Options for filters based on all comparison items
  const filterOptions = React.useMemo(() => {
    const areasSet = new Set<string>();
    const storeTypesSet = new Set<string>();

    for (const item of comparisonItems) {
      areasSet.add(item.province);
      storeTypesSet.add(item.storeType);
    }

    const areaOptions: MultiSelectOption[] = Array.from(areasSet)
      .sort()
      .map((a) => ({ label: a, value: a }));

    const storeTypeOptions: MultiSelectOption[] = Array.from(storeTypesSet)
      .sort()
      .map((t) => ({ label: t === "Unknown" ? t : `Type #${t}`, value: t }));

    return {
      areaOptions,
      storeTypeOptions,
    };
  }, [comparisonItems]);

  // Reset all filters
  const handleResetFilters = React.useCallback(() => {
    setSelectedAreas([]);
    setSelectedStoreTypes([]);
    setActivationStatus("all");
  }, []);

  // Filtered comparison records
  const filteredData = React.useMemo(() => {
    return comparisonItems.filter((item) => {
      if (selectedAreas.length > 0 && !selectedAreas.includes(item.province)) {
        return false;
      }
      if (selectedStoreTypes.length > 0 && !selectedStoreTypes.includes(item.storeType)) {
        return false;
      }
      if (activationStatus === "activated" && !item.isActivated) {
        return false;
      }
      if (activationStatus === "pending" && item.isActivated) {
        return false;
      }
      return true;
    });
  }, [comparisonItems, selectedAreas, selectedStoreTypes, activationStatus]);

  // Compute KPI metrics dynamically based on filtered data (keeps KPIs aligned with filters)
  const kpis = React.useMemo(() => {
    const totalApproved = filteredData.length;
    const totalActivated = filteredData.filter((item) => item.isActivated).length;
    const totalPending = totalApproved - totalActivated;
    const activationRate = totalApproved > 0 ? (totalActivated / totalApproved) * 100 : 0;

    return {
      totalApproved,
      totalActivated,
      totalPending,
      activationRate,
    };
  }, [filteredData]);

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
      {/* KPI Section */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse border" />
          ))}
        </div>
      ) : (
        <KpiCards
          totalApproved={kpis.totalApproved}
          totalActivated={kpis.totalActivated}
          totalPending={kpis.totalPending}
          activationRate={kpis.activationRate}
        />
      )}

      {/* Filters section */}
      <Filters
        areaOptions={filterOptions.areaOptions}
        storeTypeOptions={filterOptions.storeTypeOptions}
        selectedAreas={selectedAreas}
        onAreasChange={setSelectedAreas}
        selectedStoreTypes={selectedStoreTypes}
        onStoreTypesChange={setSelectedStoreTypes}
        activationStatus={activationStatus}
        onActivationStatusChange={setActivationStatus}
        onReset={handleResetFilters}
      />

      {/* Loading state or comparison table view */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <ActivationTable data={filteredData} />
      )}
    </div>
  );
}
