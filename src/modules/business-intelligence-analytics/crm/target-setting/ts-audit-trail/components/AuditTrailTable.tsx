"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import type { AuditTrailEntry } from "../types";

interface Props {
  data: AuditTrailEntry[];
  page: number;
  limit: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function AuditTrailTable({ 
  data, 
  page, 
  limit, 
  totalRecords, 
  onPageChange, 
  onLimitChange 
}: Props) {
  return (
    <div className="space-y-4">
      {/* Table Container - Borderless to fit inside CardContent */}
      <div className="border-b">
        <DataTable columns={columns} data={data} />
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 pt-0">
        <DataTablePagination 
            pageIndex={page} 
            pageSize={limit} 
            rowCount={totalRecords} 
            onPageChange={onPageChange}
            onPageSizeChange={onLimitChange}
        />
      </div>
    </div>
  );
}
