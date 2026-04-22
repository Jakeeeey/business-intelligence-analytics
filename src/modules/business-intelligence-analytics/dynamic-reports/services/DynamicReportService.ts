/**
 * Service for handling dynamic report configurations and data fetching.
 */
export class DynamicReportService {
  private static BASE_ROUTE = "/api/bia/dynamic-reports";
  private static COLLECTION = "dynamic_reports";

  /**
   * Fetch all registered report endpoints from Directus.
   */
  static async getRegisteredReports() {
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
  static async registerReport(name: string, url: string) {
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
  static async updateReport(id: string | number, name: string, url: string) {
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
  static async deleteReport(id: string | number) {
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
  static async fetchReportData(targetUrl: string) {
    const response = await fetch(`${this.BASE_ROUTE}?targetUrl=${encodeURIComponent(targetUrl)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch report data");
    }
    return await response.json();
  }
}
