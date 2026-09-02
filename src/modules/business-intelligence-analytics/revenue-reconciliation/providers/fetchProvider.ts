import { ReconciliationData } from '../types';

export const fetchReconciliationData = async (
  startDate: string,
  endDate: string,
  supplierId?: string
): Promise<ReconciliationData> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (supplierId && supplierId !== 'all') {
    params.append('supplierId', supplierId);
  }

  const response = await fetch(`/api/bia/revenue-reconciliation?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reconciliation data');
  }

  return response.json();
};
