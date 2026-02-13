import { http } from "@/lib/http/client";
import type {
  TargetSettingExecutive,
  TargetApprovalRecord,
  SubmitApprovalDTO,
  TargetApprover
} from "../types";

const PROXY_BASE = "/api/bia/target-setting/target-approval";

export async function checkApproverStatus(): Promise<{ isApprover: boolean; approver: TargetApprover | null }> {
  try {
    const res = await http.get(PROXY_BASE, {
      params: { path: "auth/check" },
      skipBaseUrl: true
    });
    return res.data;
  } catch (error) {
    return { isApprover: false, approver: null };
  }
}

export async function getExecutiveTargetByPeriod(period: string): Promise<TargetSettingExecutive | null> {
  const res = await http.get(PROXY_BASE, {
    params: { path: "executive", period },
    skipBaseUrl: true
  });
  return res.data?.data?.[0] || null;
}

export async function getApprovalRecord(period: string, recordId?: string | number): Promise<any> {
  const res = await http.get(PROXY_BASE, {
    params: { path: "record", period, record_id: recordId },
    skipBaseUrl: true
  });
  return res.data;
}

export async function submitApproval(data: SubmitApprovalDTO): Promise<any> {
  const res = await http.post(PROXY_BASE, data, {
    params: { path: "submit" },
    skipBaseUrl: true
  });
  return res.data;
}
