import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

function authHeaders() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (STATIC_TOKEN) h.Authorization = `Bearer ${STATIC_TOKEN}`;
  return h;
}

async function fetchDirectus(path: string) {
  const url = `${UPSTREAM}/${path.startsWith("/") ? path.slice(1) : path}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Directus Error (${res.status}):`, errorText);
    throw new Error(`Directus error: ${res.status}`);
  }

  return await res.json();
}

export async function GET(req: NextRequest) {
  try {
    // Debug info (Remove after fixing)
    const debugInfo = {
        upstream: UPSTREAM,
        tokenLength: STATIC_TOKEN?.length || 0,
        tokenPrefix: STATIC_TOKEN?.substring(0, 5) + "..."
    };

    // 1. Fetch all supervisors per division
    const spdRes = await fetchDirectus(
      "items/supervisor_per_division?fields=id,division_id,supervisor_id&limit=-1"
    );
    const spdData = spdRes.data || [];

    if (spdData.length === 0) {
        return NextResponse.json({ supervisors: [], salesmanMappings: [], salesmanMaster: [] });
    }

    // 2. Fetch all salesman per supervisor mappings
    const spsRes = await fetchDirectus(
      "items/salesman_per_supervisor?fields=id,supervisor_per_division_id,salesman_id&limit=-1"
    );
    const spsData = spsRes.data || [];

    // 3. Fetch all salesman names and codes for detail
    const salesmanRes = await fetchDirectus(
      "items/salesman?fields=id,salesman_name,salesman_code&limit=-1"
    );
    const salesmanData = salesmanRes.data || [];

    // 4. Fetch only relevant users to get supervisor names
    const uniqueSupervisorIds = Array.from(new Set(spdData.map((s: any) => s.supervisor_id).filter(Boolean)));
    
    let usersData: any[] = [];
    if (uniqueSupervisorIds.length > 0) {
        // SCHEMA DETECTION: The Dummy (8056) and Live (8091) servers have different schemas for the 'user' table.
        // 8056: id, user_firstname, user_lastname
        // 8091: user_id, user_fname, user_lname
        const isDummy = UPSTREAM.includes("8056");
        const idField = isDummy ? "id" : "user_id";
        
        try {
            const usersRes = await fetchDirectus(
                `items/user?filter[${idField}][_in]=${uniqueSupervisorIds.join(",")}&limit=-1`
            );
            usersData = usersRes.data || [];
        } catch (e: any) {
            console.error("Schema detection fallback triggered:", e.message);
            // If the detection above failed, try the other one as a final fallback
            const fallbackField = isDummy ? "user_id" : "id";
            try {
                const usersRes = await fetchDirectus(
                    `items/user?filter[${fallbackField}][_in]=${uniqueSupervisorIds.join(",")}&limit=-1`
                );
                usersData = usersRes.data || [];
            } catch {
                usersData = [];
            }
        }
    }
    
    const usersMap = new Map<string, any>(usersData.map((u: any) => [String(u.id || u.user_id), u]));

    // 5. Enrich spdData with user details
    const enrichedSupervisors = spdData.map((s: any) => {
        const user = usersMap.get(String(s.supervisor_id));
        return {
            ...s,
            supervisor_id: user ? {
                id: user.id || user.user_id,
                first_name: user.user_fname || user.user_firstname || "Unknown",
                last_name: user.user_lname || user.user_lastname || ""
            } : {
                id: s.supervisor_id,
                first_name: "Super",
                last_name: `ID ${s.supervisor_id}`
            }
        };
    });

    return NextResponse.json({
        supervisors: enrichedSupervisors,
        salesmanMappings: spsData,
        salesmanMaster: salesmanData
    });

  } catch (error: any) {
    console.error("[Supervisor mapping API error]:", error.message);
    return NextResponse.json({ 
        error: error.message, 
        debug: {
            upstream: UPSTREAM,
            hasToken: !!STATIC_TOKEN
        }
    }, { status: 500 });
  }
}
