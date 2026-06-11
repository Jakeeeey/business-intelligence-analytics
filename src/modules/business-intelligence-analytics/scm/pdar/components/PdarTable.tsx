"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/new-data-table";
import { PdarRecord } from "../types/pdar.schema";
import { PdarDetailsModal } from "./PdarDetailsModal";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PdarTableProps {
  data: PdarRecord[];
  isLoading?: boolean;
}

export function PdarTable({ data, isLoading }: PdarTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<PdarRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (record: PdarRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<PdarRecord>[]>(
    () => [
      {
        accessorKey: "DP_Number",
        header: "DP Number",
      },
      {
        accessorKey: "DelDate",
        header: "Delivery Date",
      },
      {
        accessorKey: "Driver_Name",
        header: "Driver",
      },
      {
        accessorKey: "StoreName",
        header: "Store",
      },
      {
        accessorKey: "Status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.Status;
          return (
            <Badge variant={status === "Posted" ? "default" : "secondary"}>
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleView(row.original)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchKey="DP_Number"
        emptyTitle="No Dispatch Plans Found"
        emptyDescription="There are currently no posted dispatch plans."
      />
      <PdarDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedRecord}
      />
    </>
  );
}
