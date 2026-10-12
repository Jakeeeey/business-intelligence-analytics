import { POSIRemittanceDetailedAPIResponse } from '../types';

export const fetchDetailedRemittanceData = async (
  startDate: string,
  endDate: string,
  supplierId?: string
): Promise<POSIRemittanceDetailedAPIResponse[]> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (supplierId && supplierId !== 'all') {
    params.append('supplierId', supplierId);
  }

  const response = await fetch(`/api/bia/po-si-remittance-detailed?${params.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details || errorData.error || 'Failed to fetch detailed remittance data';
    console.error('API Error:', errorMessage);
    throw new Error(errorMessage);
  }

  // Expecting an array of records per supplier and/or date
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
};
