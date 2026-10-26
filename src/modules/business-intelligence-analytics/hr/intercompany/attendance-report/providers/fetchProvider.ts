import { IntercompanyAttendanceData, IntercompanyAttendanceFilters } from "../types";

const API_BASE = "/api/bia/hr/intercompany/attendance-report";

export async function fetchIntercompanyAttendanceData(
  filters: Partial<IntercompanyAttendanceFilters> & { force?: boolean },
  signal?: AbortSignal
): Promise<IntercompanyAttendanceData> {
  const query = new URLSearchParams();
  if (filters.date) {
    query.append("date", filters.date);
  }
  if (filters.force) {
    query.append("force", "true");
  }

  const qs = query.toString();
  const url = `${API_BASE}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        `Failed to fetch intercompany attendance data (${res.status})`
    );
  }

  return res.json();
}
