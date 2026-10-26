import { NextRequest } from "next/server";
import { GET as getOvertime } from "../overtime-report/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getOvertime(req);
}
