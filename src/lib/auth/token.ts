export function getAccessToken(): string | null {
  // Option A (recommended): stored after login
  if (typeof window !== "undefined") {
    const t = window.localStorage.getItem("access_token");
    if (t) return t;
  }

  // Option B: env token fallback (dev/service token)
  const env = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;
  return env ?? null;
}
