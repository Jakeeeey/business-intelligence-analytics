"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ChevronDown, ChevronRight, Search } from "lucide-react";
import { formatCurrency, formatDateLong } from "@/lib/utils";
import type { DisbursementSummary } from "../type";
import { Toggle } from "@/components/ui/toggle";
// import { Switch } from "radix-ui";

type ExpenseTableProps = {
  data: {
    coaTitle: string;
    total: number;
    records: DisbursementSummary[];
    recordCount?: number; // Unique document count for division grouping
  }[];
};

type SortKey =
  | "docNo"
  | "transactionDate"
  | "payeeName"
  | "totalAmount"
  | "status"
  | "divisionName"
  | "lineRemarks";
type SortDir = "asc" | "desc";
type GroupBy = "coa" | "division";

// Helper function to get deduplicated paid amount by docNo
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUniquePaidAmount = (records: DisbursementSummary[]): number => {
  const docNoMap = new Map<string, number>();
  records.forEach((record) => {
    if (!docNoMap.has(record.docNo)) {
      docNoMap.set(record.docNo, record.paidAmount || 0);
    }
  });
  return Array.from(docNoMap.values()).reduce((sum, val) => sum + val, 0);
};

// Helper function to get total amount sum from records
const getTotalAmount = (records: DisbursementSummary[]): number => {
  return records.reduce((sum, r) => sum + r.totalAmount, 0);
};

export default function ExpenseTable({ data }: ExpenseTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortKey] = React.useState<SortKey>("transactionDate");
  const [sortDir] = React.useState<SortDir>("desc");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("coa");
  const [showDocsWithBalanceOnly, setShowDocsWithBalanceOnly] =
    React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(),
  );
  // Pagination state per group: Map<groupTitle, { page, pageSize }>
  const [groupPagination, setGroupPagination] = React.useState<
    Map<string, { page: number; pageSize: number }>
  >(new Map());

  // Per-group sorting state to avoid global re-sorts when sorting a single expanded group

  const [groupSorts, setGroupSorts] = React.useState<
    Map<string, { sortKey: SortKey; sortDir: SortDir }>
  >(new Map());

  // Per-COA (within-division) sorting state: key = `${groupTitle}||${coaTitle}`
  const [coaSorts, setCoaSorts] = React.useState<
    Map<string, { sortKey: SortKey; sortDir: SortDir }>
  >(new Map());

  // Expanded COA subsections state: key = `${groupTitle}||${coaTitle}`
  const [expandedCoas, setExpandedCoas] = React.useState<Set<string>>(
    new Set(),
  );

  // Per-document expanded state: key = `${groupTitle}||${docNo}`
  const [expandedDocs, setExpandedDocs] = React.useState<Set<string>>(
    new Set(),
  );

  // Per-COA pagination state: key = `${groupTitle}||${coaTitle}`
  const [coaPagination, setCoaPagination] = React.useState<
    Map<string, { page: number; pageSize: number }>
  >(new Map());

  // COA list sorting state (for when groupBy="division"): key = groupTitle
  const [coaListSorts, setCoaListSorts] = React.useState<
    Map<string, { sortKey: "coaTitle" | "totalAmount"; sortDir: SortDir }>
  >(new Map());

  // Regroup by division if needed
  const groupedData = React.useMemo(() => {
    if (groupBy === "coa") {
      return data;
    }

    // Regroup by division with deduplication
    const divisionMap = new Map<string, DisbursementSummary[]>();
    data.forEach((group) => {
      group.records.forEach((record) => {
        if (!divisionMap.has(record.divisionName)) {
          divisionMap.set(record.divisionName, []);
        }
        divisionMap.get(record.divisionName)!.push(record);
      });
    });

    return Array.from(divisionMap.entries())
      .map(([divisionName, records]) => {
        // Deduplicate by disbursementId within each division
        const uniqueDocs = new Map<number, DisbursementSummary>();
        records.forEach((record) => {
          if (!uniqueDocs.has(record.disbursementId)) {
            uniqueDocs.set(record.disbursementId, record);
          }
        });
        const uniqueDocArray = Array.from(uniqueDocs.values());

        return {
          coaTitle: divisionName,
          total: getTotalAmount(uniqueDocArray), // Sum only unique documents
          recordCount: uniqueDocArray.length, // Store unique document count
          records,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [data, groupBy]);

  // Filter, sort, and (optionally) dedupe across COAs when showing balances
  const processedData = React.useMemo(() => {
    const mapped = groupedData.map((group) => {
      let filtered = group.records;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.trim().toLowerCase();
        filtered = filtered.filter((r) => {
          const headerText = [
            r.disbursementId,
            r.docNo,
            r.payeeName,
            r.divisionName,
            r.coaTitle,
            r.lineRemarks,
            r.status,
            r.transactionDate,
            r.totalAmount,
            r.paidAmount,
            r.balance,
            r.encoderName,
          ]
            .map((v) => String(v ?? ""))
            .join(" ")
            .toLowerCase();

          const lineText = (r.lines ?? [])
            .map((line) =>
              [
                line.lineId,
                line.lineRemarks,
                line.coaTitle,
                line.referenceNo,
                line.lineAmount,
                line.lineDate,
                line.lineType,
                line.bankName,
                line.checkNo,
              ]
                .map((v) => String(v ?? ""))
                .join(" "),
            )
            .join(" ")
            .toLowerCase();

          return `${headerText} ${lineText}`.includes(search);
        });
      }

      // Filter to only show documents with outstanding balance when enabled
      if (showDocsWithBalanceOnly) {
        filtered = filtered.filter((r) => {
          const balance =
            typeof r.balance === "number"
              ? r.balance
              : r.totalAmount - (r.paidAmount ?? 0);
          // Round to 2 decimal places to avoid floating-point precision issues
          const rounded = Math.round(balance * 100) / 100;
          return rounded > 0;
        });
      }

      // Sort (use per-group sort if present to avoid re-sorting other groups)
      const gSort = groupSorts.get(group.coaTitle);
      const usedSortKey = gSort?.sortKey ?? sortKey;
      const usedSortDir = gSort?.sortDir ?? sortDir;

      const sorted = [...filtered].sort((a, b) => {
        const aVal = a[usedSortKey];
        const bVal = b[usedSortKey];

        if (usedSortKey === "totalAmount") {
          const aNum = typeof aVal === "number" ? aVal : 0;
          const bNum = typeof bVal === "number" ? bVal : 0;
          return usedSortDir === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return usedSortDir === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });

      return {
        ...group,
        records: sorted,
      };
    });

    // When balance-only view is active, deduplicate documents across groups so a
    // disbursement appears only once in the whole table. Use line-based totals
    // for recalculating group totals to avoid double-counting.
    if (showDocsWithBalanceOnly) {
      const seen = new Set<number>();

      const getRecordLineTotal = (r: DisbursementSummary) =>
        typeof r.coaLineTotal === "number"
          ? r.coaLineTotal
          : (r.lines || []).reduce((s, ln) => s + (ln.lineAmount || 0), 0);

      const deduped = mapped
        .map((g) => {
          const newRecords = g.records.filter((r) => {
            if (seen.has(r.disbursementId)) return false;
            seen.add(r.disbursementId);
            return true;
          });

          const newTotal = newRecords.reduce(
            (s, r) => s + getRecordLineTotal(r),
            0,
          );

          return {
            ...g,
            records: newRecords,
            total: newTotal,
            recordCount: newRecords.length,
          };
        })
        .filter((g) => g.records.length > 0);

      // Re-sort groups by recalculated totals
      deduped.sort((a, b) => b.total - a.total);
      return deduped;
    }

    return mapped;
  }, [
    groupedData,
    searchTerm,
    sortKey,
    sortDir,
    groupSorts,
    showDocsWithBalanceOnly,
  ]);

  // Calculate totals
  // Deduplicate by disbursementId to avoid counting same document in multiple COAs
  const uniqueDocuments = new Map<number, DisbursementSummary>();
  processedData.forEach((group) => {
    group.records.forEach((record) => {
      if (!uniqueDocuments.has(record.disbursementId)) {
        uniqueDocuments.set(record.disbursementId, record);
      }
    });
  });
  const totalRecords = uniqueDocuments.size;
  const grandTotal = Array.from(uniqueDocuments.values()).reduce(
    (sum, record) => {
      if (showDocsWithBalanceOnly) {
        // When filtering by balance, show the sum of outstanding balances (header-level)
        const bal =
          typeof record.balance === "number"
            ? record.balance
            : (record.totalAmount || 0) - (record.paidAmount || 0);
        return sum + Math.max(0, bal);
      }

      // Otherwise show total header amounts across unique documents
      const headerTotal =
        typeof record.totalAmountHeader === "number"
          ? record.totalAmountHeader
          : record.lines?.[0]?.totalAmount;
      return (
        sum +
        (typeof headerTotal === "number" ? headerTotal : record.totalAmount)
      );
    },
    0,
  );

  // Visible unique outstanding balance (deduplicated by disbursementId)
  // const visibleUniqueOutstandingBalance = Array.from(
  //   uniqueDocuments.values(),
  // ).reduce((sum, record) => {
  //   const bal =
  //     typeof record.balance === "number"
  //       ? record.balance
  //       : record.totalAmount - (record.paidAmount ?? 0);
  //   return sum + bal;
  // }, 0);

  // const handleSort = (key: SortKey) => {
  //   if (sortKey === key) {
  //     setSortDir(sortDir === "asc" ? "desc" : "asc");
  //   } else {
  //     setSortKey(key);
  //     setSortDir("desc");
  //   }
  // };

  const handleCoaSort = (
    groupTitle: string,
    coaTitle: string,
    key: SortKey,
  ) => {
    const mapKey = `${groupTitle}||${coaTitle}`;
    const current = coaSorts.get(mapKey);
    const newMap = new Map(coaSorts);

    if (current && current.sortKey === key) {
      newMap.set(mapKey, {
        sortKey: key,
        sortDir: current.sortDir === "asc" ? "desc" : "asc",
      });
    } else {
      newMap.set(mapKey, { sortKey: key, sortDir: "desc" });
    }

    setCoaSorts(newMap);
  };

  const handleGroupSort = (groupTitle: string, key: SortKey) => {
    const current = groupSorts.get(groupTitle);
    const newMap = new Map(groupSorts);

    if (current && current.sortKey === key) {
      newMap.set(groupTitle, {
        sortKey: key,
        sortDir: current.sortDir === "asc" ? "desc" : "asc",
      });
    } else {
      newMap.set(groupTitle, { sortKey: key, sortDir: "desc" });
    }

    setGroupSorts(newMap);
  };

  const handleCoaListSort = (
    groupTitle: string,
    key: "coaTitle" | "totalAmount",
  ) => {
    const current = coaListSorts.get(groupTitle);
    const newMap = new Map(coaListSorts);

    if (current && current.sortKey === key) {
      newMap.set(groupTitle, {
        sortKey: key,
        sortDir: current.sortDir === "asc" ? "desc" : "asc",
      });
    } else {
      newMap.set(groupTitle, { sortKey: key, sortDir: "desc" });
    }

    setCoaListSorts(newMap);
  };

  const toggleCoaExpand = (groupTitle: string, coaTitle: string) => {
    const mapKey = `${groupTitle}||${coaTitle}`;
    const newExpanded = new Set(expandedCoas);
    if (newExpanded.has(mapKey)) {
      newExpanded.delete(mapKey);
    } else {
      newExpanded.add(mapKey);
      // Initialize pagination for newly expanded COA
      if (!coaPagination.has(mapKey)) {
        const newPagination = new Map(coaPagination);
        newPagination.set(mapKey, { page: 1, pageSize: 10 });
        setCoaPagination(newPagination);
      }
    }
    setExpandedCoas(newExpanded);
  };

  const toggleDocExpand = (groupTitle: string, docNo: string) => {
    const mapKey = `${groupTitle}||${docNo}`;
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(mapKey)) newExpanded.delete(mapKey);
    else newExpanded.add(mapKey);
    setExpandedDocs(newExpanded);
  };

  const getCoaPagination = (mapKey: string) => {
    return coaPagination.get(mapKey) || { page: 1, pageSize: 10 };
  };

  const setCoaPage = (mapKey: string, page: number) => {
    const newPagination = new Map(coaPagination);
    const current = getCoaPagination(mapKey);
    newPagination.set(mapKey, { ...current, page });
    setCoaPagination(newPagination);
  };

  const setCoaPageSize = (mapKey: string, pageSize: number) => {
    const newPagination = new Map(coaPagination);
    newPagination.set(mapKey, { page: 1, pageSize });
    setCoaPagination(newPagination);
  };

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
      // Initialize pagination for newly expanded group
      if (!groupPagination.has(groupTitle)) {
        const newPagination = new Map(groupPagination);
        newPagination.set(groupTitle, { page: 1, pageSize: 10 });
        setGroupPagination(newPagination);
      }
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupPagination = (groupTitle: string) => {
    return groupPagination.get(groupTitle) || { page: 1, pageSize: 10 };
  };

  const setGroupPage = (groupTitle: string, page: number) => {
    const newPagination = new Map(groupPagination);
    const current = getGroupPagination(groupTitle);
    newPagination.set(groupTitle, { ...current, page });
    setGroupPagination(newPagination);
  };

  const setGroupPageSize = (groupTitle: string, pageSize: number) => {
    const newPagination = new Map(groupPagination);
    newPagination.set(groupTitle, { page: 1, pageSize });
    setGroupPagination(newPagination);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Disbursement Transactions</CardTitle>
            <CardDescription>
              Detailed breakdown of all transactions
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select
              
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as GroupBy)}
              >
                <SelectTrigger className="border" size="sm">
              
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coa">Group by COA</SelectItem>
                  <SelectItem value="division">Group by Division</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Toggle
              // variant="outline"
              className="border bg-background"
              size="sm"
              pressed={showDocsWithBalanceOnly}
              onPressedChange={(pressed: boolean) => {
                setShowDocsWithBalanceOnly(pressed);
                // Reset pagination so views return to first page when filter changes
                setGroupPagination(new Map());
                setCoaPagination(new Map());
              }}
            >
              With Balance
            </Toggle>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // collapse top-level groups, COA subsections and document expansions
                setExpandedGroups(new Set());
                setExpandedCoas(new Set());
                setExpandedDocs(new Set());
              }}
            >
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search all fields (doc no, payee, division, COA, line details, status, etc.)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table className="table-fixed px-2 py-4 w-full">
              <TableHeader className="  w-full">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-30">{/* Doc No */}</TableHead>
                  <TableHead className="w-30" title="Disbursement Date Created">
                    {/* Expense Date */}
                  </TableHead>
                  <TableHead className="w-60">{/* Payee */}</TableHead>
                  <TableHead className="w-50">{/* Division */}</TableHead>
                  <TableHead className="text-right w-30">
                    {/* Amount */}
                  </TableHead>
                  <TableHead className="text-right w-30">
                    {/* Paid */}
                  </TableHead>
                  <TableHead className="text-right w-30">
                    {/* Balance */}
                  </TableHead>
                  <TableHead className="w-60">{/* Remark */}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  processedData
                    .filter((group) => group.records.length > 0)
                    .map((group) => {
                      const isExpanded = expandedGroups.has(group.coaTitle);
                      const pagination = getGroupPagination(group.coaTitle);

                      // Group subtotal respects the "With Balance" toggle.
                      // When enabled, compute COA/line-based subtotals (sum of line amounts
                      // for the group's records) to avoid double-counting header totals across
                      // COA slices. Otherwise fall back to the precomputed group total.
                      const groupSubtotal = (() => {
                        if (showDocsWithBalanceOnly) {
                          return group.records.reduce((sum, r) => {
                            const lineTotal =
                              typeof r.coaLineTotal === "number"
                                ? r.coaLineTotal
                                : (r.lines || []).reduce(
                                    (s, ln) => s + (ln.lineAmount || 0),
                                    0,
                                  );
                            return sum + lineTotal;
                          }, 0);
                        }

                        return group.total;
                      })();

                      // Calculate pagination differently based on groupBy
                      let totalPages: number;
                      let paginatedRecords: DisbursementSummary[];
                      let startIndex: number;
                      let endIndex: number;

                      if (groupBy === "division") {
                        // When grouping by division, paginate the COA list
                        const coaMap = new Map<string, DisbursementSummary[]>();
                        group.records.forEach((r) => {
                          const key = r.coaTitle || "(No Account)";
                          if (!coaMap.has(key)) coaMap.set(key, []);
                          coaMap.get(key)!.push(r);
                        });
                        const coaEntries = Array.from(coaMap.entries());
                        totalPages = Math.ceil(
                          coaEntries.length / pagination.pageSize,
                        );
                        startIndex =
                          (pagination.page - 1) * pagination.pageSize;
                        endIndex = startIndex + pagination.pageSize;
                        // For division mode, we still just keep all records;
                        // the actual pagination happens in the render logic below
                        paginatedRecords = group.records;
                      } else {
                        // When grouping by COA, paginate the records
                        startIndex =
                          (pagination.page - 1) * pagination.pageSize;
                        endIndex = startIndex + pagination.pageSize;
                        paginatedRecords = group.records.slice(
                          startIndex,
                          endIndex,
                        );
                        totalPages = Math.ceil(
                          group.records.length / pagination.pageSize,
                        );
                      }

                      return (
                        <React.Fragment key={group.coaTitle}>
                          {/* Group Header */}
                          <TableRow className="font-medium sticky top-10.25 z-100 ">
                            <TableCell colSpan={1}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleGroup(group.coaTitle)}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell
                              colSpan={5}
                              className="truncate overflow-hidden"
                              title={group.coaTitle}
                            >
                              {groupBy === "coa" ? "COA" : "Division"}:{" "}
                              {group.coaTitle}
                              <span className="ml-2 text-muted-foreground text-sm">
                                (
                                {groupBy === "division"
                                  ? (group.recordCount ?? group.records.length)
                                  : group.records.length}{" "}
                                {(groupBy === "division"
                                  ? (group.recordCount ?? group.records.length)
                                  : group.records.length) === 1
                                  ? "record"
                                  : "records"}
                                )
                              </span>
                            </TableCell>

                            {/* Group subtotal on the rightmost */}
                            <TableCell
                              className="text-right font-medium"
                              colSpan={3}
                            >
                              {showDocsWithBalanceOnly ? (
                                <span>
                                  COA Balance Subtotal:{" "}
                                  {formatCurrency(groupSubtotal)}
                                </span>
                              ) : (
                                <span>
                                  COA Subtotal: {formatCurrency(groupSubtotal)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Group Records - Expanded View */}
                          {isExpanded && (
                            <>
                              {/* Container wrapper for expanded content */}
                              <TableRow className="bg-muted/5 hover:bg-muted/5">
                                <TableCell colSpan={9} className="p-0">
                                  <div className="px-6 py-4 space-y-4">
                                    {/* Per-group column headers (sortable) */}
                                    <div className="bg-background rounded-md border border-border/50 overflow-hidden">
                                      <Table className="table-fixed w-full">
                                        <TableHeader>
                                          <TableRow className="bg-muted/40 border-b">
                                            {groupBy === "division" ? (
                                              <>
                                                <TableHead className="w-10"></TableHead>
                                                <TableHead className="font-medium w-30 px-4 py-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleCoaListSort(
                                                        group.coaTitle,
                                                        "coaTitle",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Chart of Account Title
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="w-40"></TableHead>{" "}
                                                <TableHead className="w-70"></TableHead>{" "}
                                                <TableHead className="w-50"></TableHead>{" "}
                                                <TableHead className="w-30"></TableHead>{" "}
                                                <TableHead className="w-30"></TableHead>{" "}
                                                <TableHead className="w-30"></TableHead>{" "}
                                                {/* <TableHead title="status" className=""></TableHead>{" "} */}
                                                <TableHead className="font-medium text-right w-30 px-4 py-2 ">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleCoaListSort(
                                                        group.coaTitle,
                                                        "totalAmount",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Subtotal
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                              </>
                                            ) : (
                                              <>
                                                <TableHead className="w-10"></TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-30">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "docNo",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Doc No
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-40">
                                                  <Button
                                                    title="Disbursement Date Created"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "transactionDate",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Expense Date
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-80">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "payeeName",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Payee
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-50 text-right">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "divisionName",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Division
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-30 text-right">
                                                  <Button
                                                    title="Total Amount"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "totalAmount",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Total Amount
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-30 text-right">
                                                  Paid Amount
                                                </TableHead>
                                                <TableHead className="font-medium px-4 py-2 w-30 text-right">
                                                  Balance
                                                </TableHead>
                                                {/* <TableHead className="font-medium px-4 py-2">
                                                <Button
                                                  title="Line Remarks"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleGroupSort(
                                                      group.coaTitle,
                                                      "lineRemarks",
                                                    )
                                                  }
                                                  className="-ml-3 h-8"
                                                >
                                                  Remark
                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                              </TableHead> */}
                                                <TableHead className="font-medium px-4 py-2 w-30">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleGroupSort(
                                                        group.coaTitle,
                                                        "status",
                                                      )
                                                    }
                                                    className="-ml-3 h-8"
                                                  >
                                                    Status
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                  </Button>
                                                </TableHead>
                                              </>
                                            )}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {groupBy === "division"
                                            ? // When grouped by division, show Account Title sub-sections (paginated)
                                              (() => {
                                                // Build COA map from ALL records (not paginated records)
                                                const coaMap = new Map<
                                                  string,
                                                  DisbursementSummary[]
                                                >();
                                                group.records.forEach((r) => {
                                                  const key =
                                                    r.coaTitle ||
                                                    "(No Account)";
                                                  if (!coaMap.has(key))
                                                    coaMap.set(key, []);
                                                  coaMap.get(key)!.push(r);
                                                });

                                                // Paginate the COA list (not records)
                                                const coaEntries = Array.from(
                                                  coaMap.entries(),
                                                );

                                                // Apply COA list sorting if present
                                                const coaListSort =
                                                  coaListSorts.get(
                                                    group.coaTitle,
                                                  );
                                                if (coaListSort) {
                                                  coaEntries.sort((a, b) => {
                                                    const aTitle = a[0];
                                                    const bTitle = b[0];
                                                    const aTotal = a[1].reduce(
                                                      (s, r) =>
                                                        s + r.totalAmount,
                                                      0,
                                                    );
                                                    const bTotal = b[1].reduce(
                                                      (s, r) =>
                                                        s + r.totalAmount,
                                                      0,
                                                    );

                                                    if (
                                                      coaListSort.sortKey ===
                                                      "coaTitle"
                                                    ) {
                                                      const aTitleLower =
                                                        aTitle.toLowerCase();
                                                      const bTitleLower =
                                                        bTitle.toLowerCase();
                                                      return coaListSort.sortDir ===
                                                        "asc"
                                                        ? aTitleLower.localeCompare(
                                                            bTitleLower,
                                                          )
                                                        : bTitleLower.localeCompare(
                                                            aTitleLower,
                                                          );
                                                    } else {
                                                      return coaListSort.sortDir ===
                                                        "asc"
                                                        ? aTotal - bTotal
                                                        : bTotal - aTotal;
                                                    }
                                                  });
                                                }

                                                const coaStartIndex =
                                                  (pagination.page - 1) *
                                                  pagination.pageSize;
                                                const coaEndIndex =
                                                  coaStartIndex +
                                                  pagination.pageSize;
                                                const paginatedCoaEntries =
                                                  coaEntries.slice(
                                                    coaStartIndex,
                                                    coaEndIndex,
                                                  );
                                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                const coaTotalPages = Math.ceil(
                                                  coaEntries.length /
                                                    pagination.pageSize,
                                                );

                                                return paginatedCoaEntries.map(
                                                  ([coaTitle, records]) => {
                                                    // apply coa-specific sort if present
                                                    const mapKey = `${group.coaTitle}||${coaTitle}`;
                                                    const cSort =
                                                      coaSorts.get(mapKey);
                                                    const sortedRecords = [
                                                      ...records,
                                                    ];
                                                    if (cSort) {
                                                      const {
                                                        sortKey: sKey,
                                                        sortDir: sDir,
                                                      } = cSort;
                                                      sortedRecords.sort(
                                                        (a, b) => {
                                                          const aVal = a[sKey];
                                                          const bVal = b[sKey];
                                                          if (
                                                            sKey ===
                                                            "totalAmount"
                                                          ) {
                                                            const aNum =
                                                              typeof aVal ===
                                                              "number"
                                                                ? aVal
                                                                : 0;
                                                            const bNum =
                                                              typeof bVal ===
                                                              "number"
                                                                ? bVal
                                                                : 0;
                                                            return sDir ===
                                                              "asc"
                                                              ? aNum - bNum
                                                              : bNum - aNum;
                                                          }
                                                          const aStr =
                                                            String(
                                                              aVal,
                                                            ).toLowerCase();
                                                          const bStr =
                                                            String(
                                                              bVal,
                                                            ).toLowerCase();
                                                          return sDir === "asc"
                                                            ? aStr.localeCompare(
                                                                bStr,
                                                              )
                                                            : bStr.localeCompare(
                                                                aStr,
                                                              );
                                                        },
                                                      );
                                                    }

                                                    const coaSubtotal =
                                                      showDocsWithBalanceOnly
                                                        ? records.reduce(
                                                            (s, r) => {
                                                              const lineTotal =
                                                                typeof r.coaLineTotal ===
                                                                "number"
                                                                  ? r.coaLineTotal
                                                                  : (
                                                                      r.lines ||
                                                                      []
                                                                    ).reduce(
                                                                      (
                                                                        ss,
                                                                        ln,
                                                                      ) =>
                                                                        ss +
                                                                        (ln.lineAmount ||
                                                                          0),
                                                                      0,
                                                                    );
                                                              return (
                                                                s + lineTotal
                                                              );
                                                            },
                                                            0,
                                                          )
                                                        : getTotalAmount(
                                                            records,
                                                          );

                                                    const isCoaExpanded =
                                                      expandedCoas.has(mapKey);

                                                    return (
                                                      <React.Fragment
                                                        key={coaTitle}
                                                      >
                                                        {/* COA Header with expand button */}

                                                        <TableRow className="bg-muted/10 border-b">
                                                          <TableCell
                                                            colSpan={1}
                                                          >
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() =>
                                                                toggleCoaExpand(
                                                                  group.coaTitle,
                                                                  coaTitle,
                                                                )
                                                              }
                                                              className="h-6 w-6 p-0"
                                                            >
                                                              {isCoaExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                              ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                              )}
                                                            </Button>
                                                          </TableCell>
                                                          <TableCell
                                                            title={coaTitle}
                                                            colSpan={5}
                                                            className="font-medium px-4 py-2 truncate overflow-hidden"
                                                          >
                                                            Account: {coaTitle}
                                                            <span className="ml-2 text-muted-foreground text-sm">
                                                              ({records.length}{" "}
                                                              {records.length ===
                                                              1
                                                                ? "record"
                                                                : "records"}
                                                              )
                                                            </span>
                                                          </TableCell>
                                                          <TableCell
                                                            // title={coaSubtotal}
                                                            colSpan={3}
                                                            className="text-right font-medium px-4 py-2"
                                                          >
                                                            {showDocsWithBalanceOnly ? (
                                                              <>
                                                                COA Balance
                                                                Subtotal:{" "}
                                                                {formatCurrency(
                                                                  coaSubtotal,
                                                                )}
                                                              </>
                                                            ) : (
                                                              <>
                                                                Subtotal:{" "}
                                                                {formatCurrency(
                                                                  coaSubtotal,
                                                                )}
                                                              </>
                                                            )}
                                                          </TableCell>
                                                        </TableRow>

                                                        {/* COA data rows - shown only when expanded */}
                                                        {isCoaExpanded && (
                                                          <>
                                                            {/* Group by Division - COA column headers */}
                                                            {/* COA column headers */}
                                                            <TableRow className="bg-white/50 border-b">
                                                              <TableCell className="px-4 w-10"></TableCell>
                                                              <TableCell className="font-medium w-30 px-4 py-2">
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleCoaSort(
                                                                      group.coaTitle,
                                                                      coaTitle,
                                                                      "docNo",
                                                                    )
                                                                  }
                                                                  className="-ml-3 h-8"
                                                                >
                                                                  Doc No
                                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                                </Button>
                                                              </TableCell>
                                                              <TableCell className="font-medium w-40 px-4 py-2">
                                                                <Button
                                                                  title="Disbursement Date Created"
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleCoaSort(
                                                                      group.coaTitle,
                                                                      coaTitle,
                                                                      "transactionDate",
                                                                    )
                                                                  }
                                                                  className="-ml-3 h-8"
                                                                >
                                                                  Expense Date
                                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                                </Button>
                                                              </TableCell>
                                                              <TableCell className="font-medium px-4 py-2 w-80">
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleCoaSort(
                                                                      group.coaTitle,
                                                                      coaTitle,
                                                                      "payeeName",
                                                                    )
                                                                  }
                                                                  className="-ml-3 h-8"
                                                                >
                                                                  Payee
                                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                                </Button>
                                                              </TableCell>
                                                              <TableCell className="font-medium w-50 px-4 py-2">
                                                                Division
                                                              </TableCell>
                                                              <TableCell className="font-medium text-right w-30 px-4 py-2">
                                                                <Button
                                                                  title="Total Amount"
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleCoaSort(
                                                                      group.coaTitle,
                                                                      coaTitle,
                                                                      "totalAmount",
                                                                    )
                                                                  }
                                                                  className="-ml-3 h-8"
                                                                >
                                                                  Total Amount
                                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                                </Button>
                                                              </TableCell>
                                                              <TableCell className="font-medium w-30 text-right px-4 py-2">
                                                                Paid Amount
                                                              </TableCell>
                                                              <TableCell className="font-medium text-right w-30 px-4 py-2">
                                                                Balance
                                                              </TableCell>
                                                              {/* <TableCell
                                                              title="Line Remark"
                                                              className="font-medium w-100 px-4 py-2"
                                                            >
                                                              Remark
                                                            </TableCell> */}
                                                              <TableCell className="font-medium w-30 px-4 py-2 text-right">
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleCoaSort(
                                                                      group.coaTitle,
                                                                      coaTitle,
                                                                      "status",
                                                                    )
                                                                  }
                                                                  className="-ml-3 h-8"
                                                                >
                                                                  Status
                                                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                                                </Button>
                                                              </TableCell>
                                                            </TableRow>

                                                            {/* COA data rows with pagination */}
                                                            {(() => {
                                                              const coaMapKey = `${group.coaTitle}||${coaTitle}`;
                                                              const coaPag =
                                                                getCoaPagination(
                                                                  coaMapKey,
                                                                );
                                                              const coaStartIndex =
                                                                (coaPag.page -
                                                                  1) *
                                                                coaPag.pageSize;
                                                              const coaEndIndex =
                                                                coaStartIndex +
                                                                coaPag.pageSize;
                                                              const paginatedCoaRecords =
                                                                sortedRecords.slice(
                                                                  coaStartIndex,
                                                                  coaEndIndex,
                                                                );
                                                              const coaTotalPages =
                                                                Math.ceil(
                                                                  sortedRecords.length /
                                                                    coaPag.pageSize,
                                                                );

                                                              return (
                                                                <>
                                                                  {paginatedCoaRecords.map(
                                                                    (
                                                                      record,
                                                                      idx,
                                                                    ) => {
                                                                      const docKey = `${group.coaTitle}||${record.docNo}`;
                                                                      const isDocExpanded =
                                                                        expandedDocs.has(
                                                                          docKey,
                                                                        );

                                                                      return (
                                                                        <React.Fragment
                                                                          key={`${record.disbursementId}-${idx}`}
                                                                        >
                                                                          <TableRow className="border-b hover:bg-muted/5">
                                                                            <TableCell className="px-4 py-2 w-10">
                                                                              <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0"
                                                                                onClick={() =>
                                                                                  toggleDocExpand(
                                                                                    group.coaTitle,
                                                                                    record.docNo,
                                                                                  )
                                                                                }
                                                                              >
                                                                                {isDocExpanded ? (
                                                                                  <ChevronDown className="h-4 w-4" />
                                                                                ) : (
                                                                                  <ChevronRight className="h-4 w-4" />
                                                                                )}
                                                                              </Button>
                                                                            </TableCell>
                                                                            <TableCell
                                                                              className="font-medium w-30 px-4 py-2 truncate overflow-hidden"
                                                                              title={
                                                                                record.docNo
                                                                              }
                                                                            >
                                                                              {
                                                                                record.docNo
                                                                              }
                                                                            </TableCell>
                                                                            <TableCell className="w-30 px-4 py-2">
                                                                              {formatDateLong(
                                                                                new Date(
                                                                                  record.transactionDate,
                                                                                ),
                                                                              )}
                                                                            </TableCell>
                                                                            <TableCell
                                                                              className="w-60 px-4 py-2 truncate overflow-hidden"
                                                                              title={
                                                                                record.payeeName
                                                                              }
                                                                            >
                                                                              {
                                                                                record.payeeName
                                                                              }
                                                                            </TableCell>
                                                                            <TableCell
                                                                              className="w-30 truncate overflow-hidden px-4 py-2"
                                                                              title={
                                                                                record.divisionName
                                                                              }
                                                                            >
                                                                              {
                                                                                record.divisionName
                                                                              }
                                                                            </TableCell>
                                                                            <TableCell
                                                                              title={formatCurrency(
                                                                                record.totalAmount,
                                                                              )}
                                                                              className="w-30 text-right px-4 py-2"
                                                                            >
                                                                              {formatCurrency(
                                                                                record.totalAmount,
                                                                              )}
                                                                            </TableCell>
                                                                            <TableCell
                                                                              title={formatCurrency(
                                                                                record.paidAmount ||
                                                                                  0,
                                                                              )}
                                                                              className="w-30 text-right px-4 py-2"
                                                                            >
                                                                              {formatCurrency(
                                                                                record.paidAmount ||
                                                                                  0,
                                                                              )}
                                                                            </TableCell>
                                                                            <TableCell
                                                                              title={formatCurrency(
                                                                                (record.totalAmount ||
                                                                                  0) -
                                                                                  (record.paidAmount ||
                                                                                    0),
                                                                              )}
                                                                              className="w-30 text-right px-4 py-2"
                                                                            >
                                                                              {formatCurrency(
                                                                                (record.totalAmount ||
                                                                                  0) -
                                                                                  (record.paidAmount ||
                                                                                    0),
                                                                              )}
                                                                            </TableCell>
                                                                            {/* <TableCell
                                                                            className="w-100 truncate overflow-hidden px-4 py-2"
                                                                            title={
                                                                              record.lineRemarks ||
                                                                              "-"
                                                                            }
                                                                          >
                                                                            {record.lineRemarks ||
                                                                              "-"}
                                                                          </TableCell> */}
                                                                            <TableCell className="w-10 px-4 py-2 text-right">
                                                                              <Badge
                                                                                variant={
                                                                                  record.status ===
                                                                                  "Posted"
                                                                                    ? "default"
                                                                                    : record.status ===
                                                                                        "Pending"
                                                                                      ? "secondary"
                                                                                      : "outline"
                                                                                }
                                                                              >
                                                                                {
                                                                                  record.status
                                                                                }
                                                                              </Badge>
                                                                            </TableCell>
                                                                          </TableRow>

                                                                          {isDocExpanded && (
                                                                            <TableRow className="bg-muted/5">
                                                                              <TableCell
                                                                                colSpan={
                                                                                  9
                                                                                }
                                                                                className="p-0"
                                                                              >
                                                                                <div className="m-4 p-4 bg-background rounded-md border border-border/50">
                                                                                  <Table className="table-fixed w-full">
                                                                                    <TableHeader>
                                                                                      <TableRow className="bg-muted/40 border-b">
                                                                                        <TableHead className="font-medium px-4 py-2 w-30">
                                                                                          Line
                                                                                          ID
                                                                                        </TableHead>
                                                                                        <TableHead className="font-medium px-4 py-2 w-40">
                                                                                          Line
                                                                                          Date
                                                                                        </TableHead>
                                                                                        <TableHead className="font-medium px-4 py-2 w-60">
                                                                                          Account
                                                                                          Title
                                                                                        </TableHead>
                                                                                        <TableHead className="font-medium px-4 py-2">
                                                                                          Remarks
                                                                                        </TableHead>
                                                                                        <TableHead className="font-medium px-4 py-2 text-right w-30">
                                                                                          Line
                                                                                          Amount
                                                                                        </TableHead>
                                                                                        <TableHead className="font-medium px-4 py-2 text-right w-90">
                                                                                          Reference
                                                                                          No
                                                                                        </TableHead>
                                                                                      </TableRow>
                                                                                    </TableHeader>
                                                                                    <TableBody>
                                                                                      {(
                                                                                        record.lines ||
                                                                                        []
                                                                                      ).map(
                                                                                        (
                                                                                          ln,
                                                                                        ) => (
                                                                                          <TableRow
                                                                                            key={
                                                                                              ln.lineId
                                                                                            }
                                                                                            className="border-b hover:bg-muted/5"
                                                                                          >
                                                                                            <TableCell className="px-4 py-2">
                                                                                              {
                                                                                                ln.lineId
                                                                                              }
                                                                                            </TableCell>
                                                                                            <TableCell className="px-4 py-2">
                                                                                              {formatDateLong(
                                                                                                new Date(
                                                                                                  ln.lineDate,
                                                                                                ),
                                                                                              )}
                                                                                            </TableCell>
                                                                                            <TableCell
                                                                                              title={
                                                                                                ln.coaTitle
                                                                                              }
                                                                                              className="px-4 py-2 truncate"
                                                                                            >
                                                                                              {
                                                                                                ln.coaTitle
                                                                                              }
                                                                                            </TableCell>
                                                                                            <TableCell
                                                                                              title={
                                                                                                ln.lineRemarks
                                                                                              }
                                                                                              className="px-4 py-2 truncate"
                                                                                            >
                                                                                              {ln.lineRemarks ||
                                                                                                "-"}
                                                                                            </TableCell>
                                                                                            <TableCell className="px-4 py-2 text-right">
                                                                                              {formatCurrency(
                                                                                                ln.lineAmount ||
                                                                                                  0,
                                                                                              )}
                                                                                            </TableCell>

                                                                                            <TableCell
                                                                                              title={
                                                                                                ln.referenceNo ||
                                                                                                "-"
                                                                                              }
                                                                                              className="px-4 py-2 text-right truncate"
                                                                                            >
                                                                                              {ln.referenceNo ||
                                                                                                "-"}
                                                                                            </TableCell>
                                                                                          </TableRow>
                                                                                        ),
                                                                                      )}
                                                                                    </TableBody>
                                                                                  </Table>
                                                                                </div>
                                                                              </TableCell>
                                                                            </TableRow>
                                                                          )}
                                                                        </React.Fragment>
                                                                      );
                                                                    },
                                                                  )}
                                                                  {/* COA Pagination Row */}
                                                                  <TableRow className="bg-muted/20 border-top">
                                                                    <TableCell
                                                                      colSpan={
                                                                        9
                                                                      }
                                                                      className="p-3"
                                                                    >
                                                                      <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                          <span className="text-sm text-muted-foreground">
                                                                            Items
                                                                            per
                                                                            page
                                                                          </span>
                                                                          <Select
                                                                            value={String(
                                                                              coaPag.pageSize,
                                                                            )}
                                                                            onValueChange={(
                                                                              v,
                                                                            ) =>
                                                                              setCoaPageSize(
                                                                                coaMapKey,
                                                                                Number(
                                                                                  v,
                                                                                ),
                                                                              )
                                                                            }
                                                                          >
                                                                            <SelectTrigger className="w-20 h-8">
                                                                              <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                              <SelectGroup>
                                                                                <SelectItem value="5">
                                                                                  5
                                                                                </SelectItem>
                                                                                <SelectItem value="10">
                                                                                  10
                                                                                </SelectItem>
                                                                                <SelectItem value="20">
                                                                                  20
                                                                                </SelectItem>
                                                                                <SelectItem value="50">
                                                                                  50
                                                                                </SelectItem>
                                                                              </SelectGroup>
                                                                            </SelectContent>
                                                                          </Select>
                                                                        </div>

                                                                        <span className="text-sm text-muted-foreground">
                                                                          {Math.min(
                                                                            coaStartIndex +
                                                                              1,
                                                                            sortedRecords.length,
                                                                          )}{" "}
                                                                          to{" "}
                                                                          {Math.min(
                                                                            coaEndIndex,
                                                                            sortedRecords.length,
                                                                          )}{" "}
                                                                          of{" "}
                                                                          {
                                                                            sortedRecords.length
                                                                          }
                                                                        </span>

                                                                        <div className="flex items-center gap-1">
                                                                          <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                              setCoaPage(
                                                                                coaMapKey,
                                                                                Math.max(
                                                                                  1,
                                                                                  coaPag.page -
                                                                                    1,
                                                                                ),
                                                                              )
                                                                            }
                                                                            disabled={
                                                                              coaPag.page ===
                                                                              1
                                                                            }
                                                                          >
                                                                            Previous
                                                                          </Button>
                                                                          {Array.from(
                                                                            {
                                                                              length:
                                                                                Math.min(
                                                                                  5,
                                                                                  coaTotalPages,
                                                                                ),
                                                                            },
                                                                            (
                                                                              _,
                                                                              i,
                                                                            ) => {
                                                                              let pageNum: number;
                                                                              if (
                                                                                coaTotalPages <=
                                                                                5
                                                                              ) {
                                                                                pageNum =
                                                                                  i +
                                                                                  1;
                                                                              } else if (
                                                                                coaPag.page <=
                                                                                3
                                                                              ) {
                                                                                pageNum =
                                                                                  i +
                                                                                  1;
                                                                              } else if (
                                                                                coaPag.page >=
                                                                                coaTotalPages -
                                                                                  2
                                                                              ) {
                                                                                pageNum =
                                                                                  coaTotalPages -
                                                                                  4 +
                                                                                  i;
                                                                              } else {
                                                                                pageNum =
                                                                                  coaPag.page -
                                                                                  2 +
                                                                                  i;
                                                                              }

                                                                              return (
                                                                                <Button
                                                                                  key={
                                                                                    pageNum
                                                                                  }
                                                                                  variant={
                                                                                    coaPag.page ===
                                                                                    pageNum
                                                                                      ? "default"
                                                                                      : "outline"
                                                                                  }
                                                                                  size="sm"
                                                                                  onClick={() =>
                                                                                    setCoaPage(
                                                                                      coaMapKey,
                                                                                      pageNum,
                                                                                    )
                                                                                  }
                                                                                >
                                                                                  {
                                                                                    pageNum
                                                                                  }
                                                                                </Button>
                                                                              );
                                                                            },
                                                                          )}
                                                                          {coaTotalPages >
                                                                            5 && (
                                                                            <span className="px-1 text-sm">
                                                                              ...
                                                                            </span>
                                                                          )}
                                                                          <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                              setCoaPage(
                                                                                coaMapKey,
                                                                                Math.min(
                                                                                  coaTotalPages,
                                                                                  coaPag.page +
                                                                                    1,
                                                                                ),
                                                                              )
                                                                            }
                                                                            disabled={
                                                                              coaPag.page ===
                                                                              coaTotalPages
                                                                            }
                                                                          >
                                                                            Next
                                                                          </Button>
                                                                        </div>
                                                                      </div>
                                                                    </TableCell>
                                                                  </TableRow>
                                                                </>
                                                              );
                                                            })()}
                                                          </>
                                                        )}
                                                      </React.Fragment>
                                                    );
                                                  },
                                                );
                                              })()
                                            : paginatedRecords.map((record) => {
                                                const docKey = `${group.coaTitle}||${record.docNo}`;
                                                const isDocExpanded =
                                                  expandedDocs.has(docKey);

                                                return (
                                                  <React.Fragment
                                                    key={record.docNo}
                                                  >
                                                    <TableRow className="border-b hover:bg-muted/5">
                                                      <TableCell className="px-4 py-2 w-10">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-6 w-6 p-0"
                                                          onClick={() =>
                                                            toggleDocExpand(
                                                              group.coaTitle,
                                                              record.docNo,
                                                            )
                                                          }
                                                        >
                                                          {isDocExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                          ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                          )}
                                                        </Button>
                                                      </TableCell>
                                                      <TableCell
                                                        title={record.docNo}
                                                        className="font-medium px-4 py-2"
                                                      >
                                                        {record.docNo}
                                                      </TableCell>
                                                      <TableCell className="px-4 py-2">
                                                        {formatDateLong(
                                                          new Date(
                                                            record.transactionDate,
                                                          ),
                                                        )}
                                                      </TableCell>
                                                      <TableCell
                                                        className="px-4 py-2 truncate overflow-hidden"
                                                        title={record.payeeName}
                                                      >
                                                        {record.payeeName}
                                                      </TableCell>
                                                      <TableCell
                                                        className=" truncate overflow-hidden px-4 py-2 text-right"
                                                        title={
                                                          groupBy === "coa"
                                                            ? record.divisionName
                                                            : record.coaTitle
                                                        }
                                                      >
                                                        {groupBy === "coa"
                                                          ? record.divisionName
                                                          : record.coaTitle}
                                                      </TableCell>
                                                      <TableCell className="text-right px-4 py-2">
                                                        {formatCurrency(
                                                          record.totalAmount,
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="text-right px-4 py-2">
                                                        {formatCurrency(
                                                          record.paidAmount ||
                                                            0,
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="text-right px-4 py-2">
                                                        {formatCurrency(
                                                          (record.totalAmount ||
                                                            0) -
                                                            (record.paidAmount ||
                                                              0),
                                                        )}
                                                      </TableCell>
                                                      {/* <TableCell
                                                      className=" truncate overflow-hidden px-4 py-2"
                                                      title={
                                                        record.lineRemarks ||
                                                        "-"
                                                      }
                                                    >
                                                      {record.lineRemarks ||
                                                        "-"}
                                                    </TableCell> */}
                                                      <TableCell className="px-4 py-2">
                                                        <Badge
                                                          variant={
                                                            record.status ===
                                                            "Posted"
                                                              ? "default"
                                                              : record.status ===
                                                                  "Pending"
                                                                ? "secondary"
                                                                : "outline"
                                                          }
                                                        >
                                                          {record.status}
                                                        </Badge>
                                                      </TableCell>
                                                    </TableRow>

                                                    {isDocExpanded && (
                                                      <TableRow className="bg-muted/5">
                                                        <TableCell
                                                          colSpan={9}
                                                          className="p-0"
                                                        >
                                                          <div className="m-4 p-4 bg-background rounded-md border border-border/50">
                                                            <Table className="table-fixed w-full">
                                                              <TableHeader>
                                                                <TableRow className="bg-muted/40 border-b">
                                                                  <TableHead className="font-medium px-4 py-2 w-30">
                                                                    Line ID
                                                                  </TableHead>
                                                                  <TableHead className="font-medium px-4 py-2 w-40">
                                                                    Line Date
                                                                  </TableHead>
                                                                  <TableHead className="font-medium px-4 py-2 w-60">
                                                                    Account
                                                                    Title
                                                                  </TableHead>

                                                                  <TableHead className="font-medium px-4 py-2">
                                                                    Remarks
                                                                  </TableHead>
                                                                  <TableHead className="font-medium px-4 py-2 text-right w-30">
                                                                    Line Amount
                                                                  </TableHead>
                                                                  <TableHead className="font-medium px-4 py-2 text-right w-90">
                                                                    Reference No
                                                                  </TableHead>
                                                                </TableRow>
                                                              </TableHeader>
                                                              <TableBody>
                                                                {(
                                                                  record.lines ||
                                                                  []
                                                                ).map((ln) => (
                                                                  <TableRow
                                                                    key={
                                                                      ln.lineId
                                                                    }
                                                                    className="border-b hover:bg-muted/5"
                                                                  >
                                                                    <TableCell className="px-4 py-2">
                                                                      {
                                                                        ln.lineId
                                                                      }
                                                                    </TableCell>

                                                                    <TableCell className="px-4 py-2">
                                                                      {formatDateLong(
                                                                        new Date(
                                                                          ln.lineDate,
                                                                        ),
                                                                      )}
                                                                    </TableCell>
                                                                    <TableCell
                                                                      title={
                                                                        ln.coaTitle
                                                                      }
                                                                      className="px-4 py-2 truncate"
                                                                    >
                                                                      {
                                                                        ln.coaTitle
                                                                      }
                                                                    </TableCell>
                                                                    <TableCell
                                                                      title={
                                                                        ln.lineRemarks
                                                                      }
                                                                      className="px-4 py-2 truncate"
                                                                    >
                                                                      {ln.lineRemarks ||
                                                                        "-"}
                                                                    </TableCell>
                                                                    <TableCell className="px-4 py-2 text-right">
                                                                      {formatCurrency(
                                                                        ln.lineAmount ||
                                                                          0,
                                                                      )}
                                                                    </TableCell>

                                                                    <TableCell
                                                                      title={
                                                                        ln.referenceNo ||
                                                                        "-"
                                                                      }
                                                                      className="px-4 py-2 text-right truncate"
                                                                    >
                                                                      {ln.referenceNo ||
                                                                        "-"}
                                                                    </TableCell>
                                                                  </TableRow>
                                                                ))}
                                                                <TableRow className="bg-muted/10 border-t font-medium">
                                                                  <TableCell
                                                                    colSpan={4}
                                                                    className="px-4 py-2"
                                                                  >
                                                                    Line Amount
                                                                    Subtotal:
                                                                  </TableCell>
                                                                  <TableCell className="px-4 py-2 text-right font-bold">
                                                                    {formatCurrency(
                                                                      (
                                                                        record.lines ||
                                                                        []
                                                                      ).reduce(
                                                                        (
                                                                          sum,
                                                                          ln,
                                                                        ) =>
                                                                          sum +
                                                                          (ln.lineAmount ||
                                                                            0),
                                                                        0,
                                                                      ),
                                                                    )}
                                                                  </TableCell>
                                                                  <TableCell className="px-4 py-2"></TableCell>
                                                                </TableRow>
                                                              </TableBody>
                                                            </Table>
                                                          </div>
                                                        </TableCell>
                                                      </TableRow>
                                                    )}
                                                  </React.Fragment>
                                                );
                                              })}
                                        </TableBody>
                                      </Table>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center justify-between py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          Items per page
                                        </span>
                                        <Select
                                          value={String(pagination.pageSize)}
                                          onValueChange={(v) =>
                                            setGroupPageSize(
                                              group.coaTitle,
                                              Number(v),
                                            )
                                          }
                                        >
                                          <SelectTrigger className="w-20 h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              <SelectItem value="5">
                                                5
                                              </SelectItem>
                                              <SelectItem value="10">
                                                10
                                              </SelectItem>
                                              <SelectItem value="20">
                                                20
                                              </SelectItem>
                                              <SelectItem value="50">
                                                50
                                              </SelectItem>
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <span className="text-sm text-muted-foreground">
                                        Showing{" "}
                                        {Math.min(
                                          startIndex + 1,
                                          group.records.length,
                                        )}{" "}
                                        to{" "}
                                        {Math.min(
                                          endIndex,
                                          group.records.length,
                                        )}{" "}
                                        of {group.records.length} items
                                      </span>

                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setGroupPage(
                                              group.coaTitle,
                                              Math.max(1, pagination.page - 1),
                                            )
                                          }
                                          disabled={pagination.page === 1}
                                        >
                                          Previous
                                        </Button>
                                        {Array.from(
                                          { length: Math.min(5, totalPages) },
                                          (_, i) => {
                                            let pageNum: number;
                                            if (totalPages <= 5) {
                                              pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                              pageNum = i + 1;
                                            } else if (
                                              pagination.page >=
                                              totalPages - 2
                                            ) {
                                              pageNum = totalPages - 4 + i;
                                            } else {
                                              pageNum = pagination.page - 2 + i;
                                            }

                                            return (
                                              <Button
                                                key={pageNum}
                                                variant={
                                                  pagination.page === pageNum
                                                    ? "default"
                                                    : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                  setGroupPage(
                                                    group.coaTitle,
                                                    pageNum,
                                                  )
                                                }
                                              >
                                                {pageNum}
                                              </Button>
                                            );
                                          },
                                        )}
                                        {totalPages > 5 && (
                                          <span className="px-1 text-sm">
                                            ...
                                          </span>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setGroupPage(
                                              group.coaTitle,
                                              Math.min(
                                                totalPages,
                                                pagination.page + 1,
                                              ),
                                            )
                                          }
                                          disabled={
                                            pagination.page === totalPages
                                          }
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Total {totalRecords} {totalRecords === 1 ? "item" : "items"}
          </span>
          <span>
            {processedData.length}{" "}
            {groupBy === "coa" ? "categories" : "divisions"}
          </span>
        </div>

        {/* Footer Totals */}
        <div className="flex justify-between border-t pt-4">
          <div className="font-medium">Grand Total</div>
          <div className="font-bold text-lg">{formatCurrency(grandTotal)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
