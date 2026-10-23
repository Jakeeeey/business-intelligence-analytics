import { NextRequest, NextResponse } from "next/server";
import { UpdateProspectSchema } from "@/modules/business-intelligence-analytics/prospecting-bia/types";
import { phLocalToUtcIso } from "@/modules/business-intelligence-analytics/prospecting-bia/utils/datetime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

/**
 * Advances a prospect to a new workflow status.
 * Captures `percentage` when the target status is "contacted" (required there).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);
    if (Number.isNaN(recordId)) {
      return NextResponse.json({ success: false, message: "Invalid prospect id" }, { status: 400 });
    }

    if (!DIRECTUS_BASE) {
      return NextResponse.json({ success: false, message: "Directus is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const validation = UpdateProspectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { prospect_status, percentage, remarks, schedule } = validation.data;

    // Conversion must always create + link the customer row.
    if (prospect_status === "converted") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Prospects must be finalized through the convert endpoint so a customer record is created.",
        },
        { status: 400 }
      );
    }

    const numericPercentage =
      percentage === null || percentage === undefined || percentage === ""
        ? null
        : Number(percentage);

    const payload: Record<string, unknown> = { prospect_status };

    if (prospect_status === "contacted") {
      if (numericPercentage === null || !Number.isFinite(numericPercentage) || numericPercentage < 0 || numericPercentage > 100) {
        return NextResponse.json(
          { success: false, message: "A probability between 0 and 100 is required when marking a prospect as contacted." },
          { status: 400 }
        );
      }
      payload.percentage = numericPercentage;
    } else if (numericPercentage !== null && Number.isFinite(numericPercentage)) {
      payload.percentage = numericPercentage;
    }

    // Marketing input: free-text remarks are stored as-is.
    if (remarks !== undefined && remarks !== null) {
      payload.remarks = remarks.trim() ? remarks.trim() : null;
    }

    // Marketing input: schedule is captured in PH wall-clock and stored in UTC.
    if (schedule) {
      const [datePart, timePart] = schedule.split("T");
      const utcSchedule = phLocalToUtcIso(datePart, timePart || "00:00");
      if (!utcSchedule) {
        return NextResponse.json(
          { success: false, message: "Invalid schedule date/time." },
          { status: 400 }
        );
      }
      payload.schedule = utcSchedule;
    }

    const res = await fetch(`${DIRECTUS_BASE}/items/customer_prospect/${recordId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[prospect PATCH] Directus error:", res.status, text);
      return NextResponse.json(
        { success: false, message: "Failed to update prospect" },
        { status: res.status }
      );
    }

    const { data } = await res.json();
    return NextResponse.json({
      success: true,
      data,
      message: `Prospect marked as ${prospect_status}.`,
    });
  } catch (error: unknown) {
    console.error("[prospect PATCH] error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
