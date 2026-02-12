"use client";

import { getAccessToken } from "@/lib/auth/token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy";

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
  skipBaseUrl?: boolean;
}

async function request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<{ data: T, status: number, statusText: string }> {
  try {
    const { params, headers, ...rest } = options;

    let url: URL;
    const base = API_BASE_URL.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (options.skipBaseUrl) {
      if (typeof window !== "undefined") {
        url = new URL(cleanEndpoint, window.location.origin);
      } else {
        url = new URL(cleanEndpoint, "http://localhost");
      }
    } else if (base.startsWith("http")) {
      url = new URL(`${base}${cleanEndpoint}`);
    } else {
      if (typeof window !== "undefined") {
        url = new URL(`${base}${cleanEndpoint}`, window.location.origin);
      } else {
        url = new URL(`${base}${cleanEndpoint}`, "http://localhost");
      }
    }

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (typeof value === "object" && value !== null) {
          appendParams(url, key, value);
        } else if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const token = getAccessToken();
    const headersMap = new Headers(headers as HeadersInit);
    headersMap.set("Content-Type", "application/json");
    if (token) {
      headersMap.set("Authorization", `Bearer ${token}`);
    }

    const finalUrl = url.toString();
    console.log(`[HTTPClient] Fetching: ${finalUrl}`); // DEBUG LOG

    const res = await fetch(finalUrl, {
      headers: headersMap,
      ...rest
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("access_token");
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      let errorBody;
      try {
        errorBody = await res.text();
        console.error(`[HTTPClient] Error ${res.status}:`, errorBody); // DEBUG LOG
      } catch (e) { }

      // Try to parse JSON error if possible
      try {
        const jsonError = JSON.parse(errorBody || "{}");
        if (jsonError.error) {
          throw new Error(jsonError.error);
        }
      } catch (e) { }

      throw new Error(errorBody || res.statusText);
    }

    const data = await res.json();
    return {
      data,
      status: res.status,
      statusText: res.statusText
    };

  } catch (error) {
    console.error("Fetch request failed:", error);
    throw error;
  }
}

function appendParams(url: URL, key: string, value: any) {
  if (Array.isArray(value)) {
    value.forEach(v => appendParams(url, `${key}[]`, v));
  } else if (typeof value === "object" && value !== null) {
    Object.keys(value).forEach(subKey => {
      appendParams(url, `${key}[${subKey}]`, value[subKey]);
    });
  } else {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  }
}

export const http = {
  get: <T = any>(endpoint: string, options?: FetchOptions) => request<T>(endpoint, { method: "GET", ...options }),
  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => request<T>(endpoint, { method: "POST", body: JSON.stringify(data), ...options }),
  put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => request<T>(endpoint, { method: "PUT", body: JSON.stringify(data), ...options }),
  patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data), ...options }),
  delete: <T = any>(endpoint: string, options?: FetchOptions) => request<T>(endpoint, { method: "DELETE", ...options }),
};
