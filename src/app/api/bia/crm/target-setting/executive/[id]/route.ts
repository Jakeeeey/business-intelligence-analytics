import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const UPSTREAM_BASE = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function buildUpstreamUrl(req: NextRequest, subpath: string) {
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
  const url = new URL(`${upstream}/${subpath}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));
  return url;
}

function pickForwardHeaders(req: NextRequest) {
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  return headers;
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = req.nextUrl.searchParams.get("scope");

  let DIRECTUS_COLLECTION = `items/target_setting_executive/${id}`;
  if (scope === "division") {
    DIRECTUS_COLLECTION = `items/target_setting_division/${id}`;
  }

  // Remove scope
  req.nextUrl.searchParams.delete("scope");

  if (!UPSTREAM_BASE) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const url = buildUpstreamUrl(req, DIRECTUS_COLLECTION);
  const upstream = (UPSTREAM_BASE || "").replace(/\/+$/, "");
  const authHeader = { "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN || ""}` };

  try {
    const method = req.method;
    let body = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer();

    // Intercept PATCH requests to executive table to check for "Reopen to Draft" cascade
    if (method === "PATCH" && !scope) {
      const bodyText = body ? new TextDecoder().decode(body) : "{}";
      const bodyJson = JSON.parse(bodyText);

      // If status is being changed to DRAFT, cascade to all child tables
      if (bodyJson.status === 'DRAFT') {
        // First, get the executive target to find the fiscal_period
        const execRes = await fetch(`${upstream}/items/target_setting_executive/${id}`, {
          headers: authHeader,
          cache: "no-store"
        });
        const execData = await execRes.json();
        const fiscalPeriod = execData.data?.fiscal_period;

        if (fiscalPeriod) {
          // STEP 1: Create audit trail snapshot BEFORE any deletions
          try {
            const auditRes = await fetch(`${req.nextUrl.origin}/api/bia/crm/target-setting/audit-trail`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": req.headers.get("authorization") || ""
              },
              body: JSON.stringify({
                fiscal_period: fiscalPeriod,
                trigger_event: "REOPEN_TO_DRAFT",
                user_id: bodyJson.user_updated || null,
                notes: "Target reopened to DRAFT status - preserving approval history"
              })
            });

            if (!auditRes.ok) {
              console.error("Failed to create audit snapshot:", await auditRes.text());
              // Continue anyway - don't block the reopen operation
            } else {
              const auditData = await auditRes.json();
              console.log("Audit snapshot created:", auditData.summary);
            }
          } catch (auditError) {
            console.error("Audit trail creation error:", auditError);
            // Continue anyway - don't block the reopen operation
          }

          // STEP 2: Delete all approval records for this fiscal period
          // STEP 2: Delete all approval records for this fiscal period
          try {
            // 2.1 Fetch IDs to delete
            const approvalsListRes = await fetch(
              `${upstream}/items/target_setting_approvals?filter[target_period][_eq]=${fiscalPeriod}&fields=id`,
              { headers: authHeader, cache: "no-store" }
            );
            const { data: approvalsToDelete } = await approvalsListRes.json();

            if (approvalsToDelete && approvalsToDelete.length > 0) {
              const idsToDelete = approvalsToDelete.map((a: Record<string, unknown>) => a.id);

              // 2.2 Bulk delete by IDs
              const deleteApprovalsRes = await fetch(
                `${upstream}/items/target_setting_approvals`,
                {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json", ...authHeader },
                  body: JSON.stringify(idsToDelete)
                }
              );

              if (deleteApprovalsRes.ok) {
                console.log(`Deleted ${idsToDelete.length} approval records for fiscal period: ${fiscalPeriod}`);
              } else {
                console.error("Failed to delete approval records:", await deleteApprovalsRes.text());
              }
            } else {
              console.log(`No approval records found to delete for fiscal period: ${fiscalPeriod}`);
            }
          } catch (deleteError) {
            console.error("Error deleting approval records:", deleteError);
          }

          // STEP 3: Cascade status update to all child tables for this fiscal period
          const childCollections = [
            'target_setting_division',
            'target_setting_supplier',
            'target_setting_supervisor',
            'target_setting_salesman'
          ];

          await Promise.all(childCollections.map(async (collection) => {
            // Fetch all records for this fiscal period
            const listRes = await fetch(`${upstream}/items/${collection}?filter[fiscal_period][_eq]=${fiscalPeriod}&fields=id`, {
              headers: authHeader,
              cache: "no-store"
            });
            const { data: items } = await listRes.json();

            if (items && items.length > 0) {
              // Update each item to DRAFT
              await Promise.all(items.map((item: Record<string, unknown>) =>
                fetch(`${upstream}/items/${collection}/${item.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", ...authHeader },
                  body: JSON.stringify({ status: 'DRAFT' })
                })
              ));
            }
          }));
        }
      }

      // Re-encode the body for the original request
      body = new TextEncoder().encode(bodyText).buffer as ArrayBuffer;
    }

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers: pickForwardHeaders(req),
      body,
      cache: "no-store"
    });

    const data = await upstreamRes.arrayBuffer();
    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: { "content-type": upstreamRes.headers.get("content-type") || "application/json" }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) { return proxy(req, context); }
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) { return proxy(req, context); }
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) { return proxy(req, context); }
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
