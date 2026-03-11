import { VSalesPerformanceDataDto } from "../../executive-health/types";
import { TargetSettingResponse } from "../types";

/**
 * Fetches raw sales data for salesman performance analysis.
 * Reuses the managerial data endpoint as it contains the necessary 
 * salesmanName and netAmount fields.
 */
export const fetchSalesmanData = async (startDate: string, endDate: string): Promise<VSalesPerformanceDataDto[]> => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
      _t: new Date().getTime().toString() // Cache Buster to force fresh data
    });

    const url = `/api/bia/crm/target-setting-reports/salesman-kpi?${params.toString()}`;

    console.log(`[Salesman Fetch] Requesting: ${startDate} to ${endDate}`);

    // Set a 15-second timeout to prevent hanging on 502/504 errors
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      console.error("Unauthorized: Session may have expired.");
      return [];
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Return empty array if data is null or undefined to prevent UI crashes
    return Array.isArray(data) ? data : [];

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Salesman Fetch: The request timed out.");
    } else {
      console.error("Salesman Fetch Error:", error instanceof Error ? error.message : "Unknown error");
    }
    throw error;
  }
};

/**
 * Fetches dynamic targets for salesman data.
 */
export const fetchDynamicTargets = async (startDate: string, endDate: string): Promise<TargetSettingResponse> => {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const url = `/api/bia/crm/target-setting-reports/managerial-supplier/targets?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API Request failed with status ${response.status}`);
    }

    const result = await response.json();

    console.log('[Fetch Targets] Response:', {
      salesmanTargetsCount: result.salesmanTargets?.length || 0,
      supplierTargetsCount: result.supplierTargets?.length || 0,
      sampleSalesmanTarget: result.salesmanTargets?.[0]
    });

    return result;
  } catch (error: unknown) {
    console.error("Fetch Salesman Targets Error:", error instanceof Error ? error.message : "Unknown error");
    return { divisionTargets: [], supplierTargets: [], supervisorTargets: [], salesmanTargets: [] };
  }
};