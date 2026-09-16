import { ExpirationRecord, ExpirationFilters } from "../types";

export const fetchAllExpirationData = async (): Promise<ExpirationRecord[]> => {
  try {
    const response = await fetch(`/api/bia/expiration-monitoring`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching expiration data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch all expiration data:", error);
    return [];
  }
};

export const fetchFilteredExpirationData = async (filters: ExpirationFilters): Promise<ExpirationRecord[]> => {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            queryParams.append(key, value.join(','));
          }
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/bia/expiration-monitoring?action=filter${queryString ? `&${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching filtered expiration data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch filtered expiration data:", error);
    return [];
  }
};
