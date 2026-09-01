"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
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
    }, 500);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative flex-1 w-full">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg pl-8"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

interface GroupedPurchaseTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  unitName?: string;
}

export function GroupedPurchaseTable<TData, TValue>({
  columns,
  data,
  searchKey,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  unitName,
}: GroupedPurchaseTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    monthYear: false, // Ensure monthYear is hidden by default in standard column view
  });
  const [expanded, setExpanded] = React.useState<ExpandedState>({}); // All collapsed by default

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
      sorting: [
        {
          id: "totalReceiptAmount",
          desc: true,
        },
      ],
      pagination: {
        pageSize: 50,
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
        const col = table.getColumn(searchKey);
        if (col) col.setFilterValue(value);
      }
    },
    [table, searchKey],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {searchKey && (() => {
          const formattedKey = searchKey
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .trim()
            .toLowerCase();
          const titleCaseKey = formattedKey.replace(/\b\w/g, c => c.toUpperCase());

          return (
            <div className="max-w-sm w-full">
              <SearchInput
                placeholder={`Search ${titleCaseKey}...`}
                initialValue={
                  (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                }
                isLoading={isLoading}
                onSearch={handleSearchWrapper}
              />
            </div>
          );
        })()}

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide() && column.id !== "monthYear")
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-lg"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {(column.columnDef.meta as { label?: string })?.label ||
                        column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <TableRow key={headerGroup.id} className="bg-muted/10">
                {headerGroup.headers.map((header: Header<TData, unknown>) => {
                  return (
                    <TableHead key={header.id} className="font-bold py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !data?.length ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-3 ">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 bg-muted animate-pulse rounded ${
                            colIndex === 0
                              ? "w-48"
                              : colIndex === columns.length - 1
                              ? "w-8 ml-auto"
                              : "w-24"
                          }`}
                        />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              (() => {
                const rows = table.getRowModel().rows;
                const blocks: { groupRow: Row<TData> | null, leaves: Row<TData>[] }[] = [];
                let currentBlock: { groupRow: Row<TData> | null, leaves: Row<TData>[] } | null = null;
                
                // 1. Bundle groups with their leaf rows
                rows.forEach(row => {
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

                // 2. Sort the blocks strictly chronologically by monthYear
                blocks.sort((a, b) => {
                  if (a.groupRow && b.groupRow) {
                    const valA = a.groupRow.getValue("monthYear") as string;
                    const valB = b.groupRow.getValue("monthYear") as string;
                    const dateA = new Date(valA).getTime();
                    const dateB = new Date(valB).getTime();
                    return dateA - dateB;
                  }
                  return 0;
                });

                // 3. Render the sorted blocks
                return blocks.map(block => {
                  return (
                    <React.Fragment key={block.groupRow ? block.groupRow.id : (block.leaves[0]?.id || Math.random().toString())}>
                      {block.groupRow && (
                        (() => {
                          const row = block.groupRow;
                          const monthName = row.getValue("monthYear") as string;
                          const leafRows = row.getLeafRows();
                          const totalCases = leafRows.reduce((acc, curr) => acc + ((curr.original as any).cases || 0), 0);
                          const totalAmount = leafRows.reduce((acc, curr) => acc + ((curr.original as any).totalReceiptAmount || 0), 0);
                          
                          return (
                            <TableRow
                              key={row.id}
                              className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer font-medium transition-colors"
                              onClick={() => {
                                const isExpanded = row.getIsExpanded();
                                // Collapse all rows first, then toggle this one
                                table.resetExpanded();
                                if (!isExpanded) row.toggleExpanded(true);
                              }}
                            >
                              {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
                                const colId = cell.column.id;
                                
                                if (colId === "receiptNo") {
                                  return (
                                    <TableCell key={cell.id} className="py-3">
                                      <div className="flex items-center gap-2">
                                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${row.getIsExpanded() ? "rotate-90" : ""}`} />
                                        <span className="font-semibold text-base">{monthName}</span>
                                      </div>
                                    </TableCell>
                                  );
                                }
                                
                                if (colId === "cases") {
                                  return (
                                    <TableCell key={cell.id} className="py-3 text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-tight">Total Cases</span>
                                        <span className="tabular-nums font-bold leading-tight text-foreground">{totalCases.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    </TableCell>
                                  );
                                }

                                if (colId === "totalReceiptAmount") {
                                  return (
                                    <TableCell key={cell.id} className="py-3 text-right pr-4">
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-tight">{unitName ? 'Total Quantity' : 'Total Amount'}</span>
                                        <span className="tabular-nums font-bold leading-tight text-foreground">
                                          {unitName ? totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
                                            new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalAmount)}
                                        </span>
                                      </div>
                                    </TableCell>
                                  );
                                }

                                return <TableCell key={cell.id} className="py-3" />;
                              })}
                            </TableRow>
                          );
                        })()
                      )}
                      
                      {block.leaves.map((row: Row<TData>) => (
                        <TableRow
                          key={row.id}
                          className="group hover:bg-primary/5 transition-colors animate-in fade-in-0 slide-in-from-top-1 duration-200"
                        >
                          {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                            <TableCell key={cell.id} className="py-3">
                              {cell.getIsAggregated()
                                ? null
                                : cell.getIsPlaceholder()
                                ? null
                                : flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                });
              })()
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center border-none hover:bg-transparent"
                >
                  <EmptyPlaceholder
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground font-medium">
          {table.getFilteredRowModel().rows.length} total rows
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              className="h-8 w-[70px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
