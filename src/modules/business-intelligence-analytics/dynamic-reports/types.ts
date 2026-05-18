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
export type DateGrouping = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface DraggableField {
  id: string;
  sourceId?: string;
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
    id: string; // The unique ID of the field (can be a clone ID)
    key: string; // The data key (sourceId || id)
    aggType: AggregationType;
    name: string; // The display name
  }>;
  filterFields: ColumnFilter[];
  // Excel-style Toggles
  showGrandTotals?: boolean;
  showSubtotals?: boolean;
  // Persistence fields
  zones?: Record<string, PivotZone>;
  activeFilters?: ColumnFilter[];
  rowSort?: 'asc' | 'desc' | null;
  rowFilters?: string[] | null;
}
