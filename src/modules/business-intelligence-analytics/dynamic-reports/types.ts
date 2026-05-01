export type FilterOperator = "equals" | "contains" | "not_equals" | "gt" | "lt";

export interface ColumnFilter {
  id: string;
  sourceId: string;
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
  id: string; // Unique ID for DND (e.g., 'val_INVOICE_DATE_123')
  sourceId?: string; // The actual data column name (e.g., 'INVOICE_DATE')
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
    key: string; // The unique ID of the field
    sourceId?: string; // The original data column name
    aggType: AggregationType;
  }>;
  filterFields: ColumnFilter[];
  // Persistence fields
  zones?: Record<string, PivotZone>;
  activeFilters?: ColumnFilter[];
  rowSort?: 'asc' | 'desc' | null;
  rowFilters?: string[] | null;
}
