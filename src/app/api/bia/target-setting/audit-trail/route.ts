import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const UPSTREAM_BASE = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function getManilaTimestamp() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
  const p: Record<string, string> = {};
  parts.forEach((part) => (p[part.type] = part.value));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/**
 * POST /api/bia/target-setting/audit-trail
 * Creates an audit snapshot of the complete target hierarchy and approval votes
 */
export async function POST(req: NextRequest) {
  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const upstream = UPSTREAM_BASE.replace(/\/+$/, "");
  const authHeader = { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` };

  try {
    const body = await req.json();
    const { fiscal_period, trigger_event, user_id, notes } = body;

    if (!fiscal_period || !trigger_event) {
      return NextResponse.json(
        { error: "fiscal_period and trigger_event are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Executive Target
    const execRes = await fetch(
      `${upstream}/items/target_setting_executive?filter[fiscal_period][_eq]=${fiscal_period}&limit=1`,
      { headers: authHeader, cache: "no-store" }
    );
    const execData = await execRes.json();
    const executive = execData.data?.[0] || null;

    if (!executive) {
      return NextResponse.json(
        { error: "No executive target found for this fiscal period" },
        { status: 404 }
      );
    }

    // 2. Fetch All Allocations for this Fiscal Period
    const [divisionsRes, suppliersRes, supervisorsRes, salesmenRes] = await Promise.all([
      fetch(`${upstream}/items/target_setting_division?filter[fiscal_period][_eq]=${fiscal_period}`, {
        headers: authHeader,
        cache: "no-store"
      }),
      fetch(`${upstream}/items/target_setting_supplier?filter[fiscal_period][_eq]=${fiscal_period}`, {
        headers: authHeader,
        cache: "no-store"
      }),
      fetch(`${upstream}/items/target_setting_supervisor?filter[fiscal_period][_eq]=${fiscal_period}`, {
        headers: authHeader,
        cache: "no-store"
      }),
      fetch(`${upstream}/items/target_setting_salesman?filter[fiscal_period][_eq]=${fiscal_period}`, {
        headers: authHeader,
        cache: "no-store"
      })
    ]);

    const divisions = (await divisionsRes.json()).data || [];
    const suppliers = (await suppliersRes.json()).data || [];
    const supervisors = (await supervisorsRes.json()).data || [];
    const salesmen = (await salesmenRes.json()).data || [];

    // 3. Fetch Approval Records
    const approvalsRes = await fetch(
      `${upstream}/items/target_setting_approvals?filter[target_period][_eq]=${fiscal_period}`,
      { headers: authHeader, cache: "no-store" }
    );
    const approvals = (await approvalsRes.json()).data || [];

    // 4. Calculate Approval Summary
    const approvedCount = approvals.filter((a: any) => a.status === 'APPROVED').length;
    const rejectedCount = approvals.filter((a: any) => a.status === 'REJECTED').length;
    const hasRejection = rejectedCount > 0;

    // Get total active approvers count
    const approversRes = await fetch(
      `${upstream}/items/target_setting_approver?filter[is_deleted][_eq]=0&aggregate[count]=*`,
      { headers: authHeader, cache: "no-store" }
    );
    const approversData = await approversRes.json();
    const totalApprovers = approversData.data?.[0]?.count || 0;

    // Determine overall status
    let approvalStatus = 'PENDING';
    if (trigger_event === 'REOPEN_TO_DRAFT') {
      approvalStatus = 'DRAFT';
    } else if (hasRejection) {
      approvalStatus = 'REJECTED';
    } else if (approvedCount >= totalApprovers && totalApprovers > 0) {
      approvalStatus = 'APPROVED';
    } else if (executive.status === 'DRAFT') {
      approvalStatus = 'DRAFT';
    }

    // 5. Create Audit Snapshot
    const snapshot = {
      fiscal_period,
      trigger_event,
      triggered_by_user_id: user_id || null,
      approval_status: approvalStatus,
      total_approvers: totalApprovers,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      executive_data: JSON.stringify(executive),
      division_allocations: JSON.stringify(divisions),
      supplier_allocations: JSON.stringify(suppliers),
      supervisor_allocations: JSON.stringify(supervisors),
      salesman_allocations: JSON.stringify(salesmen),
      approval_votes: JSON.stringify(approvals),
      notes: notes || null,
      user_created: user_id || null,
      snapshot_timestamp: getManilaTimestamp()
    };

    const createRes = await fetch(`${upstream}/items/target_setting_audit_trail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      },
      body: JSON.stringify(snapshot)
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Failed to create audit snapshot: ${error}`);
    }

    const result = await createRes.json();

    return NextResponse.json({
      success: true,
      data: result.data,
      summary: {
        fiscal_period,
        trigger_event,
        approval_status: approvalStatus,
        total_approvers: totalApprovers,
        approved_count: approvedCount,
        rejected_count: rejectedCount,
        records_captured: {
          divisions: divisions.length,
          suppliers: suppliers.length,
          supervisors: supervisors.length,
          salesmen: salesmen.length,
          approvals: approvals.length
        }
      }
    });

  } catch (error) {
    console.error("Audit trail creation error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204 });
}

/**
 * GET /api/bia/target-setting/audit-trail
 * Fetches audit trail logs with pagination, sorting, and filtering
 */
export async function GET(req: NextRequest) {
  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const upstream = UPSTREAM_BASE.replace(/\/+$/, "");
  const authHeader = { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` };

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sort_by") || "snapshot_timestamp";
    const sortOrder = searchParams.get("sort_order") || "desc";
    const search = searchParams.get("search") || "";
    const fiscalPeriod = searchParams.get("fiscal_period") || "";
    const eventType = searchParams.get("trigger_event") || "";

    const offset = (page - 1) * limit;

    // Build Directus filter
    const filter: any = {
      _and: []
    };

    if (fiscalPeriod) {
      filter._and.push({ fiscal_period: { _eq: fiscalPeriod } });
    }

    if (eventType) {
      filter._and.push({ trigger_event: { _eq: eventType } });
    }

    if (search) {
      // Basic search logic - extend as needed
      // Directus _search on specific fields or complex OR logic
      // Note: Directus free text search might be limited on some fields
      filter._and.push({
        _or: [
          { notes: { _icontains: search } },
          { approval_status: { _icontains: search } }
          // Add other searchable fields if needed
        ]
      });
    }

    // Prepare query params
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      sort: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      meta: "filter_count", // To get total count
      filter: JSON.stringify(filter)
    });

    const response = await fetch(`${upstream}/items/target_setting_audit_trail?${queryParams.toString()}`, {
      headers: authHeader,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      data: data.data,
      meta: {
        total: data.meta?.filter_count || 0,
        page,
        limit,
        totalPages: Math.ceil((data.meta?.filter_count || 0) / limit)
      }
    });

  } catch (error) {
    console.error("Audit trail fetch error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
