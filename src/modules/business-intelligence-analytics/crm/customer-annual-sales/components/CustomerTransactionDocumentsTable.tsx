"use client";

import React, { useMemo, useState } from "react";
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
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from "@tanstack/react-table";
import { CustomerAnnualSaleItem } from "../types/customer-annual-sales.schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Download,
  RotateCcw,
  Search,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyPlaceholder } from "@/components/shared/EmptyPlaceholder";
import { DateRange } from "react-day-picker";
import { DeliveredDateRangePicker } from "./DeliveredDateRangePicker";

interface CustomerTransactionDocumentsTableProps {
  items: CustomerAnnualSaleItem[];
  isLoading: boolean;
}

export interface ConsolidatedTransactionDoc {
  key: string;
  poNos: string;
  soNos: string;
  pdpNos: string;
  cldtoNos: string;
  siNo: string;
  dpNos: string;
  deliveredDates: string;
  dateTimestamps: number[];
  dateIsoList: string[];
}

const toIsoDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const extractIsoDate = (raw?: string | null): string | null => {
  if (!raw) return null;
  const match = raw.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (match) return match[0];
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return toIsoDateString(d);
  } catch {
    return null;
  }
  return null;
};

export function CustomerTransactionDocumentsTable({
  items,
  isLoading,
}: CustomerTransactionDocumentsTableProps) {
  "use no memo";
  const [searchFilter, setSearchFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Group and consolidate by SI (siNo)
  const consolidatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const map = new Map<
      string,
      {
        siNo: string;
        poSet: Set<string>;
        soSet: Set<string>;
        pdpSet: Set<string>;
        cldtoSet: Set<string>;
        dpSet: Set<string>;
        dateSet: Set<string>;
        timestamps: number[];
        isoDates: string[];
      }
    >();

    const splitAndAdd = (targetSet: Set<string>, val?: string | null) => {
      if (!val) return;
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => targetSet.add(s));
    };

    items.forEach((it) => {
      // Only include SALE transactions, exclude any sales returns
      if (it.rowType && it.rowType.toUpperCase() !== "SALE") return;
      if (Boolean(it.returnNo) || Boolean(it.returnDate)) return;
      if ((it.returnedAmount ?? 0) > 0 && (it.soldAmount ?? 0) === 0) return;

      const siKey =
        it.siNo?.trim() ||
        it.soNo?.trim() ||
        it.poNo?.trim() ||
        "NO_SI";

      if (!map.has(siKey)) {
        map.set(siKey, {
          siNo: it.siNo?.trim() || "",
          poSet: new Set<string>(),
          soSet: new Set<string>(),
          pdpSet: new Set<string>(),
          cldtoSet: new Set<string>(),
          dpSet: new Set<string>(),
          dateSet: new Set<string>(),
          timestamps: [],
          isoDates: [],
        });
      }

      const entry = map.get(siKey)!;
      if (!entry.siNo && it.siNo?.trim()) {
        entry.siNo = it.siNo.trim();
      }

      splitAndAdd(entry.poSet, it.poNo);
      splitAndAdd(entry.soSet, it.soNo);
      splitAndAdd(entry.pdpSet, it.pdpNos);
      splitAndAdd(entry.cldtoSet, it.cldtoNos);
      splitAndAdd(entry.dpSet, it.dpNos);

      const rawDate = it.deliveredDate;
      if (rawDate) {
        const iso = extractIsoDate(rawDate);
        if (iso) {
          entry.isoDates.push(iso);
        }
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            entry.timestamps.push(d.getTime());
            const formatted = d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });
            entry.dateSet.add(formatted);
          } else {
            entry.dateSet.add(rawDate);
          }
        } catch {
          entry.dateSet.add(rawDate);
        }
      }
    });

    const result: ConsolidatedTransactionDoc[] = [];
    map.forEach((entry, key) => {
      result.push({
        key,
        poNos: Array.from(entry.poSet).join(", ") || "—",
        soNos: Array.from(entry.soSet).join(", ") || "—",
        pdpNos: Array.from(entry.pdpSet).join(", ") || "—",
        cldtoNos: Array.from(entry.cldtoSet).join(", ") || "—",
        siNo: entry.siNo || "—",
        dpNos: Array.from(entry.dpSet).join(", ") || "—",
        deliveredDates: Array.from(entry.dateSet).join(", ") || "—",
        dateTimestamps: entry.timestamps,
        dateIsoList: entry.isoDates,
      });
    });

    return result;
  }, [items]);

  const columns: ColumnDef<ConsolidatedTransactionDoc>[] = useMemo(
    () => [
      {
        accessorKey: "poNos",
        header: "PO",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs font-semibold text-foreground truncate max-w-[150px] block"
            title={row.original.poNos}
          >
            {row.original.poNos}
          </span>
        ),
      },
      {
        accessorKey: "soNos",
        header: "SO",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs font-semibold text-primary truncate max-w-[160px] block"
            title={row.original.soNos}
          >
            {row.original.soNos}
          </span>
        ),
      },
      {
        accessorKey: "pdpNos",
        header: "PDP",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs text-muted-foreground truncate max-w-[150px] block"
            title={row.original.pdpNos}
          >
            {row.original.pdpNos}
          </span>
        ),
      },
      {
        accessorKey: "cldtoNos",
        header: "CLDTO",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs text-muted-foreground truncate max-w-[160px] block"
            title={row.original.cldtoNos}
          >
            {row.original.cldtoNos}
          </span>
        ),
      },
      {
        accessorKey: "siNo",
        header: "SI",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.original.siNo}
          </span>
        ),
      },
      {
        accessorKey: "dpNos",
        header: "DP",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs text-muted-foreground truncate max-w-[150px] block"
            title={row.original.dpNos}
          >
            {row.original.dpNos}
          </span>
        ),
      },
      {
        accessorKey: "deliveredDates",
        header: "Delivered Date",
        cell: ({ row }) => (
          <span
            className="text-xs text-foreground font-medium truncate max-w-[160px] block"
            title={row.original.deliveredDates}
          >
            {row.original.deliveredDates}
          </span>
        ),
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    let result = consolidatedItems;

    // Filter by delivered date range using timezone-safe ISO string comparison
    if (dateRange?.from) {
      const fromStr = toIsoDateString(dateRange.from);
      const toStr = dateRange.to ? toIsoDateString(dateRange.to) : fromStr;

      result = result.filter((it) => {
        if (!it.dateIsoList || it.dateIsoList.length === 0) return false;
        return it.dateIsoList.some((iso) => iso >= fromStr && iso <= toStr);
      });
    }

    if (!searchFilter.trim()) return result;
    const q = searchFilter.toLowerCase().trim();
    return result.filter(
      (it) =>
        it.siNo.toLowerCase().includes(q) ||
        it.poNos.toLowerCase().includes(q) ||
        it.soNos.toLowerCase().includes(q) ||
        it.pdpNos.toLowerCase().includes(q) ||
        it.cldtoNos.toLowerCase().includes(q) ||
        it.dpNos.toLowerCase().includes(q) ||
        it.deliveredDates.toLowerCase().includes(q)
    );
  }, [consolidatedItems, searchFilter, dateRange]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredItems,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleExportCSV = () => {
    const headers = [
      "PO",
      "SO",
      "PDP",
      "CLDTO",
      "SI",
      "DP",
      "Delivered Date",
    ];

    const escapeCsv = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;

    const rows = filteredItems.map((r) => [
      escapeCsv(r.poNos),
      escapeCsv(r.soNos),
      escapeCsv(r.pdpNos),
      escapeCsv(r.cldtoNos),
      escapeCsv(r.siNo),
      escapeCsv(r.dpNos),
      escapeCsv(r.deliveredDates),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction-documents-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden mt-6 mb-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Transaction Documents
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              PO, SO, PDP, CLDTO, SI, DP, and Delivery records ({filteredItems.length} unique SI records)
            </CardDescription>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isLoading || filteredItems.length === 0}
          className="h-8 text-xs font-medium flex items-center gap-1.5 border-border bg-background hover:bg-accent self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO, SO, PDP, CLDTO, SI, DP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded-lg pl-8.5 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <DeliveredDateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
            />
            {(dateRange?.from || searchFilter.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange(undefined);
                  setSearchFilter("");
                }}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                title="Clear all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Filter</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs ml-auto">
                  <Settings2 className="mr-2 h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<ConsolidatedTransactionDoc>) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header: Header<ConsolidatedTransactionDoc, unknown>) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading records...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<ConsolidatedTransactionDoc>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors border-b border-border/60"
                  >
                    {row.getVisibleCells().map((cell: Cell<ConsolidatedTransactionDoc, unknown>) => (
                      <TableCell key={cell.id} className="py-2.5 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <EmptyPlaceholder
                      title="No Transaction Documents"
                      description="No document records found matching the current filters."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
          <div className="flex-1 text-xs text-muted-foreground font-medium">
            {table.getFilteredRowModel().rows.length} record(s) found.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="text-xs font-medium text-muted-foreground">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-xs font-medium text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
