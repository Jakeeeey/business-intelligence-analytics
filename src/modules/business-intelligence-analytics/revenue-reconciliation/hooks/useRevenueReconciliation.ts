import { useState, useEffect } from 'react';
import { fetchReconciliationData } from '../providers/fetchProvider';
import { ReconciliationData } from '../types';

export function useRevenueReconciliation() {
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [datePreset, setDatePreset] = useState('this-month');
  
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [hasInitializedSuppliers, setHasInitializedSuppliers] = useState(false);

  useEffect(() => {
    if (datePreset !== 'custom') {
      const now = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      let start = new Date();
      let end = new Date();

      switch (datePreset) {
        case 'all-time':
          start = new Date('2000-01-01');
          end = new Date('2099-12-31');
          break;
        case 'today':
          break;
        case 'tomorrow':
          start.setDate(now.getDate() + 1);
          end.setDate(now.getDate() + 1);
          break;
        case 'yesterday':
          start.setDate(now.getDate() - 1);
          end.setDate(now.getDate() - 1);
          break;
        case 'this-week':
          const day = now.getDay() || 7; // Get current day number, converting Sun. to 7
          if (day !== 1) start.setHours(-24 * (day - 1)); // Set to Monday
          end = new Date(start);
          end.setDate(start.getDate() + 6); // Set to Sunday
          break;
        case 'this-month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'this-year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
      }
      
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    }
  }, [datePreset]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/bia/revenue-reconciliation/suppliers');
      if (res.ok) {
        const json = await res.json();
        const dataArray = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
        
        const tradeSuppliers = dataArray.filter((s: { supplier_type?: string }) => 
          s.supplier_type && s.supplier_type.trim().toUpperCase() === 'TRADE'
        );

        const mapped = tradeSuppliers.map((s: { id?: string | number; supplier_name?: string }) => ({
          id: s.id ? String(s.id) : '',
          name: s.supplier_name || 'Unknown Supplier'
        }));

        setSuppliersList(mapped);

        if (!hasInitializedSuppliers) {
          setSelectedSuppliers(mapped.map((s: { id: string }) => s.id));
          setHasInitializedSuppliers(true);
        }
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchReconciliationData(startDate, endDate);
      setData(result);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAllSelected = selectedSuppliers.length === suppliersList.length && suppliersList.length > 0;

  const metrics = {
    po: 0,
    si: 0,
    remittance: 0,
    variancePoVsSi: 0,
    varianceSiVsRemittance: 0,
    totalVariance: 0,
  };

  if (data) {
    if (isAllSelected && data.summary) {
      metrics.po = data.summary.totalPurchaseOrder || 0;
      metrics.si = data.summary.totalSalesInvoice || 0;
      metrics.remittance = data.summary.totalRemittance || 0;
    } else if (data.bySupplier && selectedSuppliers.length > 0) {
      data.bySupplier.forEach(s => {
        if (selectedSuppliers.includes(String(s.supplierId))) {
          metrics.po += s.totalPurchaseOrder || 0;
          metrics.si += s.totalSalesInvoice || 0;
          metrics.remittance += s.totalRemittance || 0;
        }
      });
    }

    // Always mathematically calculate absolute variances based on the final totals
    metrics.variancePoVsSi = Math.abs(metrics.po - metrics.si);
    metrics.varianceSiVsRemittance = Math.abs(metrics.si - metrics.remittance);
    metrics.totalVariance = metrics.variancePoVsSi + metrics.varianceSiVsRemittance;
  }

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(suppliersList.map(s => s.id));
    }
  };

  return {
    data,
    loading,
    datePreset,
    setDatePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    suppliersList,
    selectedSuppliers,
    isAllSelected,
    metrics,
    loadData,
    toggleSupplier,
    toggleAll
  };
}
