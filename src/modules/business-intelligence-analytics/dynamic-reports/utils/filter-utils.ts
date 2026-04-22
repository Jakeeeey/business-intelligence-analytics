export type FilterOperator = "equals" | "contains" | "not_equals" | "gt" | "lt";

export interface ColumnFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

/**
 * Filter the dynamic dataset based on global search and column-specific filters.
 */
export function filterData(
  data: any[],
  searchTerm: string,
  filters: ColumnFilter[]
): any[] {
  if (!data || data.length === 0) return [];

  return data.filter((item) => {
    // 1. Global Search Check
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = Object.values(item).some((val) => 
        String(val ?? "").toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // 2. Column-specific Filters Check (Logical AND)
    return filters.every((f) => {
      const itemValue = item[f.column];
      const filterValue = f.value;

      if (itemValue === undefined || itemValue === null) return false;

      const itemStr = String(itemValue).toLowerCase();
      const filterStr = String(filterValue).toLowerCase();
      const itemNum = Number(itemValue);
      const filterNum = Number(filterValue);

      switch (f.operator) {
        case "equals":
          return itemStr === filterStr;
        case "contains":
          return itemStr.includes(filterStr);
        case "not_equals":
          return itemStr !== filterStr;
        case "gt":
          return !isNaN(itemNum) && !isNaN(filterNum) && itemNum > filterNum;
        case "lt":
          return !isNaN(itemNum) && !isNaN(filterNum) && itemNum < filterNum;
        default:
          return true;
      }
    });
  });
}

/**
 * Persistence keys for local storage
 */
export const FILTER_STORAGE_KEY = "bia_dynamic_filters";
export const SEARCH_STORAGE_KEY = "bia_dynamic_search";

export function saveFiltersToLocal(filters: ColumnFilter[], searchTerm: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  localStorage.setItem(SEARCH_STORAGE_KEY, searchTerm);
}

export function loadFiltersFromLocal(): { filters: ColumnFilter[]; searchTerm: string } {
  if (typeof window === "undefined") return { filters: [], searchTerm: "" };
  const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
  const savedSearch = localStorage.getItem(SEARCH_STORAGE_KEY);
  return {
    filters: savedFilters ? JSON.parse(savedFilters) : [],
    searchTerm: savedSearch || "",
  };
}
