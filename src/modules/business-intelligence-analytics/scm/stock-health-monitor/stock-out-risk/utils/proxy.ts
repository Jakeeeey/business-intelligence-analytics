import { cookies } from "next/headers";

const SPRING_API_BASE_URL = process.env.SPRING_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

const AUTH_PAYLOAD = {
  email: process.env.SPRING_AUTH_EMAIL || "",
  hashPassword: process.env.SPRING_AUTH_PASSWORD || "",
};

/**
 * Performs login to the SpringBoot API and stores the token in a cookie.
 */
async function performLogin(): Promise<string | null> {
  try {
    const res = await fetch(`${SPRING_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(AUTH_PAYLOAD),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[SCM Proxy – Stock-out Risk] Login failed with status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const token = data.token;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return token;
    }
  } catch (error) {
    console.error("[SCM Proxy – Stock-out Risk] Auth error:", error);
  }
  return null;
}

/**
 * Proxy request to SpringBoot API with automatic authentication.
 */
export async function scmProxyRequest(endpoint: string) {
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    console.log("[SCM Proxy – Stock-out Risk] Token missing, logging in...");
    token = (await performLogin()) ?? undefined;
  }

  if (!token) {
    return { error: "Authentication failed", status: 401 };
  }

  const fetchWithToken = async (t: string) => {
    return fetch(`${SPRING_API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      cache: "no-store",
    });
  };

  let response = await fetchWithToken(token);

  if (response.status === 401 || response.status === 403) {
    console.log("[SCM Proxy – Stock-out Risk] Token expired or invalid, retrying login...");
    token = (await performLogin()) ?? undefined;
    if (token) {
      response = await fetchWithToken(token);
    }
  }

  if (!response.ok) {
    return { error: `Backend error: ${response.statusText}`, status: response.status };
  }

  try {
    const data = await response.json();
    return { data, status: 200 };
  } catch {
    return { error: "Failed to parse backend response", status: 502 };
  }
}
