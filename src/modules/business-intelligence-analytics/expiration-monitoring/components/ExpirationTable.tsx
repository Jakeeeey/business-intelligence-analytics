"use client";

import * as React from "react";
import { ExpirationRecord } from "../types";
import { AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getExpirationStatus } from "../hooks/useExpirationMonitoring";

interface ExpirationTableProps {
  data: ExpirationRecord[];
  loading: boolean;
}

export function ExpirationTable({ data, loading }: ExpirationTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val || 0);
  };

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
        <h3 className="text-sm font-black tracking-widest uppercase text-foreground">
          Expiration Records
        </h3>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
            Expired
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            &lt; 3 Months
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
            &lt; 6 Months
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Lot / Batch</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Total Cost</th>
              <th className="px-4 py-3">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-xs uppercase tracking-widest">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-xs uppercase tracking-widest">
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const status = getExpirationStatus(row.expiryDate);
                
                let rowColor = "";
                let badgeColor = "";

                if (status === "EXPIRED") {
                  rowColor = "bg-rose-600/10 hover:bg-rose-600/15";
                  badgeColor = "bg-rose-600/20 text-rose-700 dark:text-rose-400 border-rose-600/30";
                } else if (status === "CRITICAL") {
                  rowColor = "bg-red-500/10 hover:bg-red-500/20";
                  badgeColor = "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
                } else if (status === "WARNING") {
                  rowColor = "bg-orange-500/5 hover:bg-orange-500/10";
                  badgeColor = "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
                }

                return (
                  <tr 
                    key={`${row.purchaseOrderProductId}-${idx}`}
                    className={`hover:bg-muted/20 transition-colors ${rowColor}`}
                  >
                    <td className="px-4 py-3 font-medium text-xs">{row.receiptNo || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs truncate max-w-[250px]" title={row.productName}>{row.productName}</span>
                        <span className="text-[10px] text-muted-foreground">{row.productCode || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs truncate max-w-[200px]" title={row.supplierName}>
                      {row.supplierName || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs">{row.branchName || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs">{row.lotName || "-"}</span>
                        <span className="text-[10px] text-muted-foreground">Batch: {row.batchNo || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-xs">
                      {row.receivedQuantity ? row.receivedQuantity.toLocaleString() : "0"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-primary">
                      {formatCurrency(row.itemTotalCost)}
                    </td>
                    <td className="px-4 py-3">
                      {status !== "SAFE" ? (
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md border w-fit ${badgeColor}`}>
                          <AlertTriangle size={14} className="shrink-0" />
                          <span className="text-xs font-black tracking-wider uppercase">
                            {formatDate(row.expiryDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          {formatDate(row.expiryDate)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && data.length > 0 && (
        <div className="p-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2 border border-border/40 rounded-md bg-background focus:outline-none focus:border-primary"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
            <span className="hidden sm:inline-block ml-4">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="px-4 text-xs font-black uppercase tracking-widest flex items-center h-8">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
