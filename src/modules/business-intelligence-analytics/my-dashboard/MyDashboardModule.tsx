"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    LayoutDashboard,
    Info,
    ShieldCheck,
    BarChart3,
    Activity,
    TrendingUp,
    RefreshCw,
    Receipt,
    CalendarCheck2,
    Truck,
    Building2,
    Clock,
    Users,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyDashboardProps, DashboardCardItem, CardsApiResponse } from "./types";
import SalesOrderForApprovalCard from "./components/SalesOrderForApprovalCard";
import AccountsReceivableDetailedCard from "./components/AccountsReceivableDetailedCard";
import AccountsPayableDetailedCard from "./components/AccountsPayableDetailedCard";
import CompanyExpenseReportCard from "./components/CompanyExpenseReportCard";
import CompanyPayrollCutoffProgressCard from "./components/CompanyPayrollCutoffProgressCard";
import HoldingsPayrollCutoffProgressCard from "./components/HoldingsPayrollCutoffProgressCard";
import DriverKPICard from "./components/DriverKPICard";
import DepartmentHeadSummaryCard from "./components/DepartmentHeadSummaryCard";
import CompanyAttendanceReportCard from "./components/CompanyAttendanceReportCard";
import CompanyPunctualityReportCard from "./components/CompanyPunctualityReportCard";
import CompanyPunctualityDetailedCard from "./components/CompanyPunctualityDetailedCard";
import CompanyTotalEmployeeCard from "./components/CompanyTotalEmployeeCard";
import SalesOrderDraftCard from "./components/SalesOrderDraftCard";
import SalesOrderPendingCard from "./components/SalesOrderPendingCard";
import SalesOrderInvoiceCard from "./components/SalesOrderInvoiceCard";
import SalesOrderForConsolidationCard from "./components/SalesOrderForConsolidationCard";

function formatCardTitle(key: string): string {
    return key
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCardIcon(key: string) {
    const lower = key.toLowerCase();
    if (lower.includes("sales") || lower.includes("revenue")) {
        return <TrendingUp className="h-4 w-4" />;
    }
    if (lower.includes("activity") || lower.includes("lead")) {
        return <Activity className="h-4 w-4" />;
    }
    if (lower.includes("expense") || lower.includes("disbursement")) {
        return <Receipt className="h-4 w-4" />;
    }
    if (lower.includes("payroll") || lower.includes("cutoff")) {
        return <CalendarCheck2 className="h-4 w-4" />;
    }
    if (lower.includes("attendance")) {
        return <Building2 className="h-4 w-4" />;
    }
    if (lower.includes("punctuality")) {
        return <Clock className="h-4 w-4" />;
    }
    if (lower.includes("employee") || lower.includes("workforce") || lower.includes("headcount")) {
        return <Users className="h-4 w-4" />;
    }
    if (lower.includes("driver") || lower.includes("logistics")) {
        return <Truck className="h-4 w-4" />;
    }
    if (lower.includes("department") || lower.includes("dept") || lower.includes("attendance")) {
        return <Building2 className="h-4 w-4" />;
    }
    return <BarChart3 className="h-4 w-4" />;
}

const CARDS_CACHE_KEY = "bia_my_dashboard_cards";

export default function MyDashboardModule({ className = "" }: MyDashboardProps) {
    const [cards, setCards] = useState<DashboardCardItem[]>([]);
    const [hasWildcardAccess, setHasWildcardAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCards = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const res = await fetch("/api/bia/my-dashboard/cards", {
                cache: "no-store",
            });
            if (res.ok) {
                const data: CardsApiResponse = await res.json();
                const fetchedCards = data.cards || [];
                const wildcard = Boolean(data.hasWildcardAccess);
                setCards(fetchedCards);
                setHasWildcardAccess(wildcard);
                try {
                    sessionStorage.setItem(
                        CARDS_CACHE_KEY,
                        JSON.stringify({ cards: fetchedCards, hasWildcardAccess: wildcard, timestamp: Date.now() })
                    );
                } catch {
                    // ignore quota errors
                }
            } else {
                setCards((prev) => (prev.length > 0 ? prev : []));
            }
        } catch (err) {
            console.error("[MyDashboardModule] Fetch error:", err);
            setCards((prev) => (prev.length > 0 ? prev : []));
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // Hydrate from sessionStorage immediately on client mount to prevent SSR mismatch
        try {
            const raw = sessionStorage.getItem(CARDS_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.cards)) {
                    setCards(parsed.cards);
                    setHasWildcardAccess(Boolean(parsed.hasWildcardAccess));
                    setLoading(false);
                }
            }
        } catch {
            // ignore cache parse issues
        }
        fetchCards();
    }, [fetchCards]);

    return (
        <div className={`flex flex-col gap-6 p-4 sm:p-6 min-h-[calc(100vh-8rem)] ${className}`}>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary ring-1 ring-primary/20">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            My Dashboard
                        </h1>
                        {hasWildcardAccess && (
                            <Badge
                                variant="outline"
                                className="ml-2 gap-1.5 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium"
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Full Access (Card #1)</span>
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Monitor your personal business intelligence metrics and reports.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchCards(true)}
                        disabled={loading || refreshing}
                        className="gap-2 border-border bg-background hover:bg-accent text-foreground hover:text-accent-foreground"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                /* Loading Skeletons */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-border bg-card shadow-sm animate-pulse p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-28 bg-muted rounded" />
                                <div className="h-4 w-16 bg-muted rounded" />
                            </div>
                            <div className="h-8 w-20 bg-muted/80 rounded my-1" />
                            <div className="h-9 w-full bg-muted/50 rounded-lg" />
                        </Card>
                    ))}
                </div>
            ) : cards.length === 0 ? (
                /* Blank / Administrator Notice State */
                <Card className="flex-1 border-dashed border-2 border-border/80 bg-card/50 backdrop-blur-sm shadow-none">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Personal Dashboard
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Widgets in this dashboard are managed and provisioned by system administration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[320px] text-center p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground border border-border/50 mb-4">
                            <LayoutDashboard className="h-8 w-8 stroke-[1.5]" />
                        </div>
                        <p className="text-base font-medium text-foreground mb-1">
                            No widgets assigned yet
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mb-6">
                            You currently do not have any widgets assigned to your personal dashboard.
                        </p>

                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs sm:text-sm max-w-md">
                            <Info className="h-4 w-4 shrink-0 text-primary" />
                            <span>
                                Please contact your system administrator to have widgets configured or assigned to your account.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Assigned Cards Container */
                <div className="space-y-4 sm:space-y-5">
                    {/* Dashboard Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 grid-flow-dense">
                        {cards.map((card) => {
                                            if (
                                                card.key === "sales-order-for-approval" ||
                                                card.key === "sales_order_for_approval"
                                            ) {
                                                return (
                                                    <SalesOrderForApprovalCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "sales-order-draft" ||
                                                card.key === "sales_order_draft"
                                            ) {
                                                return (
                                                    <SalesOrderDraftCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "sales-order-pending" ||
                                                card.key === "sales_order_pending"
                                            ) {
                                                return (
                                                    <SalesOrderPendingCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "sales-order-invoice" ||
                                                card.key === "sales_order_invoice"
                                            ) {
                                                return (
                                                    <SalesOrderInvoiceCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "sales-order-for-consolidation" ||
                                                card.key === "sales_order_for_consolidation"
                                            ) {
                                                return (
                                                    <SalesOrderForConsolidationCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-expense-report" ||
                                                card.key === "company_expense_report"
                                            ) {
                                                return (
                                                    <CompanyExpenseReportCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-payroll-cutoff-progress" ||
                                                card.key === "company_payroll_cutoff_progress"
                                            ) {
                                                return (
                                                    <CompanyPayrollCutoffProgressCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "holdings-payroll-cutoff-progress" ||
                                                card.key === "holdings_payroll_cutoff_progress"
                                            ) {
                                                return (
                                                    <HoldingsPayrollCutoffProgressCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "driver-kpi" ||
                                                card.key === "driver_kpi"
                                            ) {
                                                return (
                                                    <DriverKPICard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "department-head" ||
                                                card.key === "department_head" ||
                                                card.key === "department-head-summary" ||
                                                card.key === "department_head_summary"
                                            ) {
                                                return (
                                                    <DepartmentHeadSummaryCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-attendance-report" ||
                                                card.key === "company_attendance_report" ||
                                                card.key === "company-attendance" ||
                                                card.key === "company_attendance"
                                            ) {
                                                return (
                                                    <CompanyAttendanceReportCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-punctuality-report" ||
                                                card.key === "company_punctuality_report" ||
                                                card.key === "company-punctuality" ||
                                                card.key === "company_punctuality" ||
                                                card.key === "punctuality-report" ||
                                                card.key === "punctuality_report" ||
                                                card.key === "punctuality"
                                            ) {
                                                return (
                                                    <CompanyPunctualityReportCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-punctuality-detailed" ||
                                                card.key === "company_punctuality_detailed" ||
                                                card.key === "company-punctuality-detailed-report" ||
                                                card.key === "company_punctuality_detailed_report" ||
                                                card.key === "punctuality-detailed" ||
                                                card.key === "punctuality_detailed"
                                            ) {
                                                return (
                                                    <CompanyPunctualityDetailedCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "company-total-employee" ||
                                                card.key === "company_total_employee" ||
                                                card.key === "company-total-employees" ||
                                                card.key === "company_total_employees" ||
                                                card.key === "total-employee" ||
                                                card.key === "total_employee" ||
                                                card.key === "total-employees" ||
                                                card.key === "total_employees"
                                            ) {
                                                return (
                                                    <CompanyTotalEmployeeCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "accounts-receivable-detailed" ||
                                                card.key === "accounts_receivable_detailed"
                                            ) {
                                                return (
                                                    <AccountsReceivableDetailedCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            if (
                                                card.key === "accounts-payable-detailed" ||
                                                card.key === "accounts_payable_detailed"
                                            ) {
                                                return (
                                                    <AccountsPayableDetailedCard
                                                        key={card.id}
                                                        card={card}
                                                    />
                                                );
                                            }

                                            return (
                                                <Card
                                                    key={card.id}
                                                    className="flex flex-col border-border bg-card shadow-sm hover:shadow-md transition-shadow w-full aspect-square"
                                                >
                                                    <CardHeader className="p-3 pb-1">
                                                        <div className="flex items-center justify-between gap-1.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20">
                                                                    {getCardIcon(card.key)}
                                                                </div>
                                                                <CardTitle className="text-xs font-semibold truncate text-foreground">
                                                                    {formatCardTitle(card.key)}
                                                                </CardTitle>
                                                            </div>
                                                            <Badge
                                                                variant="secondary"
                                                                className="shrink-0 text-[9px] font-mono uppercase px-1 py-0 bg-muted text-muted-foreground"
                                                            >
                                                                #{card.id}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-0 flex-1 flex flex-col justify-center text-center">
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {formatCardTitle(card.key)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                            Active
                                                        </span>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                </div>
            )}
        </div>
    );
}
