import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const UPSTREAM_BASE = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const p = parts[1];
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function getApproverByUserId(userId: string) {
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
  const url = `${upstream}/items/target_setting_approver?filter[approver_id][_eq]=${userId}&filter[is_deleted][_eq]=0`;

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` },
    cache: "no-store"
  });
  const json = await res.json();

  return json.data?.[0] || null;
}

export async function GET(req: NextRequest) {
  if (!UPSTREAM_BASE) return NextResponse.json({ error: "Config Error" }, { status: 500 });

  const path = req.nextUrl.searchParams.get("path");
  const period = req.nextUrl.searchParams.get("period");
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");

  try {
    if (path === "auth/check") {
      const cookieStore = await cookies();
      const token = cookieStore.get("vos_access_token")?.value;

      if (!token) return NextResponse.json({ isApprover: false, approver: null, totalApprovers: 0 });

      const payload = decodeJwtPayload(token);
      const userId = payload?.sub;

      const [approver, countRes] = await Promise.all([
        userId ? getApproverByUserId(userId) : null,
        fetch(`${upstream}/items/target_setting_approver?filter[is_deleted][_eq]=0&aggregate[count]=*`, {
          headers: { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` },
          cache: "no-store"
        })
      ]);

      const countJson = await countRes.json();
      const totalApprovers = parseInt(countJson.data?.[0]?.count ?? "0");

      return NextResponse.json({
        isApprover: !!approver,
        approver,
        totalApprovers
      });
    }

    if (path === "executive") {
      if (!period) return NextResponse.json({ error: "Period required" }, { status: 400 });
      const url = `${upstream}/items/target_setting_executive?filter[fiscal_period][_eq]=${period}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` },
        cache: "no-store"
      });
      return NextResponse.json(await res.json());
    }

    if (path === "record") {
      if (!period) return NextResponse.json({ error: "Period required" }, { status: 400 });
      const recordId = req.nextUrl.searchParams.get("record_id");
      let url = `${upstream}/items/target_setting_approvals?filter[target_period][_eq]=${period}`;
      if (recordId) {
        url += `&filter[target_record_id][_eq]=${recordId}`;
      }
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` },
        cache: "no-store"
      });
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "Invalid path" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!UPSTREAM_BASE) return NextResponse.json({ error: "Config Error" }, { status: 500 });
  const path = req.nextUrl.searchParams.get("path");

  if (path === "submit") {
    try {
      const body = await req.json();
      const { target_record_id, target_period, approver_id, status } = body;
      const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
      const authHeader = { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` };

      if (!target_record_id || !target_period || !approver_id || !status) {
        return NextResponse.json({ error: "Missing required fields (record_id, period, approver, status)" }, { status: 400 });
      }

      // 1. Fetch total active approvers for the quorum (Dynamic Count)
      const countRes = await fetch(`${upstream}/items/target_setting_approver?filter[is_deleted][_eq]=0&aggregate[count]=*`, {
        headers: authHeader, cache: "no-store"
      });
      const countJson = await countRes.json();
      const totalApprovers = parseInt(countJson.data?.[0]?.count ?? "0");

      if (totalApprovers === 0) {
        return NextResponse.json({ error: "No active approvers found in system configuration." }, { status: 500 });
      }

      // 2. Upsert approval record for THIS specific approver, target record, and period
      // Isolation: We filter by record_id to ensure we don't overwrite votes for other targets or periods
      const checkUrl = `${upstream}/items/target_setting_approvals?filter[target_record_id][_eq]=${target_record_id}&filter[target_setting_approver_id][_eq]=${approver_id}`;
      const checkRes = await fetch(checkUrl, { headers: authHeader, cache: "no-store" });
      const { data: existingRecords } = await checkRes.json();

      const payload = {
        target_period,
        target_record_id,
        status,
        target_setting_approver_id: approver_id,
        approved_at: new Date().toISOString()
      };

      if (existingRecords && existingRecords.length > 0) {
        await fetch(`${upstream}/items/target_setting_approvals/${existingRecords[0].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${upstream}/items/target_setting_approvals`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(payload)
        });
      }

      // 3. Evaluate consensus ONLY for the current target record
      const allVotesRes = await fetch(`${upstream}/items/target_setting_approvals?filter[target_record_id][_eq]=${target_record_id}`, {
        headers: authHeader, cache: "no-store"
      });
      const { data: allVotes } = await allVotesRes.json();

      const approvalsCount = allVotes.filter((v: any) => v.status === 'APPROVED').length;
      const rejectionsCount = allVotes.filter((v: any) => v.status === 'REJECTED').length;

      let finalStatus = 'DRAFT';
      if (rejectionsCount > 0) {
        finalStatus = 'REJECTED';
      } else if (approvalsCount >= totalApprovers) {
        finalStatus = 'APPROVED';
      }

      // 4. Status Propagation
      // We only update the hierarchy if we've reached a terminal state (APPROVED or REJECTED)
      if (finalStatus !== 'DRAFT') {
        // Create audit snapshot if status is APPROVED or REJECTED
        if (finalStatus === 'APPROVED' || finalStatus === 'REJECTED') {
          try {
            const triggerEvent = finalStatus === 'APPROVED' ? 'APPROVAL' : 'REJECTION';
            const notes = finalStatus === 'APPROVED'
              ? "Target successfully approved by quorum"
              : "Target rejected by a member of the quorum";

            const auditRes = await fetch(`${req.nextUrl.origin}/api/bia/crm/target-setting/audit-trail`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": req.headers.get("authorization") || ""
              },
              body: JSON.stringify({
                fiscal_period: target_period,
                trigger_event: triggerEvent,
                user_id: approver_id,
                notes: notes
              })
            });

            if (!auditRes.ok) {
              console.error(`Failed to create audit snapshot on ${triggerEvent}:`, await auditRes.text());
            } else {
              const auditData = await auditRes.json();
              console.log(`Audit snapshot created on ${triggerEvent}:`, auditData.summary);
            }
          } catch (auditError) {
            console.error(`Audit trail creation error on ${finalStatus}:`, auditError);
          }
        }

        const collections = [
          'target_setting_executive',
          'target_setting_division',
          'target_setting_supplier',
          'target_setting_supervisor',
          'target_setting_salesman'
        ];

        // Propagate to all tables for this fiscal period
        await Promise.all(collections.map(async (col) => {
          const listRes = await fetch(`${upstream}/items/${col}?filter[fiscal_period][_eq]=${target_period}&fields=id`, {
            headers: authHeader, cache: "no-store"
          });
          const { data: items } = await listRes.json();
          if (items && items.length > 0) {
            await Promise.all(items.map((item: any) =>
              fetch(`${upstream}/items/${col}/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify({ status: finalStatus })
              })
            ));
          }
        }));
      }

      return NextResponse.json({
        success: true,
        finalStatus,
        stats: {
          approved: approvalsCount,
          rejected: rejectionsCount,
          total_required: totalApprovers,
          quorum_reached: finalStatus !== 'DRAFT'
        }
      });
    } catch (error) {
      console.error("Submit Error:", error);
      return NextResponse.json({ error: String(error) }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid path" }, { status: 404 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
