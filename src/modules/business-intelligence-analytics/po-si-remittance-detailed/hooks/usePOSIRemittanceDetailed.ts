import { useState, useEffect } from 'react';
import { fetchDetailedRemittanceData } from '../providers/fetchProvider';
import { POSIRemittanceDetailedData, DetailedMetricRow, POSIRemittanceDetailedAPIResponse } from '../types';

const formatLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getInitialThisMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: formatLocal(start),
    end: formatLocal(end)
  };
};

export function usePOSIRemittanceDetailed() {
  const [data, setData] = useState<POSIRemittanceDetailedData | null>(null);
  const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const initialDates = getInitialThisMonth();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [datePreset, setDatePreset] = useState('this-month');
  
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [hasInitializedSuppliers, setHasInitializedSuppliers] = useState(false);

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    
    if (preset !== 'custom') {
      const now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (preset) {
        case 'all-time':
          start = new Date(2000, 0, 1);
          end = new Date(2099, 11, 31);
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
          const day = now.getDay() || 7; 
          start.setDate(now.getDate() - (day - 1)); 
          end = new Date(start);
          end.setDate(start.getDate() + 6); 
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
      
      const newStart = formatLocal(start);
      const newEnd = formatLocal(end);
      
      setStartDate(newStart);
      setEndDate(newEnd);
      
      setLoading(true);
      fetchDetailedRemittanceData(newStart, newEnd, selectedSuppliers.join(','))
        .then(data => setRawData(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  const [rawData, setRawData] = useState<POSIRemittanceDetailedAPIResponse[]>([]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/bia/po-si-remittance/suppliers');
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
    if (selectedSuppliers.length === 0) {
      setRawData([]);
      return;
    }
    
    setLoading(true);
    try {
      const supplierIdsToFetch = selectedSuppliers.join(',');
      const fetchedData = await fetchDetailedRemittanceData(startDate, endDate, supplierIdsToFetch);
      setRawData(fetchedData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Process data purely on the frontend whenever rawData or selectedSuppliers changes
  useEffect(() => {
    const supplierMap = new Map(suppliersList.map(s => [s.id, s.name]));

    let totalPoAmount = 0;
    let totalCustomerPoAmount = 0;
    let totalAllocatedAmount = 0;
    let totalSiAmount = 0;
    let totalRemittanceAmount = 0;
    let totalUnfulfilledAmount = 0;
    let totalReturnAmount = 0;
    let totalShortage = 0;
    let totalVariance = 0;

    const filteredRows: DetailedMetricRow[] = [];

    rawData.forEach(item => {
      const supplierIdStr = String(item.supplierId);
      
      if (selectedSuppliers.includes(supplierIdStr)) {
        const poAmount = Number(item.poAmount) || 0;
        const customerPoAmount = Number(item.customerPoAmount) || 0;
        const allocatedAmount = Number(item.allocatedAmount) || 0;
        const siAmount = Number(item.siAmount) || 0;
        const remittanceAmount = Number(item.remittanceAmount) || 0;
        const unfulfilledAmount = Number(item.unfulfilledAmount) || 0;
        const returnAmount = Number(item.returnAmount) || 0;
        const shortage = Number(item.shortage) || 0;

        const variance = poAmount - remittanceAmount;

        totalPoAmount += poAmount;
        totalCustomerPoAmount += customerPoAmount;
        totalAllocatedAmount += allocatedAmount;
        totalSiAmount += siAmount;
        totalRemittanceAmount += remittanceAmount;
        totalUnfulfilledAmount += unfulfilledAmount;
        totalReturnAmount += returnAmount;
        totalShortage += shortage;
        totalVariance += variance;

        filteredRows.push({
          ...item,
          poAmount,
          customerPoAmount,
          allocatedAmount,
          siAmount,
          remittanceAmount,
          unfulfilledAmount,
          returnAmount,
          shortage,
          supplierName: supplierMap.get(supplierIdStr) || `Supplier ${item.supplierId}`,
          variance
        });
      }
    });

    setData({
      summary: {
        totalPoAmount,
        totalCustomerPoAmount,
        totalAllocatedAmount,
        totalSiAmount,
        totalRemittanceAmount,
        totalUnfulfilledAmount,
        totalReturnAmount,
        totalShortage,
        totalVariance
      },
      rows: filteredRows
    });
  }, [rawData, selectedSuppliers, suppliersList]);

  useEffect(() => {
    fetchSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when suppliers list changes (initial load)
  useEffect(() => {
    if (hasInitializedSuppliers) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitializedSuppliers]);

  const isAllSelected = selectedSuppliers.length === suppliersList.length && suppliersList.length > 0;

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

  const metrics = {
    po: data?.summary?.totalPoAmount || 0,
    si: data?.summary?.totalSiAmount || 0,
    remittance: data?.summary?.totalRemittanceAmount || 0,
    variancePoVsSi: (data?.summary?.totalPoAmount || 0) - (data?.summary?.totalSiAmount || 0),
    varianceSiVsRemittance: (data?.summary?.totalSiAmount || 0) - (data?.summary?.totalRemittanceAmount || 0),
    variancePoVsRemittance: (data?.summary?.totalPoAmount || 0) - (data?.summary?.totalRemittanceAmount || 0),
    totalVariance: ((data?.summary?.totalPoAmount || 0) - (data?.summary?.totalSiAmount || 0)) + ((data?.summary?.totalSiAmount || 0) - (data?.summary?.totalRemittanceAmount || 0)),
  };

  return {
    data,
    loading,
    datePreset,
    setDatePreset: handleDatePresetChange,
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
