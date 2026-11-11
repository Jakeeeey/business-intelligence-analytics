import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (process as unknown as { env: Record<string, string | undefined> }).env;
const DIRECTUS_BASE = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = env.DIRECTUS_STATIC_TOKEN || "";
const SPRING_API_BASE_URL = env.SPRING_API_BASE_URL;

type AnyRec = Record<string, unknown>;

function parseBit(val: unknown): boolean {
  if (!val) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data.length > 0) {
      return Number(obj.data[0]) === 1;
    }
  }
  return false;
}

async function directusGET(path: string, params?: Record<string, string>) {
  if (!DIRECTUS_BASE || !DIRECTUS_TOKEN) {
    return { ok: false, status: 500, error: "Directus credentials missing" };
  }
  const url = new URL(`${DIRECTUS_BASE}${path.startsWith("/") ? "" : "/"}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  }
  const r = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) {
    return { ok: false, status: r.status, error: `Directus error: ${r.statusText}` };
  }
  const body = (await r.json()) as { data?: AnyRec[] | AnyRec };
  return { ok: true, status: 200, data: body.data };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const now = new Date();
    const year = parseInt(sp.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(sp.get("month") || String(now.getMonth() + 1), 10);

    // Calculate start & end date of month in ISO format
    const startDate = `${year}-${String(month).padStart(2, "0")}-01 00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")} 23:59:59`;

    // 1. Fetch branches and suppliers lookups
    let branches: Array<{ id: number; name: string; code: string }> = [];
    let suppliers: Array<{ id: number; name: string; shortcut?: string }> = [];
    let piRecords: AnyRec[] = [];
    const lastCommittedByBranchSupplier: Record<string, string> = {};
    const priceTypeMap = new Map<string, string>();

    // Attempt Directus fetch
    if (DIRECTUS_BASE && DIRECTUS_TOKEN) {
      const [brRes, supRes, ptRes1, ptRes2] = await Promise.all([
        directusGET("/items/branches", { fields: "id,branch_name,branch_code", limit: "-1" }),
        directusGET("/items/suppliers", { fields: "id,supplier_name,supplier_shortcut", limit: "-1" }),
        directusGET("/items/price_type", { limit: "-1" }),
        directusGET("/items/price_types", { limit: "-1" }),
      ]);

      if (brRes.ok && Array.isArray(brRes.data)) {
        branches = brRes.data.map((b) => ({
          id: Number(b.id),
          name: String(b.branch_name || b.branch_code || `Branch #${b.id}`).trim(),
          code: String(b.branch_code || "").trim(),
        }));
      }

      if (supRes.ok && Array.isArray(supRes.data)) {
        suppliers = supRes.data.map((s) => ({
          id: Number(s.id),
          name: String(s.supplier_name || s.supplier_shortcut || `Supplier #${s.id}`).trim(),
          shortcut: s.supplier_shortcut ? String(s.supplier_shortcut).trim() : undefined,
        }));
      }

      // Populate Price Type lookup if available from Directus
      const priceTypeRows = (ptRes1.ok && Array.isArray(ptRes1.data) ? ptRes1.data : [])
        .concat(ptRes2.ok && Array.isArray(ptRes2.data) ? ptRes2.data : []);

      priceTypeRows.forEach((pt) => {
        const id = String(pt.id ?? pt.price_type_id ?? pt.price_type ?? "").trim();
        const name = String(pt.name ?? pt.price_type_name ?? pt.description ?? pt.label ?? "").trim();
        if (id && name) {
          priceTypeMap.set(id, name);
        }
      });

      // Query physical_inventory items covering the month where is_scm = 1
      const piFilter = JSON.stringify({
        _and: [
          {
            starting_date: {
              _lte: endDate,
            },
          },
          {
            cutOff_date: {
              _gte: startDate,
            },
          },
          {
            is_scm: {
              _eq: 1,
            },
          },
        ],
      });

      // Also query all historical committed physical_inventory to find the latest committed date per branch & supplier
      const [piRes, allCommittedRes] = await Promise.all([
        directusGET("/items/physical_inventory", {
          filter: piFilter,
          fields: "*",
          limit: "-1",
          sort: "starting_date",
        }),
        directusGET("/items/physical_inventory", {
          filter: JSON.stringify({
            _and: [
              { is_scm: { _eq: 1 } },
              { isComitted: { _eq: 1 } },
              { isCancelled: { _neq: 1 } },
            ],
          }),
          fields: "branch_id,supplier_id,cutOff_date,starting_date,committed_at",
          limit: "-1",
          sort: "-cutOff_date",
        }),
      ]);

      if (piRes.ok && Array.isArray(piRes.data)) {
        piRecords = piRes.data;
      }

      if (allCommittedRes.ok && Array.isArray(allCommittedRes.data)) {
        allCommittedRes.data.forEach((r) => {
          const bId = Number(r.branch_id);
          const sId = Number(r.supplier_id);
          const key = `${bId}-${sId}`;
          const dateStr = String(r.cutOff_date || r.starting_date || r.committed_at || "");
          if (key && dateStr && !lastCommittedByBranchSupplier[key]) {
            lastCommittedByBranchSupplier[key] = dateStr;
          }
        });
      }
    }

    // Fallback: If Directus returned no physical_inventory records or isn't connected, try Spring API
    const token = req.cookies.get("vos_access_token")?.value;
    if (piRecords.length === 0 && SPRING_API_BASE_URL) {
      try {
        const springRes = await fetch(
          `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/physical-inventory?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );
        if (springRes.ok) {
          const sData = await springRes.json();
          if (Array.isArray(sData)) {
            piRecords = sData;
          } else if (Array.isArray(sData.data)) {
            piRecords = sData.data;
          }
        }
      } catch (e) {
        console.warn("Spring physical inventory fallback failed:", e);
      }
    }

    // Map lookups for quick lookup
    const branchMap = new Map<number, { name: string; code: string }>();
    branches.forEach((b) => branchMap.set(b.id, { name: b.name, code: b.code }));

    const supplierMap = new Map<number, { name: string; shortcut?: string }>();
    const supplierShortcutMap = new Map<string, number>();
    suppliers.forEach((s) => {
      supplierMap.set(s.id, { name: s.name, shortcut: s.shortcut });
      if (s.shortcut) {
        supplierShortcutMap.set(s.shortcut.toLowerCase().trim(), s.id);
      }
      supplierShortcutMap.set(s.name.toLowerCase().trim(), s.id);
    });

    const mappedData = piRecords
      .filter((r) => parseBit(r.is_scm))
      .map((r) => {
        const bInfo = branchMap.get(Number(r.branch_id));
        const sInfo = supplierMap.get(Number(r.supplier_id));
        const rawPt = String(r.price_type || "").trim();
        const ptName = priceTypeMap.get(rawPt) || undefined;

        return {
          id: Number(r.id),
          ph_no: String(r.ph_no || ""),
          date_encoded: String(r.date_encoded || ""),
          cutOff_date: String(r.cutOff_date || ""),
          starting_date: String(r.starting_date || ""),
          price_type: rawPt,
          price_type_name: ptName,
          stock_type: String(r.stock_type || ""),
          branch_id: Number(r.branch_id),
          branch_name: bInfo?.name || `Branch #${r.branch_id}`,
          branch_code: bInfo?.code || "",
          remarks: String(r.remarks || ""),
          status: String(r.status || "PENDING_REVIEW"),
          isComitted: parseBit(r.isComitted),
          committed_at: r.committed_at ? String(r.committed_at) : null,
          isCancelled: parseBit(r.isCancelled),
          cancelled_at: r.cancelled_at ? String(r.cancelled_at) : null,
          is_scm: parseBit(r.is_scm),
          is_offset: parseBit(r.is_offset),
          total_amount: Number(r.total_amount || 0),
          supplier_id: Number(r.supplier_id),
          supplier_name: sInfo?.name || `Supplier #${r.supplier_id}`,
          supplier_shortcut: sInfo?.shortcut || undefined,
          category_id: Number(r.category_id),
          encoder_id: Number(r.encoder_id),
        };
      });

    // Also populate lastCommitted from current mapped records if missing
    mappedData.forEach((rec) => {
      if (rec.isComitted) {
        const key = `${rec.branch_id}-${rec.supplier_id}`;
        const dateStr = rec.cutOff_date || rec.starting_date || rec.committed_at;
        if (dateStr) {
          const currentBest = lastCommittedByBranchSupplier[key];
          if (!currentBest || new Date(dateStr).getTime() > new Date(currentBest).getTime()) {
            lastCommittedByBranchSupplier[key] = dateStr;
          }
        }
      }
    });

    // 2. Fetch Running Inventory & Products Cost to compute Current Inventory per Branch & Supplier in Peso value
    const currentInventoryByBranch: Record<number, number> = {};
    const branchSupplierMap = new Map<string, {
      branchId: number;
      branchName?: string;
      branchCode?: string;
      supplierId: number;
      supplierName?: string;
      supplierShortcut?: string;
      pesoValue: number;
    }>();

    try {
      // a. Fetch products cost_per_unit map from Directus
      const productCostMap = new Map<number, number>();
      if (DIRECTUS_BASE && DIRECTUS_TOKEN) {
        const prodRes = await directusGET("/items/products", {
          fields: "product_id,cost_per_unit,estimated_unit_cost,price_per_unit",
          limit: "-1",
        });
        if (prodRes.ok && Array.isArray(prodRes.data)) {
          prodRes.data.forEach((p) => {
            const pId = Number(p.product_id);
            const cost = Number(p.cost_per_unit || p.estimated_unit_cost || p.price_per_unit || 0);
            if (pId) {
              productCostMap.set(pId, cost);
            }
          });
        }
      }

      // b. Fetch running inventory from Spring Boot endpoint: /api/view-running-inventory/all
      if (SPRING_API_BASE_URL) {
        const runningEndpoints = [
          `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/view-running-inventory/all`,
          `${SPRING_API_BASE_URL.replace(/\/$/, "")}/api/view-running-inventory/all`,
        ];

        let runningInventoryList: AnyRec[] = [];
        for (const ep of runningEndpoints) {
          try {
            const res = await fetch(ep, {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
              cache: "no-store",
            });
            if (res.ok) {
              const body = await res.json();
              if (Array.isArray(body)) {
                runningInventoryList = body;
                break;
              } else if (Array.isArray(body?.data)) {
                runningInventoryList = body.data;
                break;
              }
            }
          } catch {
            // try next endpoint
          }
        }

        // c. Sum (running quantity * cost_per_unit) grouped by branch_id and supplier_id
        runningInventoryList.forEach((item) => {
          const branchId = Number(item.branchId || item.branch_id || 0);
          if (!branchId) return;

          const productId = Number(item.productId || item.product_id || 0);
          const qty = Number(
            item.runningInventoryUnit ??
            item.runningInventory ??
            item.running_inventory_unit ??
            item.running_inventory ??
            item.quantity ??
            item.qty ??
            0
          );

          // Get unit cost from product lookup or item payload
          const cost =
            productCostMap.get(productId) ??
            Number(item.costPerUnit || item.cost_per_unit || item.unitCost || item.price || 0);

          const pesoVal = qty * cost;
          currentInventoryByBranch[branchId] = (currentInventoryByBranch[branchId] || 0) + pesoVal;

          // Find supplier id
          let sId = Number(item.supplierId || item.supplier_id || 0);
          if (!sId) {
            const shortcutStr = String(item.supplierShortcut || item.supplier_shortcut || "").toLowerCase().trim();
            const nameStr = String(item.supplierName || item.supplier_name || "").toLowerCase().trim();
            if (shortcutStr && supplierShortcutMap.has(shortcutStr)) {
              sId = supplierShortcutMap.get(shortcutStr)!;
            } else if (nameStr && supplierShortcutMap.has(nameStr)) {
              sId = supplierShortcutMap.get(nameStr)!;
            }
          }

          const sInfo = supplierMap.get(sId);
          const bInfo = branchMap.get(branchId);
          const sName = sInfo?.name || String(item.supplierName || item.supplier_name || `Supplier #${sId}`);
          const sShortcut = sInfo?.shortcut || (item.supplierShortcut ? String(item.supplierShortcut) : undefined);

          const key = `${branchId}-${sId}`;
          const existing = branchSupplierMap.get(key);
          if (existing) {
            existing.pesoValue += pesoVal;
          } else {
            branchSupplierMap.set(key, {
              branchId,
              branchName: bInfo?.name || String(item.branchName || item.branch_name || `Branch #${branchId}`),
              branchCode: bInfo?.code || "",
              supplierId: sId,
              supplierName: sName,
              supplierShortcut: sShortcut,
              pesoValue: pesoVal,
            });
          }
        });
      }
    } catch (err) {
      console.warn("Failed to compute current inventory per branch:", err);
    }

    const branchSupplierInventory = Array.from(branchSupplierMap.values());

    return NextResponse.json({
      success: true,
      data: mappedData,
      branches,
      suppliers,
      currentInventoryByBranch,
      branchSupplierInventory,
      lastCommittedByBranchSupplier,
      year,
      month,
    });
  } catch (error) {
    console.error("API error in ph-warehouse:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch physical inventory data",
        data: [],
        branches: [],
        suppliers: [],
        currentInventoryByBranch: {},
        branchSupplierInventory: [],
        lastCommittedByBranchSupplier: {},
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
      { status: 500 }
    );
  }
}
