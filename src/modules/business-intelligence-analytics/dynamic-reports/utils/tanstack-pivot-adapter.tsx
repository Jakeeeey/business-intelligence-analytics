import { 
  createColumnHelper, 
  ColumnDef,
  AggregationFn,
} from "@tanstack/react-table";
import { ReportData, PivotConfig, DateGrouping } from "../types";
import { RowLabelFilter } from "../components/RowLabelFilter";
import { ChevronsUpDown, ChevronsDownUp } from "lucide-react";

const formatHeader = (key: string) => {
  if (!key) return "";
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.toUpperCase())
    .join(' ')
    .trim()
    .toUpperCase();
};

/** Standard column width for all value columns (consistent layout) */
const VALUE_COL_SIZE = 160;
const VALUE_COL_MIN = 100;

/**
 * Excel-standard date formatting based on grouping type
 */
export const formatDateValue = (value: unknown, grouping?: DateGrouping): string => {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return String(value);

  switch (grouping) {
    case 'weekly': {
      // Calculate ISO week number and year
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    }
    case 'monthly':
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    case 'quarterly': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    }
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return date.toISOString().split('T')[0];
  }
};

/**
 * Excel-standard number formatting (2 decimal places + commas)
 */
const formatNumber = (val: unknown): string => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Utility to generate TanStack Table column definitions for a TRUE PIVOT matrix.
 */
export function createPivotColumns(
  config: PivotConfig, 
  data: ReportData[] = [],
  handlers?: {
    onSort: (order: 'asc' | 'desc') => void;
    onFilter: (values: string[]) => void;
  }
): ColumnDef<ReportData, unknown>[] {
  const columnHelper = createColumnHelper<ReportData>();

  // Helper to estimate width based on content
  const getEstimatedWidth = (header: string, accessor: string) => {
    const charWidth = 7.5;
    const padding = 64; 
    let maxChars = header.length;
    data.forEach(row => {
      const val = String(row[accessor as keyof ReportData] || "");
      if (val.length > maxChars) maxChars = val.length;
    });
    return Math.min(Math.max(maxChars * charWidth + padding, 120), 600);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 1. CONSOLIDATED ROW COLUMN (Excel Compact Form Standard)
  // ═══════════════════════════════════════════════════════════════════
  const treeColumn = columnHelper.accessor((row) => row, {
    id: "rowLabels",
    header: ({ table }) => {
      const isAllExpanded = table.getIsAllRowsExpanded();
      const hasExpandableRows = config.rowFields.length > 1;

      return (
        <div className="flex items-center w-full pr-1 gap-1">
          {hasExpandableRows && (
            <button
              onClick={table.getToggleAllRowsExpandedHandler()}
              className="shrink-0 p-1 rounded-md hover:bg-slate-200/50 text-slate-500 transition-colors"
              title={isAllExpanded ? "Collapse All" : "Expand All"}
            >
              {isAllExpanded ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <span className="font-bold uppercase tracking-tight truncate flex-1">
            ROW LABELS
          </span>
          <RowLabelFilter 
            data={data}
            config={config}
            onSortChange={(order) => handlers?.onSort(order)}
            onFilterChange={(values) => handlers?.onFilter(values)}
            selectedValues={(table.options.meta as { rowFilters?: string[] | null })?.rowFilters || null}
          />
        </div>
      );
    },
    size: 300,
    minSize: 200,
    cell: (info) => {
      const row = info.row;
      const cellValue = row.getIsGrouped() 
        ? row.getValue(row.groupingColumnId!) 
        : row.getVisibleCells().find(c => config.rowFields.some(f => f.id === c.column.id))?.getValue();
      
      return String(cellValue ?? "");
    },
  });

  // 1b. HIDDEN DATA COLUMNS (Required for Grouping to work)
  const hiddenRowColumns = config.rowFields.map(field => 
    columnHelper.accessor((row) => {
      const sourceKey = field.sourceId || field.id;
      const val = row[sourceKey as keyof ReportData];
      if (field.type === 'date') {
        return formatDateValue(val, field.dateGrouping);
      }
      return val;
    }, {
      id: field.id,
      header: formatHeader(field.id),
      enableGrouping: true,
    })
  );

  const rowColumns = [treeColumn, ...hiddenRowColumns];

  // 2. COLUMN FIELDS (Horizontal Axis / Cross-Tabulation)
  // ═══════════════════════════════════════════════════════════════════
  let matrixColumns: ColumnDef<ReportData, unknown>[] = [];

  if (config.columnFields.length > 0 && data.length > 0) {
    const colField = config.columnFields[0];
    
    // Extract unique values with date grouping support
    const uniqueColValues = Array.from(new Set(data.map(d => {
      const sourceKey = colField.sourceId || colField.id;
      const val = d[sourceKey as keyof ReportData];
      return colField.type === 'date' ? formatDateValue(val, colField.dateGrouping) : String(val ?? 'N/A');
    }))).sort();

    matrixColumns = uniqueColValues.map(val => {
      return columnHelper.group({
        id: `col_${val}`,
        header: () => (
          <div className="text-center font-bold uppercase tracking-tight text-[10px] bg-slate-800/20 py-1 px-2 rounded mx-1 whitespace-nowrap">
            {val}
          </div>
        ),
        columns: config.valueFields.map(vField => 
          columnHelper.accessor(
            (row: ReportData) => {
              const colSourceKey = colField.sourceId || colField.id;
              const rawVal = row[colSourceKey as keyof ReportData];
              const formattedColVal = colField.type === 'date' 
                ? formatDateValue(rawVal, colField.dateGrouping) 
                : String(rawVal ?? 'N/A');

              if (formattedColVal === val) {
                const valSourceKey = vField.sourceId || vField.key;
                const numVal = Number(row[valSourceKey as keyof ReportData]);
                return isNaN(numVal) ? undefined : numVal;
              }
              return undefined;
            }, 
            {
              id: `${val}_${vField.key}_${vField.aggType}`,
              header: () => (
                <span className="text-[9px] opacity-60 font-bold whitespace-nowrap block text-right">
                  {formatHeader(vField.key)} ({vField.aggType.toUpperCase()})
                </span>
              ),
              size: VALUE_COL_SIZE,
              minSize: VALUE_COL_MIN,
              cell: (info) => (
                <span className="block text-right w-full tabular-nums opacity-30">
                  {formatNumber(info.getValue())}
                </span>
              ),
              aggregatedCell: (info) => (
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-right w-full tabular-nums">
                  {formatNumber(info.getValue())}
                </span>
              ),
              aggregationFn: vField.aggType as unknown as AggregationFn<ReportData>,
              footer: (info) => {
                const rows = info.table.getFilteredRowModel().rows;
                const values = rows.map(r => r.getValue(info.column.id) as number).filter(v => typeof v === 'number');
                const total = values.reduce((acc, v) => acc + v, 0);
                return (
                  <span className="font-black text-slate-900 dark:text-slate-50 block text-right w-full tabular-nums text-sm">
                    {formatNumber(total)}
                  </span>
                );
              },
            }
          )
        )
      });
    });

    // ═══════════════════════════════════════════════════════════════════
    // HORIZONTAL GRAND TOTAL
    // ═══════════════════════════════════════════════════════════════════
    const grandTotalGroup = columnHelper.group({
      id: "horizontal_grand_total",
      header: () => (
        <div className="text-center font-black uppercase tracking-tight text-[10px] bg-slate-900 text-slate-100 py-1 px-2 rounded mx-1 whitespace-nowrap">
          GRAND TOTAL
        </div>
      ),
      columns: config.valueFields.map(vField => 
        columnHelper.accessor((row) => row[ (vField.sourceId || vField.key) as keyof ReportData ], {
          id: `gt_${vField.key}_${vField.aggType}`,
          header: () => (
            <span className="text-[9px] opacity-60 font-bold whitespace-nowrap block text-right">
              {formatHeader(vField.key)} ({vField.aggType.toUpperCase()})
            </span>
          ),
          size: VALUE_COL_SIZE,
          minSize: VALUE_COL_MIN,
          aggregationFn: vField.aggType as unknown as AggregationFn<ReportData>,
          cell: (info) => (
            <span className="block text-right w-full tabular-nums opacity-30">
              {formatNumber(info.getValue())}
            </span>
          ),
          aggregatedCell: (info) => (
            <span className="font-black text-emerald-700 dark:text-emerald-400 block text-right w-full tabular-nums">
              {formatNumber(info.getValue())}
            </span>
          ),
          footer: (info) => {
            const table = info.table;
            const { rows } = table.getGroupedRowModel();
            const values = rows.map(r => r.getValue(info.column.id) as number).filter(v => typeof v === 'number');
            const total = values.reduce((acc, v) => acc + v, 0);
            return (
              <span className="font-black text-emerald-400 block text-right w-full tabular-nums">
                {formatNumber(total)}
              </span>
            );
          },
        })
      )
    });

    matrixColumns.push(grandTotalGroup);
  } else {
    // ═══════════════════════════════════════════════════════════════════
    // NO COLUMN FIELDS — Show metrics directly
    // ═══════════════════════════════════════════════════════════════════
    matrixColumns = config.valueFields.map(vField => 
      columnHelper.accessor((row) => row[ (vField.sourceId || vField.key) as keyof ReportData ], {
        id: `${vField.key}_${vField.aggType}`,
        header: () => (
          <span className="font-bold uppercase tracking-tight text-[10px] whitespace-nowrap block text-right">
            {formatHeader(vField.key)} ({vField.aggType.toUpperCase()})
          </span>
        ),
        size: getEstimatedWidth(`${formatHeader(vField.key)} (${vField.aggType})`, vField.sourceId || vField.key),
        minSize: VALUE_COL_MIN,
        aggregationFn: vField.aggType as unknown as AggregationFn<ReportData>,
        footer: (info) => {
          const table = info.table;
          const { rows } = table.getGroupedRowModel();
          const values = rows.map(r => r.getValue(info.column.id) as number).filter(v => typeof v === 'number');
          const total = values.reduce((acc, v) => acc + v, 0);
          return (
            <span className="font-black text-slate-900 dark:text-slate-50 block text-right w-full tabular-nums text-sm">
              {formatNumber(total)}
            </span>
          );
        },
        cell: (info) => (
          <span className="block w-full text-right tabular-nums opacity-40">
            {formatNumber(info.getValue())}
          </span>
        ),
        aggregatedCell: (info) => (
          <span className="font-bold text-slate-900 dark:text-slate-100 block w-full text-right tabular-nums">
            {formatNumber(info.getValue())}
          </span>
        )
      })
    ) as unknown as ColumnDef<ReportData, unknown>[];
  }

  return [...rowColumns, ...matrixColumns] as ColumnDef<ReportData, unknown>[];
}

export const pivotAggregationFns: Record<string, AggregationFn<ReportData>> = {
  presence: (_columnId, leafRows) => leafRows.length > 0,
  average: (columnId, leafRows) => {
    if (leafRows.length === 0) return 0;
    const sum = leafRows.reduce((acc, row) => acc + (Number(row.getValue(columnId)) || 0), 0);
    return sum / leafRows.length;
  }
};
