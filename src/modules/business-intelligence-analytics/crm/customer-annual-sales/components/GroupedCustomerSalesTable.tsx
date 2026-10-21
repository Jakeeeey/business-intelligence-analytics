"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
  ExpandedState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  Search,
  Settings2,
} from "lucide-react";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";

interface SearchInputProps {
  placeholder: string;
  initialValue: string;
  onSearch: (value: string) => void;
  isLoading?: boolean;
}

function SearchInput({
  placeholder,
  initialValue,
  onSearch,
  isLoading = false,
}: SearchInputProps) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSearch(value);
    }, 400);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative flex-1 w-full">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg pl-8.5 h-9 text-xs"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

interface GroupedCustomerSalesTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  unitName?: string;
  type?: "sales" | "returns";
}

export function GroupedCustomerSalesTable<TData, TValue>({
  columns,
  data,
  searchKey = "productName",
  isLoading = false,
  emptyTitle = "No data available",
  emptyDescription = "No records found matching your filter criteria.",
  type = "sales",
}: GroupedCustomerSalesTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    monthYear: false,
  });
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    paginateExpandedRows: false,
    autoResetExpanded: false,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    initialState: {
      grouping: ["monthYear"],
      pagination: {
        pageSize: 10000,
      },
    },
    state: {
      columnFilters,
      columnVisibility,
      expanded,
    },
  });

  const handleSearchWrapper = React.useCallback(
    (value: string) => {
      if (searchKey) {
        table.getColumn(searchKey)?.setFilterValue(value);
      }
    },
    [table, searchKey]
  );

  const isReturns = type === "returns";

  return (
    <div className="space-y-4">
      {/* Search and Column View Menu */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {searchKey && (
          <div className="max-w-xs w-full">
            <SearchInput
              placeholder={`Search ${searchKey === "productName" ? "product / SKU" : searchKey}...`}
              initialValue={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              isLoading={isLoading}
              onSearch={handleSearchWrapper}
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Settings2 className="h-3.5 w-3.5" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide() && column.id !== "monthYear")
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-xs rounded-md"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {(column.columnDef.meta as { label?: string })?.label ||
                      column.id.replace(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table with Month Accordion Rows */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <TableRow key={headerGroup.id} className="bg-muted/40">
                {headerGroup.headers.map((header: Header<TData, unknown>) => (
                  <TableHead key={header.id} className="font-semibold text-xs py-2.5">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !data?.length ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx} className="hover:bg-transparent">
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx} className="py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              (() => {
                const rows = table.getRowModel().rows;
                const blocks: { groupRow: Row<TData> | null; leaves: Row<TData>[] }[] = [];
                let currentBlock: { groupRow: Row<TData> | null; leaves: Row<TData>[] } | null = null;

                rows.forEach((row) => {
                  if (row.getIsGrouped()) {
                    currentBlock = { groupRow: row, leaves: [] };
                    blocks.push(currentBlock);
                  } else {
                    if (currentBlock) {
                      currentBlock.leaves.push(row);
                    } else {
                      blocks.push({ groupRow: null, leaves: [row] });
                    }
                  }
                });

                return blocks.map((block) => (
                  <React.Fragment
                    key={
                      block.groupRow
                        ? block.groupRow.id
                        : block.leaves[0]?.id || Math.random().toString()
                    }
                  >
                    {block.groupRow &&
                      (() => {
                        const row = block.groupRow;
                        const monthName = row.getValue("monthYear") as string;
                        const leafRows = row.getLeafRows();

                        const totalCases = leafRows.reduce((acc, curr) => {
                          const item = curr.original as Record<string, number>;
                          return acc + (item.cases || 0);
                        }, 0);

                        const totalPieces = leafRows.reduce((acc, curr) => {
                          const item = curr.original as Record<string, number>;
                          return acc + (item.pieces || 0);
                        }, 0);

                        const totalAmount = leafRows.reduce((acc, curr) => {
                          const item = curr.original as Record<string, number>;
                          return acc + (isReturns ? item.returnedAmount || 0 : item.soldAmount || 0);
                        }, 0);

                        return (
                          <TableRow
                            key={row.id}
                            className={`cursor-pointer font-medium transition-colors border-y ${
                              isReturns
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15"
                                : "bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                            onClick={() => {
                              const isExp = row.getIsExpanded();
                              table.resetExpanded();
                              if (!isExp) row.toggleExpanded(true);
                            }}
                          >
                            {row.getVisibleCells().map((cell: Cell<TData, unknown>, cellIndex: number) => {
                              const colId = cell.column.id;
                              const isFirstVisible = cellIndex === 0;

                              if (colId === "supplierName" || colId === "customerName" || isFirstVisible) {
                                return (
                                  <TableCell key={cell.id} className="py-2.5">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight
                                        className={`h-4 w-4 transition-transform duration-200 ${
                                          row.getIsExpanded() ? "rotate-90" : ""
                                        }`}
                                      />
                                      <span className="font-bold text-sm tracking-tight text-foreground">
                                        {monthName}
                                      </span>
                                      <span className="text-[11px] font-normal text-muted-foreground ml-1">
                                        ({leafRows.length} {leafRows.length === 1 ? "item" : "items"})
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              if (colId === "cases") {
                                return (
                                  <TableCell key={cell.id} className="py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                                        Total Cases
                                      </span>
                                      <span className="tabular-nums font-bold text-xs text-foreground">
                                        {totalCases.toLocaleString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              if (colId === "pieces") {
                                return (
                                  <TableCell key={cell.id} className="py-2.5 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                                        Total Pieces
                                      </span>
                                      <span className="tabular-nums font-bold text-xs text-foreground">
                                        {totalPieces.toLocaleString()}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              if (colId === "soldAmount" || colId === "returnedAmount") {
                                return (
                                  <TableCell key={cell.id} className="py-2.5 text-right pr-4">
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                                        Total Amount
                                      </span>
                                      <span
                                        className={`tabular-nums font-bold text-xs ${
                                          isReturns
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-emerald-600 dark:text-emerald-400"
                                        }`}
                                      >
                                        {new Intl.NumberFormat("en-PH", {
                                          style: "currency",
                                          currency: "PHP",
                                        }).format(totalAmount)}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              }

                              return <TableCell key={cell.id} className="py-2.5" />;
                            })}
                          </TableRow>
                        );
                      })()}

                    {/* Child / Leaf Rows shown when Accordion is expanded */}
                    {block.leaves.map((row: Row<TData>) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-muted/40 transition-colors animate-in fade-in-0 slide-in-from-top-1 duration-150"
                      >
                        {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                          <TableCell key={cell.id} className="py-2 text-xs">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ));
              })()
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyPlaceholder
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={Search}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
