export type FilterOperator = "equals" | "contains" | "not_equals" | "gt" | "lt";

export interface ColumnFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export type AggregationType = "sum" | "count" | "presence" | "average" | "min" | "max";

export type PivotCellValue = number | boolean | string | null;

export interface PivotResult {
  rows: string[];
  columns: string[];
  matrix: Record<string, Record<string, PivotCellValue>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

export interface RegisteredReport {
  id: string;
  name: string;
  url: string;
}

export type ReportData = Record<string, string | number | boolean | null | undefined>;

// --- New TanStack & DND Types ---

export type SortOrder = "asc" | "desc";
export type DateGrouping = "daily" | "monthly" | "yearly";

export interface DraggableField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  aggType?: AggregationType;
  sortOrder?: SortOrder;
  dateGrouping?: DateGrouping;
  filterOperator?: FilterOperator;
  filterValue?: string;
}

export interface PivotZone {
  id: 'rows' | 'columns' | 'values' | 'filters' | 'available';
  fields: DraggableField[];
}

export interface PivotConfig {
  rowFields: DraggableField[];
  columnFields: DraggableField[];
  valueFields: Array<{
    key: string;
    aggType: AggregationType;
  }>;
  filterFields: ColumnFilter[];
  // Persistence fields
  zones?: Record<string, PivotZone>;
  activeFilters?: ColumnFilter[];
  rowSort?: 'asc' | 'desc' | null;
  rowFilters?: string[] | null;
}
