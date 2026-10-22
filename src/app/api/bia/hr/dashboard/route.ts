import { NextRequest, NextResponse } from "next/server";
import {
  EmployeeRecord,
  HrDashboardData,
  DepartmentHeadcount,
  GenderDistributionItem,
  TenureDistributionItem,
  EmploymentStatusItem,
} from "@/modules/business-intelligence-analytics/hr/dashboard/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (process as unknown as { env: Record<string, string | undefined> }).env;
const DIRECTUS_BASE = (env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const DIRECTUS_TOKEN = env.DIRECTUS_STATIC_TOKEN || "";

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

async function fetchDirectusCollection(collection: string, queryParams?: Record<string, string>): Promise<AnyRec[]> {
  try {
    const url = new URL(`${DIRECTUS_BASE}/items/${collection}`);
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[HR Directus] Failed to fetch /items/${collection}: ${res.status}`);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error(`[HR Directus Error] /items/${collection}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentFilter = searchParams.get("department") || "ALL";

    // 1. Fetch departments
    const deptRows = await fetchDirectusCollection("department", { limit: "-1" });
    const deptMap = new Map<number, string>();
    deptRows.forEach((d) => {
      const id = Number(d.department_id);
      const name = String(d.department_name || "").trim();
      if (id && name) deptMap.set(id, name);
    });

    // 2. Fetch employment statuses
    const statusRows = await fetchDirectusCollection("employment_status", { limit: "-1" });
    const statusMap = new Map<number, string>();
    statusRows.forEach((s) => {
      const id = Number(s.id);
      const name = String(s.name || "").trim();
      if (id && name) statusMap.set(id, name);
    });

    // 3. Fetch users with is_employee = 1
    const userRows = await fetchDirectusCollection("user", {
      limit: "-1",
      "filter[is_employee][_eq]": "1",
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    // Map and filter active employees
    const employees: EmployeeRecord[] = [];
    const deptCountMap = new Map<string, { id: number | null; count: number }>();
    const genderCountMap = new Map<string, number>();
    const statusCountMap = new Map<string, number>();

    let totalTenureMonths = 0;
    let newHiresThisYear = 0;
    let regularCount = 0;
    let probationaryCount = 0;

    userRows.forEach((u) => {
      // Check deletion flags
      const isDeleted = parseBit(u.is_deleted) || parseBit(u.isDeleted);
      if (isDeleted) return;

      const userId = Number(u.user_id);
      const firstName = String(u.user_fname || "").trim();
      const lastName = String(u.user_lname || "").trim();
      const middleName = u.user_mname ? String(u.user_mname).trim() : undefined;
      const suffix = u.suffix_name ? String(u.suffix_name).trim() : "";
      const nameParts = [firstName, middleName, lastName, suffix].filter(Boolean);
      const fullName = nameParts.length > 0 ? nameParts.join(" ") : `Employee #${userId}`;

      const deptId = u.user_department ? Number(u.user_department) : null;
      const department = (deptId ? deptMap.get(deptId) : null) || "Unassigned";

      const empStatusId = u.employment_status_id ? Number(u.employment_status_id) : null;
      const empStatus = (empStatusId ? statusMap.get(empStatusId) : null) || "Regular";

      const position = String(u.user_position || "").trim() || "Staff";
      const email = String(u.user_email || u.personal_email || "").trim();
      const contact = String(u.user_contact || "").trim();

      const rawDateOfHire = u.user_dateOfHire ? String(u.user_dateOfHire).slice(0, 10) : null;
      let tenureMonths = 0;
      let tenureYears = 0;

      if (rawDateOfHire && !isNaN(Date.parse(rawDateOfHire))) {
        const hireDate = new Date(rawDateOfHire);
        const diffMs = now.getTime() - hireDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        tenureMonths = Math.floor(diffDays / 30.4375);
        tenureYears = parseFloat((diffDays / 365.25).toFixed(1));

        if (hireDate.getFullYear() === currentYear) {
          newHiresThisYear++;
        }
      }

      totalTenureMonths += tenureMonths;

      const rawGender = String(u.gender || "").trim().toLowerCase();
      let normGender = "Other";
      if (rawGender === "male" || rawGender === "m") normGender = "Male";
      else if (rawGender === "female" || rawGender === "f") normGender = "Female";
      else if (rawGender) normGender = "Other";

      const civilStatus = String(u.civil_status || "").trim() || "Single";
      const city = String(u.user_city || "").trim();
      const province = String(u.user_province || "").trim();
      const avatar = u.user_image ? String(u.user_image) : null;
      const isDepartmentHead = parseBit(u.is_department_head);

      // Aggregations
      genderCountMap.set(normGender, (genderCountMap.get(normGender) || 0) + 1);

      const existingDept = deptCountMap.get(department) || { id: deptId, count: 0 };
      deptCountMap.set(department, { id: deptId, count: existingDept.count + 1 });

      statusCountMap.set(empStatus, (statusCountMap.get(empStatus) || 0) + 1);
      const statusLower = empStatus.toLowerCase();
      if (statusLower.includes("probation")) {
        probationaryCount++;
      } else {
        regularCount++;
      }

      employees.push({
        id: String(userId),
        employeeId: `EMP-${String(userId).padStart(4, "0")}`,
        userId,
        name: fullName,
        firstName,
        lastName,
        middleName,
        email,
        contact,
        department,
        departmentId: deptId,
        position,
        employmentStatus: empStatus,
        employmentStatusId: empStatusId,
        dateOfHire: rawDateOfHire,
        tenureMonths,
        tenureYears,
        gender: normGender,
        civilStatus,
        city,
        province,
        avatar,
        isDepartmentHead,
      });
    });

    const totalEmployees = employees.length || 1;
    const avgTenureYears =
      employees.length > 0
        ? parseFloat((totalTenureMonths / (employees.length * 12)).toFixed(1))
        : 0;

    // Filter employees by department if specified
    const filteredEmployees =
      departmentFilter !== "ALL"
        ? employees.filter((e) => e.department === departmentFilter)
        : employees;

    // Department Stats list
    const departmentStats: DepartmentHeadcount[] = Array.from(deptCountMap.entries())
      .map(([deptName, val]) => ({
        department: deptName,
        departmentId: val.id,
        headcount: val.count,
        percentage: Math.round((val.count / totalEmployees) * 100),
      }))
      .sort((a, b) => b.headcount - a.headcount);

    // Gender Distribution
    const GENDER_COLORS: Record<string, string> = {
      Male: "#3b82f6",
      Female: "#ec4899",
      Other: "#8b5cf6",
    };
    const genderDistribution: GenderDistributionItem[] = Array.from(genderCountMap.entries())
      .map(([gender, count]) => ({
        gender,
        count,
        percentage: Math.round((count / totalEmployees) * 100),
        color: GENDER_COLORS[gender] || "#06b6d4",
      }))
      .sort((a, b) => b.count - a.count);

    // Tenure Distribution
    const tenureBrackets = [
      { range: "< 1 Year", min: 0, max: 1, count: 0 },
      { range: "1 - 2 Years", min: 1, max: 2, count: 0 },
      { range: "3 - 5 Years", min: 3, max: 5, count: 0 },
      { range: "> 5 Years", min: 5, max: 99, count: 0 },
    ];
    employees.forEach((e) => {
      const y = e.tenureYears;
      const b = tenureBrackets.find((br) => y >= br.min && y < br.max) || tenureBrackets[tenureBrackets.length - 1];
      b.count++;
    });
    const tenureDistribution: TenureDistributionItem[] = tenureBrackets.map((b) => ({
      range: b.range,
      count: b.count,
      percentage: Math.round((b.count / totalEmployees) * 100),
    }));

    // Status Distribution
    const statusDistribution: EmploymentStatusItem[] = Array.from(statusCountMap.entries()).map(
      ([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / totalEmployees) * 100),
      })
    );

    const departmentsList = Array.from(deptMap.values()).sort();
    const statusesList = Array.from(statusMap.values()).sort();

    const data: HrDashboardData = {
      kpis: {
        totalEmployees: employees.length,
        regularCount,
        probationaryCount,
        newHiresThisYear,
        activeDepartments: deptCountMap.size,
        avgTenureYears,
        femaleCount: genderCountMap.get("Female") || 0,
        maleCount: genderCountMap.get("Male") || 0,
      },
      departmentStats,
      genderDistribution,
      tenureDistribution,
      statusDistribution,
      employees: filteredEmployees,
      departments: departmentsList.length > 0 ? departmentsList : Array.from(deptCountMap.keys()),
      statuses: statusesList.length > 0 ? statusesList : Array.from(statusCountMap.keys()),
    };

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[HR Dashboard API Error]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
