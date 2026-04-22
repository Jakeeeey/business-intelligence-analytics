"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Download, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  ExpenseFilters,
  DateRangePreset,
  ExportFormat,
  DisbursementRecord,
} from "../type";

// import type { ExportOptions } from "@/modules/business-intelligence-analytics/expense-report/utils/exportPDF";

type FiltersProps = {
  records: DisbursementRecord[];
  userName: string;
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
  filterOptions: {
    employees: string[];
    divisions: string[];
    encoders: string[];
    coaAccounts: string[];
    transactionTypes: string[];
    statuses: string[];
  };
  onExport: (format: ExportFormat, groupBy?: "coa" | "division") => void;
};

export default function Filters({
  filters,
  onFiltersChange,
  filterOptions,
  onExport,
}: FiltersProps) {
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [divisionSearch] = React.useState("");
  const [encoderSearch, setEncoderSearch] = React.useState("");
  const [coaSearch, setCoaSearch] = React.useState("");
  const [transactionTypeSearch] = React.useState("");
  const [exportFormat, setExportFormat] =
    React.useState<ExportFormat>("summary");
  const [exportGroupBy, setExportGroupBy] = React.useState<"coa" | "division">(
    "coa",
  );
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  // const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);

  const handleDatePresetChange = (preset: DateRangePreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = "";
    let endDate = today.toISOString().split("T")[0];

    switch (preset) {
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split("T")[0];
        endDate = startDate;
        break;
      }
      case "today":
        startDate = endDate;
        break;
      case "this-week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split("T")[0];
        break;
      }
      case "this-month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split("T")[0];
        break;
      }
      case "this-year": {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = yearStart.toISOString().split("T")[0];
        break;
      }
      case "custom":
        startDate = filters.dateFrom;
        endDate = filters.dateTo;
        break;
    }

    onFiltersChange({
      ...filters,
      dateRangePreset: preset,
      dateFrom: startDate,
      dateTo: endDate,
    });
  };

  const handleCustomDateChange = (
    field: "dateFrom" | "dateTo",
    value: string,
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const toggleArrayFilter = (key: keyof ExpenseFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };
  const removeFilterItem = (key: keyof ExpenseFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.filter((v) => v !== value);
    onFiltersChange({ ...filters, [key]: updated });
  };
  const splitVisibleHidden = (items: string[], limit = 3) => {
    return {
      visible: items.slice(0, limit),
      hidden: items.slice(limit),
    };
  };
  const clearFilter = (key: keyof ExpenseFilters) => {
    onFiltersChange({ ...filters, [key]: [] });
  };

  const handleExport = () => {
    onExport(
      exportFormat,
      exportFormat === "detailed" ? exportGroupBy : undefined,
    );
    setExportDialogOpen(false);
  };

  const filteredEmployees = filterOptions.employees.filter((e) =>
    e.toLowerCase().includes(employeeSearch.toLowerCase()),
  );
  const filteredDivisions = filterOptions.divisions.filter((d) =>
    d.toLowerCase().includes(divisionSearch.toLowerCase()),
  );
  const filteredEncoders = filterOptions.encoders.filter((e) =>
    e.toLowerCase().includes(encoderSearch.toLowerCase()),
  );
  const filteredCoaAccounts = filterOptions.coaAccounts.filter((c) =>
    c.toLowerCase().includes(coaSearch.toLowerCase()),
  );
  const filteredTransactionTypes = filterOptions.transactionTypes.filter((t) =>
    t.toLowerCase().includes(transactionTypeSearch.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Disbursement Report</CardTitle>
            <CardDescription>
              Centralized tracking and analysis of all disbursement transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Disbursement Report</DialogTitle>
                  <DialogDescription>
                    Choose the report format you want to export.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <RadioGroup
                    value={exportFormat}
                    onValueChange={(v) => setExportFormat(v as ExportFormat)}
                  >
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                      <RadioGroupItem value="summary" id="summary" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="summary" className="font-medium">
                          Summary Only
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Includes the cover page and compact summary tables
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                      <RadioGroupItem value="detailed" id="detailed" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="detailed" className="font-medium">
                          Detailed Only
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Includes grouped transaction details with subtotals
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  {exportFormat === "detailed" && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium">Grouped By</h3>
                      <RadioGroup
                        value={exportGroupBy}
                        onValueChange={(v) =>
                          setExportGroupBy(v as "coa" | "division")
                        }
                      >
                        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <RadioGroupItem value="coa" id="groupByCoa" />
                          <div className="space-y-1 leading-none">
                            <Label htmlFor="groupByCoa" className="font-medium">
                              COA
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Group the detailed export by Chart of Account
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                          <RadioGroupItem
                            value="division"
                            id="groupByDivision"
                          />
                          <div className="space-y-1 leading-none">
                            <Label
                              htmlFor="groupByDivision"
                              className="font-medium"
                            >
                              Division
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Group the detailed export by Division
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setExportDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={
                filters.dateRangePreset === "yesterday" ? "default" : "outline"
              }
              onClick={() => handleDatePresetChange("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              size="sm"
              variant={
                filters.dateRangePreset === "this-week" ? "default" : "outline"
              }
              onClick={() => handleDatePresetChange("this-week")}
            >
              This Week
            </Button>
            <Button
              size="sm"
              variant={
                filters.dateRangePreset === "this-month" ? "default" : "outline"
              }
              onClick={() => handleDatePresetChange("this-month")}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant={
                filters.dateRangePreset === "this-year" ? "default" : "outline"
              }
              onClick={() => handleDatePresetChange("this-year")}
            >
              This Year
            </Button>
            <Button
              size="sm"
              variant={
                filters.dateRangePreset === "custom" ? "default" : "outline"
              }
              onClick={() => handleDatePresetChange("custom")}
            >
              Custom
            </Button>
          </div>
          {filters.dateRangePreset === "custom" && (
            <div className="flex gap-2 pt-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="dateFrom" className="text-xs">
                  Date From
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleCustomDateChange("dateFrom", e.target.value)
                  }
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="dateTo" className="text-xs">
                  Date To
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    handleCustomDateChange("dateTo", e.target.value)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Multi-select Filters */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
          {/* Employee/Payee */}
          <div className="space-y-1">
            <Label className="text-xs">Payee Name</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.employees.length > 0
                      ? `${filters.employees.length} selected`
                      : "All Payees"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2">
                  <Input
                    placeholder="Search payees..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No payees found
                      </p>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <div
                          key={employee}
                          className="flex items-center  space-x-2"
                        >
                          <Checkbox
                            id={`employee-${employee}`}
                            checked={filters.employees.includes(employee)}
                            onCheckedChange={() =>
                              toggleArrayFilter("employees", employee)
                            }
                          />
                          <label
                            htmlFor={`employee-${employee}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {employee}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Chart of Account */}
          <div className="space-y-1">
            <Label className="text-xs">Chart of Account</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.coaAccounts.length > 0
                      ? `${filters.coaAccounts.length} selected`
                      : "All Chart of Accounts"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2">
                  <Input
                    placeholder="Search COA..."
                    value={coaSearch}
                    onChange={(e) => setCoaSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {filteredCoaAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No COA found
                      </p>
                    ) : (
                      filteredCoaAccounts.map((coa) => (
                        <div key={coa} className="flex items-center space-x-2">
                          <Checkbox
                            id={`coa-${coa}`}
                            checked={filters.coaAccounts.includes(coa)}
                            onCheckedChange={() =>
                              toggleArrayFilter("coaAccounts", coa)
                            }
                          />
                          <label
                            htmlFor={`coa-${coa}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {coa}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {/* Encoder */}
          <div className="space-y-1">
            <Label className="text-xs">Encoder</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.encoders.length > 0
                      ? `${filters.encoders.length} selected`
                      : "All Encoders"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className=" w-full p-0" align="start">
                <div className="p-2">
                  <Input
                    placeholder="Search encoders..."
                    value={encoderSearch}
                    onChange={(e) => setEncoderSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {filteredEncoders.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No encoders found
                      </p>
                    ) : (
                      filteredEncoders.map((encoder) => (
                        <div
                          key={encoder}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`encoder-${encoder}`}
                            checked={filters.encoders.includes(encoder)}
                            onCheckedChange={() =>
                              toggleArrayFilter("encoders", encoder)
                            }
                          />
                          <label
                            htmlFor={`encoder-${encoder}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {encoder}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          {/* Division */}
          <div className="space-y-1">
            <Label className="text-xs">Division</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.divisions.length > 0
                      ? `${filters.divisions.length} selected`
                      : "All Divisions"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                {/* <div className="p-2">
                  <Input
                    placeholder="Search divisions..."
                    value={divisionSearch}
                    onChange={(e) => setDivisionSearch(e.target.value)}
                  />
                </div> */}
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {filteredDivisions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No divisions found
                      </p>
                    ) : (
                      filteredDivisions.map((division) => (
                        <div
                          key={division}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`division-${division}`}
                            checked={filters.divisions.includes(division)}
                            onCheckedChange={() =>
                              toggleArrayFilter("divisions", division)
                            }
                          />
                          <label
                            htmlFor={`division-${division}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {division}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Transaction Type */}
          <div className="space-y-1">
            <Label className="text-xs">Transaction Type</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.transactionTypes.length > 0
                      ? `${filters.transactionTypes.length} selected`
                      : "All Transactions"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                {/* <div className="p-2">
                  <Input
                    placeholder="Search transaction types..."
                    value={transactionTypeSearch}
                    onChange={(e) => setTransactionTypeSearch(e.target.value)}
                  />
                </div> */}
                {/* <ScrollArea className="h-64"> */}
                <div className="p-2 space-y-1">
                  {filteredTransactionTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No transaction types found
                    </p>
                  ) : (
                    filteredTransactionTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.transactionTypes.includes(type)}
                          onCheckedChange={() =>
                            toggleArrayFilter("transactionTypes", type)
                          }
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {type}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {/* </ScrollArea> */}
              </PopoverContent>
            </Popover>
          </div>

          {/* Statuses */}
          <div className="space-y-1">
            <Label className="text-xs">Statuses</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {filters.statuses.length > 0
                      ? `${filters.statuses.length} selected`
                      : "All Statuses"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="start">
                <div className="p-2 space-y-1">
                  {filterOptions.statuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() =>
                          toggleArrayFilter("statuses", status)
                        }
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Active Filters */}
        {Object.values(filters).some((arr) => arr.length > 0) && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-xs">Active Filters</Label>

            <div className="flex flex-col gap-1">
              {/* Employees */}
              {filters.employees.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.employees,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          Payee Name
                        </span>
                        <button
                          type="button"
                          aria-label="Clear payee filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("employees");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("employees", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline" className="cursor-default">
                            +{hidden.length}
                          </Badge>

                          {/* Hover Tooltip */}
                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            <div className="flex flex-col gap-1">
                              {hidden.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs flex justify-between items-center"
                                >
                                  <span className="truncate">{item}</span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${item}`}
                                    className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFilterItem("employees", item);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Divisions */}
              {filters.divisions.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.divisions,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          Divisions
                        </span>
                        <button
                          type="button"
                          aria-label="Clear divisions filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("divisions");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("divisions", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline">+{hidden.length}</Badge>

                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            {hidden.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item}`}
                                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFilterItem("divisions", item);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Encoders */}
              {filters.encoders.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.encoders,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          Encoders
                        </span>
                        <button
                          type="button"
                          aria-label="Clear encoders filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("encoders");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("encoders", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline" className="cursor-default">
                            +{hidden.length}
                          </Badge>

                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            <div className="flex flex-col gap-1">
                              {hidden.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs flex justify-between items-center"
                                >
                                  <span className="truncate">{item}</span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${item}`}
                                    className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFilterItem("encoders", item);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* COA Accounts */}
              {filters.coaAccounts.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.coaAccounts,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          COA
                        </span>
                        <button
                          type="button"
                          aria-label="Clear COA filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("coaAccounts");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("coaAccounts", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline">+{hidden.length}</Badge>

                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            {hidden.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item}`}
                                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFilterItem("coaAccounts", item);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Transaction Types */}
              {filters.transactionTypes.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.transactionTypes,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          Transaction Types
                        </span>
                        <button
                          type="button"
                          aria-label="Clear transaction type filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("transactionTypes");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("transactionTypes", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline">+{hidden.length}</Badge>

                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            {hidden.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item}`}
                                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFilterItem("transactionTypes", item);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Statuses */}
              {filters.statuses.length > 0 &&
                (() => {
                  const { visible, hidden } = splitVisibleHidden(
                    filters.statuses,
                    3,
                  );

                  return (
                    <div className="flex items-center flex-wrap gap-1">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xs font-medium text-muted-foreground">
                          Statuses
                        </span>
                        <button
                          type="button"
                          aria-label="Clear statuses filters"
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded p-0 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilter("statuses");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {visible.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${item}`}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFilterItem("statuses", item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}

                      {hidden.length > 0 && (
                        <div className="relative group">
                          <Badge variant="outline">+{hidden.length}</Badge>

                          <div className="absolute left-0 mt-2 hidden group-hover:block z-50 bg-background border rounded-md shadow-md p-2 w-48">
                            {hidden.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item}`}
                                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFilterItem("statuses", item);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
