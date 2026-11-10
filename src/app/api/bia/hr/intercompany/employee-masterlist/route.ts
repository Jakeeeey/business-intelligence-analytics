import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  IntercompanyEmployeeMasterlistData,
  IntercompanyEmployeeMasterlistKpis,
  CompanyMasterlistSummary,
  DepartmentMasterlistSummary,
  DistributionSegment,
  TenureDistributionPoint,
  IntercompanyEmployeeMasterlistRecord,
  CompanyFilterOption,
  RosterStatus,
} from "@/modules/business-intelligence-analytics/hr/intercompany/employee-masterlist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "vos_access_token";

type AnyRec = Record<string, unknown>;

interface CachedMasterlist {
  data: IntercompanyEmployeeMasterlistData;
  timestamp: number;
}

const memoryCache = new Map<string, CachedMasterlist>();
const CACHE_TTL_MS = 30000; // 30s

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

async function fetchDirectusWithTimeout<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 6000
): Promise<{ data: T[]; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { data: [], ok: false };
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? (json.data as T[]) : [],
      ok: true,
    };
  } catch {
    return { data: [], ok: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      cookieStore.get(COOKIE_NAME)?.value ||
      process.env.DIRECTUS_STATIC_TOKEN;

    const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
    if (!token && !isAuthDisabled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const primaryBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    const staticToken = process.env.DIRECTUS_STATIC_TOKEN || "";

    if (!primaryBaseUrl) {
      return NextResponse.json(
        { error: "Directus API base URL not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const cacheKey = "intercompany_employee_masterlist";
    if (!force && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    const primaryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (staticToken) primaryHeaders["Authorization"] = `Bearer ${staticToken}`;
    else if (token) primaryHeaders["Authorization"] = `Bearer ${token}`;

    // 1. Fetch company_list from primary Directus
    const companiesRes = await fetchDirectusWithTimeout<AnyRec>(
      `${primaryBaseUrl}/items/company_list?limit=-1&fields=company_id,company_name,company_code,directus,directus_token,status,is_default,is_mother_company`,
      primaryHeaders,
      6000
    );

    const validCompanies = companiesRes.data.filter((c) => {
      if (!c.directus || typeof c.directus !== "string" || !c.directus.trim()) return false;
      if (String(c.status || "ACTIVE").toUpperCase() === "INACTIVE") return false;
      return true;
    });

    const userFields =
      "user_id,user_fname,user_lname,user_mname,suffix_name,user_department,user_position,user_email,personal_email,user_contact,user_image,is_employee,separation_date,separation_cause,gender,civil_status,user_bday,user_dateOfHire,user_city,user_province,user_brgy,is_deleted,isDeleted,is_department_head,employment_status_id,rf_id,biometric_id";

    // 2. Concurrently query each company's employees, departments, and employment statuses
    const companyFetchResults = await Promise.allSettled(
      validCompanies.map(async (company) => {
        const companyId = Number(company.company_id);
        const companyName = String(company.company_name || `Company #${companyId}`).trim();
        const companyCode = String(company.company_code || `CMP-${companyId}`).trim();
        const companyUrl = String(company.directus).replace(/\/+$/, "");
        const companyToken = (company.directus_token as string) || staticToken || token;

        const compHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (companyToken) {
          compHeaders["Authorization"] = `Bearer ${companyToken}`;
        }

        const [usersRes, departmentsRes, statusesRes] = await Promise.all([
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/user?limit=-1&fields=${userFields}`,
            compHeaders,
            6000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/department?limit=-1&fields=department_id,department_name`,
            compHeaders,
            4000
          ),
          fetchDirectusWithTimeout<AnyRec>(
            `${companyUrl}/items/employment_status?limit=-1&fields=id,name`,
            compHeaders,
            4000
          ),
        ]);

        return {
          companyId,
          companyName,
          companyCode,
          users: usersRes.data,
          departments: departmentsRes.data,
          statuses: statusesRes.data,
          isOnline: usersRes.ok,
        };
      })
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    const allRecords: IntercompanyEmployeeMasterlistRecord[] = [];
    const companySummaries: CompanyMasterlistSummary[] = [];
    const companiesList: CompanyFilterOption[] = [];
    const allDepartmentsSet = new Set<string>();
    const allStatusesSet = new Set<string>();

    const deptAggregator = new Map<
      string,
      {
        totalEmployees: number;
        regularCount: number;
        probationaryCount: number;
        companyIds: Set<number>;
      }
    >();

    const genderCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();

    let grandActiveEmployees = 0;
    let grandSeparatedEmployees = 0;
    let grandRegular = 0;
    let grandProbationary = 0;
    let grandOtherStatus = 0;
    let grandNewHires = 0;
    let grandDeptHeads = 0;
    let grandTenureMonthsSum = 0;
    let grandMale = 0;
    let grandFemale = 0;
    let activeCompaniesCount = 0;

    for (const res of companyFetchResults) {
      if (res.status !== "fulfilled") continue;

      const {
        companyId,
        companyName,
        companyCode,
        users,
        departments,
        statuses,
        isOnline,
      } = res.value;

      companiesList.push({ companyId, companyName, companyCode });

      if (!isOnline && users.length === 0) {
        companySummaries.push({
          companyId,
          companyName,
          companyCode,
          status: "OFFLINE",
          totalEmployees: 0,
          activeCount: 0,
          separatedCount: 0,
          regularCount: 0,
          probationaryCount: 0,
          otherStatusCount: 0,
          newHiresThisYear: 0,
          departmentCount: 0,
          avgTenureYears: 0,
          maleCount: 0,
          femaleCount: 0,
          headcountSharePct: 0,
        });
        continue;
      }

      activeCompaniesCount++;

      // Map departments
      const deptMap = new Map<number, string>();
      departments.forEach((d) => {
        const id = Number(d.department_id || d.id);
        const name = String(d.department_name || d.name || "").trim();
        if (id && name) {
          deptMap.set(id, name);
        }
      });

      // Map employment statuses & identify separated/inactive status IDs
      const statusMap = new Map<number, string>();
      const inactiveStatusIds = new Set<number>([7, 8]);
      statuses.forEach((s) => {
        const id = Number(s.id);
        const name = String(s.name || "").trim();
        if (id && name) {
          statusMap.set(id, name);
          const lower = name.toLowerCase();
          if (
            lower.includes("resign") ||
            lower.includes("terminat") ||
            lower.includes("inactive") ||
            lower.includes("separat") ||
            lower.includes("awol") ||
            lower.includes("end of contract")
          ) {
            inactiveStatusIds.add(id);
          }
        }
      });

      let compActive = 0;
      let compSeparated = 0;
      let compRegular = 0;
      let compProbationary = 0;
      let compOtherStatus = 0;
      let compNewHires = 0;
      let compTenureMonths = 0;
      let compMale = 0;
      let compFemale = 0;
      const compDeptsSet = new Set<string>();

      users.forEach((u) => {
        const isEmployee = parseBit(u.is_employee);
        if (!isEmployee) return;

        const isDeleted = parseBit(u.is_deleted) || parseBit(u.isDeleted);
        if (isDeleted) return;

        const userId = Number(u.user_id);
        if (!userId) return;

        const firstName = String(u.user_fname || "").trim();
        const lastName = String(u.user_lname || "").trim();
        const middleName = u.user_mname ? String(u.user_mname).trim() : undefined;
        const suffix = u.suffix_name ? String(u.suffix_name).trim() : undefined;

        const nameCombined = `${firstName} ${lastName}`.toLowerCase();
        if (
          nameCombined.includes("dummy") ||
          nameCombined.includes("throwaway") ||
          nameCombined.includes("qa test") ||
          nameCombined.includes("test account")
        ) {
          return;
        }

        const fullName =
          [firstName, middleName, lastName, suffix].filter(Boolean).join(" ") ||
          `Employee #${userId}`;

        const deptId = u.user_department ? Number(u.user_department) : null;
        const department = (deptId ? deptMap.get(deptId) : null) || "General Operations";

        const empStatusId = u.employment_status_id ? Number(u.employment_status_id) : null;
        const empStatus = (empStatusId ? statusMap.get(empStatusId) : null) || "Regular";

        const separationDate = u.separation_date ? String(u.separation_date).slice(0, 10) : null;
        const separationCause = u.separation_cause ? String(u.separation_cause).trim() : null;

        const isSeparated =
          Boolean(separationCause && separationCause.length > 0) ||
          Boolean(separationDate && separationDate <= todayStr) ||
          Boolean(empStatusId && inactiveStatusIds.has(empStatusId));

        const rosterStatus: RosterStatus = isSeparated ? "Separated" : "Active";

        const position = String(u.user_position || "").trim() || "Staff Member";
        const email = String(u.user_email || u.personal_email || "").trim();
        const personalEmail = u.personal_email ? String(u.personal_email).trim() : undefined;
        const contact = String(u.user_contact || "").trim();
        const avatar = u.user_image ? String(u.user_image) : null;
        const isDepartmentHead = parseBit(u.is_department_head);
        const biometricId = u.biometric_id ? String(u.biometric_id).trim() : null;
        const rfId = u.rf_id ? String(u.rf_id).trim() : null;

        // Date of hire & tenure calculation
        const dateOfHire = u.user_dateOfHire ? String(u.user_dateOfHire).slice(0, 10) : null;
        let tenureMonths = 0;
        let tenureYears = 0;

        if (dateOfHire && !isNaN(Date.parse(dateOfHire))) {
          const hireDate = new Date(dateOfHire);
          const diffMs = now.getTime() - hireDate.getTime();
          const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          tenureMonths = Math.floor(diffDays / 30.4375);
          tenureYears = parseFloat((diffDays / 365.25).toFixed(1));
        }

        // Birthday & age calculation
        const birthday = u.user_bday ? String(u.user_bday).slice(0, 10) : null;
        let age: number | null = null;
        if (birthday && !isNaN(Date.parse(birthday))) {
          const bDate = new Date(birthday);
          let calcAge = now.getFullYear() - bDate.getFullYear();
          const mDiff = now.getMonth() - bDate.getMonth();
          if (mDiff < 0 || (mDiff === 0 && now.getDate() < bDate.getDate())) {
            calcAge--;
          }
          if (calcAge > 0 && calcAge < 110) {
            age = calcAge;
          }
        }

        // Gender normalization
        const rawGender = String(u.gender || "").trim().toLowerCase();
        let gender = "Other";
        if (rawGender === "male" || rawGender === "m") gender = "Male";
        else if (rawGender === "female" || rawGender === "f") gender = "Female";

        const civilStatus = String(u.civil_status || "").trim() || "Single";
        const city = String(u.user_city || "").trim();
        const province = String(u.user_province || "").trim();
        const barangay = String(u.user_brgy || "").trim();

        allDepartmentsSet.add(department);
        allStatusesSet.add(empStatus);

        if (rosterStatus === "Active") {
          compActive++;
          grandActiveEmployees++;
          compDeptsSet.add(department);
          compTenureMonths += tenureMonths;
          grandTenureMonthsSum += tenureMonths;

          if (isDepartmentHead) {
            grandDeptHeads++;
          }

          if (dateOfHire && new Date(dateOfHire).getFullYear() === currentYear) {
            compNewHires++;
            grandNewHires++;
          }

          const statusLower = empStatus.toLowerCase();
          if (statusLower.includes("regular")) {
            compRegular++;
            grandRegular++;
          } else if (statusLower.includes("probation")) {
            compProbationary++;
            grandProbationary++;
          } else {
            compOtherStatus++;
            grandOtherStatus++;
          }

          if (gender === "Male") {
            compMale++;
            grandMale++;
          } else if (gender === "Female") {
            compFemale++;
            grandFemale++;
          }

          genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
          statusCounts.set(empStatus, (statusCounts.get(empStatus) || 0) + 1);

          const dStat = deptAggregator.get(department) || {
            totalEmployees: 0,
            regularCount: 0,
            probationaryCount: 0,
            companyIds: new Set<number>(),
          };
          dStat.totalEmployees++;
          if (statusLower.includes("regular")) dStat.regularCount++;
          else if (statusLower.includes("probation")) dStat.probationaryCount++;
          dStat.companyIds.add(companyId);
          deptAggregator.set(department, dStat);
        } else {
          compSeparated++;
          grandSeparatedEmployees++;
        }

        allRecords.push({
          id: `${companyId}-${userId}`,
          userId,
          employeeId: `${companyCode}-${String(userId).padStart(4, "0")}`,
          biometricId,
          rfId,
          name: fullName,
          firstName,
          lastName,
          middleName,
          suffix,
          email,
          personalEmail,
          contact,
          companyId,
          companyName,
          companyCode,
          department,
          departmentId: deptId,
          position,
          employmentStatus: empStatus,
          employmentStatusId: empStatusId,
          rosterStatus,
          dateOfHire,
          separationDate,
          separationCause,
          tenureMonths,
          tenureYears,
          birthday,
          age,
          gender,
          civilStatus,
          city,
          province,
          barangay,
          avatar,
          isDepartmentHead,
        });
      });

      const compAvgTenure =
        compActive > 0 ? parseFloat((compTenureMonths / (compActive * 12)).toFixed(1)) : 0;

      companySummaries.push({
        companyId,
        companyName,
        companyCode,
        status: "ACTIVE",
        totalEmployees: compActive,
        activeCount: compActive,
        separatedCount: compSeparated,
        regularCount: compRegular,
        probationaryCount: compProbationary,
        otherStatusCount: compOtherStatus,
        newHiresThisYear: compNewHires,
        departmentCount: compDeptsSet.size,
        avgTenureYears: compAvgTenure,
        maleCount: compMale,
        femaleCount: compFemale,
        headcountSharePct: 0, // computed after loop
      });
    }

    // Compute headcountSharePct & sort companySummaries by totalEmployees desc
    companySummaries.forEach((c) => {
      c.headcountSharePct =
        grandActiveEmployees > 0 ? Math.round((c.totalEmployees / grandActiveEmployees) * 100) : 0;
    });
    companySummaries.sort((a, b) => b.totalEmployees - a.totalEmployees);

    // Department summaries
    const departmentSummaries: DepartmentMasterlistSummary[] = [];
    deptAggregator.forEach((val, dept) => {
      departmentSummaries.push({
        department: dept,
        totalEmployees: val.totalEmployees,
        regularCount: val.regularCount,
        probationaryCount: val.probationaryCount,
        companiesCount: val.companyIds.size,
        percentage:
          grandActiveEmployees > 0
            ? Math.round((val.totalEmployees / grandActiveEmployees) * 100)
            : 0,
      });
    });
    departmentSummaries.sort((a, b) => b.totalEmployees - a.totalEmployees);

    // Gender distribution
    const genderColorMap: Record<string, string> = {
      Male: "#3b82f6",
      Female: "#ec4899",
      Other: "#8b5cf6",
    };
    const genderDistribution: DistributionSegment[] = Array.from(genderCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: grandActiveEmployees > 0 ? Math.round((count / grandActiveEmployees) * 100) : 0,
        color: genderColorMap[name] || "#06b6d4",
      }))
      .sort((a, b) => b.count - a.count);

    // Employment Status distribution
    const statusPalette = ["#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#f97316", "#ec4899"];
    const statusDistribution: DistributionSegment[] = Array.from(statusCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: grandActiveEmployees > 0 ? Math.round((count / grandActiveEmployees) * 100) : 0,
        color: statusPalette[idx % statusPalette.length],
      }));

    // Tenure distribution (Active employees)
    const tenureBrackets = [
      { range: "< 1 Year", min: 0, max: 1, count: 0 },
      { range: "1 - 2 Years", min: 1, max: 3, count: 0 },
      { range: "3 - 5 Years", min: 3, max: 6, count: 0 },
      { range: "> 5 Years", min: 6, max: 999, count: 0 },
    ];
    allRecords
      .filter((r) => r.rosterStatus === "Active")
      .forEach((r) => {
        const y = r.tenureYears;
        const b =
          tenureBrackets.find((br) => y >= br.min && y < br.max) ||
          tenureBrackets[tenureBrackets.length - 1];
        b.count++;
      });

    const tenureDistribution: TenureDistributionPoint[] = tenureBrackets.map((b) => ({
      range: b.range,
      count: b.count,
      percentage: grandActiveEmployees > 0 ? Math.round((b.count / grandActiveEmployees) * 100) : 0,
    }));

    const avgTenureYears =
      grandActiveEmployees > 0
        ? parseFloat((grandTenureMonthsSum / (grandActiveEmployees * 12)).toFixed(1))
        : 0;

    const topCompany = companySummaries[0];

    const kpis: IntercompanyEmployeeMasterlistKpis = {
      totalEmployees: grandActiveEmployees,
      totalRosterRecords: allRecords.length,
      activeEmployeesCount: grandActiveEmployees,
      separatedEmployeesCount: grandSeparatedEmployees,
      regularCount: grandRegular,
      probationaryCount: grandProbationary,
      otherStatusCount: grandOtherStatus,
      newHiresThisYear: grandNewHires,
      departmentHeadsCount: grandDeptHeads,
      avgTenureYears,
      maleCount: grandMale,
      femaleCount: grandFemale,
      activeCompaniesCount,
      totalCompaniesCount: validCompanies.length,
      totalDepartmentsCount: deptAggregator.size,
      largestCompanyName: topCompany?.companyName || "N/A",
      largestCompanyCount: topCompany?.totalEmployees || 0,
    };

    const payload: IntercompanyEmployeeMasterlistData = {
      generatedAt: now.toISOString(),
      kpis,
      companySummaries,
      departmentSummaries,
      genderDistribution,
      statusDistribution,
      tenureDistribution,
      records: allRecords,
      companiesList: companiesList.sort((a, b) => a.companyName.localeCompare(b.companyName)),
      departmentsList: Array.from(allDepartmentsSet).sort(),
      statusesList: Array.from(allStatusesSet).sort(),
    };

    memoryCache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[intercompany-employee-masterlist API Error]", err);
    return NextResponse.json(
      { error: "Failed to generate intercompany employee masterlist report" },
      { status: 500 }
    );
  }
}

