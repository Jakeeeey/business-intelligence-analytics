"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Filters from "./components/Filters";
import ProspectingBiaTable from "./components/ProspectingBiaTable";
import { MultiSelectOption } from "./components/MultiSelect";
import type { CustomerProspect, Salesman, StoreType, ProspectingDataPayload } from "./types";

type GroupedItem = {
  salesmanName: string;
  province: string;
  storeTypeName: string;
  customerName: string;
};

export default function ProspectingBiaModule() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Raw states
  const [prospects, setProspects] = React.useState<CustomerProspect[]>([]);
  const [salesmen, setSalesmen] = React.useState<Salesman[]>([]);
  const [storeTypes, setStoreTypes] = React.useState<StoreType[]>([]);

  // Filter selections
  const [selectedSalesmen, setSelectedSalesmen] = React.useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([]);
  const [selectedStoreTypes, setSelectedStoreTypes] = React.useState<string[]>([]);

  // Load datasets on mount
  React.useEffect(() => {
    async function loadData() {
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
    }

    loadData();
  }, []);

  // Map IDs to Names
  const salesmenMap = React.useMemo(() => {
    return new Map(salesmen.map((s) => [s.id, s.salesman_name]));
  }, [salesmen]);

  const storeTypesMap = React.useMemo(() => {
    return new Map(storeTypes.map((t) => [t.id, t.store_type]));
  }, [storeTypes]);

  // Compute all combinations of Salesman, Province, Store Type, and Customer Name
  const allCombinations = React.useMemo<GroupedItem[]>(() => {
    const list: GroupedItem[] = [];
    const seen = new Set<string>();

    for (const p of prospects) {
      const salesmanName = (p.salesman_id ? salesmenMap.get(p.salesman_id) : null) || "Unknown Salesman";
      const province = (p.province && p.province.trim()) || "Unknown Area";
      const storeTypeName = (p.store_type ? storeTypesMap.get(p.store_type) : null) || "Unknown Store Type";
      const customerName = (p.customer_name && p.customer_name.trim()) || "Unknown Customer";

      const key = `${salesmanName}||${province}||${storeTypeName}||${customerName}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          salesmanName,
          province,
          storeTypeName,
          customerName,
        });
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

      return a.customerName.localeCompare(b.customerName);
    });
  }, [prospects, salesmenMap, storeTypesMap]);

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

  // Filtered combinations
  const filteredData = React.useMemo(() => {
    return allCombinations.filter((item) => {
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
  }, [allCombinations, selectedSalesmen, selectedAreas, selectedStoreTypes]);

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
        <ProspectingBiaTable data={filteredData} />
      )}
    </div>
  );
}
