import { NextRequest, NextResponse } from "next/server";
import { getJwtSubFromReq } from "@/lib/directus"; // Adjust import if needed

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(req: NextRequest) {
    // Get sub from the JWT token in cookies
    const sub = getJwtSubFromReq(req);

    if (!sub) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch all roles in parallel
        const [
            executiveRes,
            divisionHeadRes,
            supervisorRes,
            approverRes
        ] = await Promise.all([
            fetch(`${API_BASE}/items/executive?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0`),
            fetch(`${API_BASE}/items/division_sales_head?filter[user_id][_eq]=${sub}&filter[is_deleted][_eq]=0`),
            fetch(`${API_BASE}/items/supervisor_per_division?filter[supervisor_id][_eq]=${sub}&filter[is_deleted][_eq]=0`),
            fetch(`${API_BASE}/items/target_setting_approver?filter[approver_id][_eq]=${sub}&filter[is_deleted][_eq]=0`)
        ]);

        const [
            executiveData,
            divisionHeadData,
            supervisorData,
            approverData
        ] = await Promise.all([
            executiveRes.json(),
            divisionHeadRes.json(),
            supervisorRes.json(),
            approverRes.json()
        ]);

        const roles = {
            is_executive: executiveData.data?.length > 0,
            is_division_sales_head: divisionHeadData.data?.length > 0,
            is_supervisor: supervisorData.data?.length > 0,
            is_target_setting_approver: approverData.data?.length > 0,
        };

        return NextResponse.json({ roles }, { status: 200 });

    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
