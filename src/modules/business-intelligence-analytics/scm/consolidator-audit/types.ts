// src/modules/business-intelligence-analytics/scm/consolidator-audit/types.ts

export interface ConsolidatorAuditRecord {
  pdpId: number | null;
  pdpNo: string | null;
  pdpStatus: string | null;
  pdpCreatedAt: string | null;
  consolidatorId: number | null;
  consolidatorNo: string | null;
  consolidatorStatus: string | null;
  consolidatorCreatedAt: string | null;
  dpId: number | null;
  dpNo: string | null;
  dpStatus: string | null;
  dpCreatedAt: string | null;
}

export interface ConsolidatorAuditFilters {
  dateRangeType: "today" | "week" | "month" | "year" | "custom";
  startDate: string;
  endDate: string;
  pdpNo?: string;
  pdpStatus?: string;
  consolidatorNo?: string;
  consolidatorStatus?: string;
  dpNo?: string;
  dpStatus?: string;
}

export interface GroupedPdp {
  pdpId: number | string;
  pdpNo: string;
  pdpStatus: string;
  pdpCreatedAt: string;
  consolidators: {
    consolidatorId: number | string;
    consolidatorNo: string;
    consolidatorStatus: string;
    consolidatorCreatedAt: string;
    dispatchPlans: {
      dpId: number | string;
      dpNo: string;
      dpStatus: string;
      dpCreatedAt: string;
    }[];
  }[];
}
