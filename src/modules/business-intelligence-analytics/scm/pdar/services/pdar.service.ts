import { PdarResponse } from "../types/pdar.schema";

export async function fetchPdarData(
    params?: Record<string, string>,
): Promise<PdarResponse> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`/api/bia/scm/pdar${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text();
        let msg = `Failed to fetch PDAR data: ${res.statusText}`;
        try {
            const parsed = JSON.parse(text);
            if (parsed.message) msg = parsed.message;
            else if (parsed.error) msg = parsed.error;
        } catch {}
        throw new Error(msg);
    }

    return res.json();
}
