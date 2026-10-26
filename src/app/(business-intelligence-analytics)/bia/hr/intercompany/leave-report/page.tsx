import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function LeaveReportRedirectPage() {
  redirect("/bia/hr/intercompany/overtime-report");
}
