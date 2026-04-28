import { ColumnFilter, ReportData } from "../types";

/**
 * Filter the dynamic dataset based on global search and column-specific filters.
 */
export function filterData(
  data: ReportData[],
  searchTerm: string,
  filters: ColumnFilter[]
): ReportData[] {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

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
