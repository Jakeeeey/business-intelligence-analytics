import { RegisteredReport, ReportData, PivotConfig } from "../types";

export interface ReportLayout {
  id: string | number;
  name: string;
  dynamic_report_id: string;
  config: PivotConfig;
}

/**
 * Service for handling dynamic report configurations and data fetching.
 */
export class DynamicReportService {
  private static BASE_ROUTE = "/api/bia/dynamic-reports";
  private static COLLECTION = "dynamic_reports";

  /**
   * Fetch all registered report endpoints from Directus.
   */
  static async getRegisteredReports(): Promise<RegisteredReport[]> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=${this.COLLECTION}`);
    if (!response.ok) {
      throw new Error("Failed to fetch report configurations");
    }
    const result = await response.json();
    return result.data || [];
  }

  /**
   * Register a new report endpoint.
   */
  static async registerReport(name: string, url: string): Promise<RegisteredReport> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=${this.COLLECTION}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to register report");
    }
    return await response.json();
  }

  /**
   * Update an existing report endpoint.
   */
  static async updateReport(id: string | number, name: string, url: string): Promise<RegisteredReport> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=${this.COLLECTION}&id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update report");
    }
    return await response.json();
  }

  /**
   * Delete a report endpoint.
   */
  static async deleteReport(id: string | number): Promise<boolean> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=${this.COLLECTION}&id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete report");
    }
    return true;
  }

  /**
   * Fetch data from a Spring Boot URL via the proxy.
   */
  static async fetchReportData(targetUrl: string): Promise<ReportData[]> {
    const response = await fetch(`${this.BASE_ROUTE}?targetUrl=${encodeURIComponent(targetUrl)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch report data");
    }
    return await response.json();
  }

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT PERSISTENCE (Directus)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Save a new pivot layout configuration.
   */
  static async saveLayout(reportId: string, name: string, config: PivotConfig): Promise<ReportLayout> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=dynamic_report_layouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        dynamic_report_id: reportId, 
        name, 
        config: JSON.stringify(config) // Store as string for robustness if JSON field not auto-parsed
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save layout");
    }
    const result = await response.json();
    return result.data;
  }

  /**
   * Update an existing pivot layout configuration.
   */
  static async updateLayout(id: string | number, config: PivotConfig): Promise<ReportLayout> {
    const configStr = typeof config === 'string' ? config : JSON.stringify(config);
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=dynamic_report_layouts&id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        config: configStr 
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update layout");
    }
    const result = await response.json();
    const updated = result.data;
    return {
      ...updated,
      config: typeof updated.config === 'string' ? JSON.parse(updated.config) : updated.config
    };
  }

  /**
   * Get all saved layouts for a specific report.
   */
  static async getLayouts(reportId: string): Promise<ReportLayout[]> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=dynamic_report_layouts&filter[dynamic_report_id][_eq]=${reportId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch layouts");
    }
    const result = await response.json();
    const layouts = result.data || [];
    return layouts.map((l: { id: string | number; name: string; dynamic_report_id: string; config: string | PivotConfig }) => ({
      ...l,
      config: typeof l.config === 'string' ? JSON.parse(l.config) : l.config
    }));
  }

  /**
   * Delete a saved layout.
   */
  static async deleteLayout(id: string | number): Promise<boolean> {
    const response = await fetch(`${this.BASE_ROUTE}?directusCollection=dynamic_report_layouts&id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok && response.status !== 204) {
      throw new Error("Failed to delete layout");
    }
    return true;
  }
}
