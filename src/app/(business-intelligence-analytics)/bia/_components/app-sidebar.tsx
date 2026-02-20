// src/app/(business-intelligence-analytics)/bia/_components/app-sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    BarChart3,
    Target,
    LineChart,
    BadgeCheck,
    UserCog,
    Briefcase,
    UserRound,
    HeartPulse,
    Factory,
    Gauge,
    ArrowLeftRight,
    Network,
    MapPinned,
    Users,

    // ✅ SCM icons
    Boxes,
    ClipboardList,
    BarChart4,
    BadgeAlert,
    Timer,
    Percent,
    Truck,
    History, // Added History icon
} from "lucide-react";

import { NavMain } from "./nav-main";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
    navMain: [
        {
            title: "CRM",
            url: "#",
            icon: BarChart3,
            items: [
                {
                    title: "Sales Report",
                    url: "#",
                    icon: Target,
                    items: [
                        { title: "Salesman Performance", url: "/bia/sales-report/salesman-performance", icon: BadgeCheck },
                        { title: "Product Sales Performance", url: "/bia/sales-report/product-sales-performance", icon: UserCog },
                        { title: "Product Returns Performance", url: "/bia/sales-report/product-returns-performance", icon: UserCog },
                    ],
                },
                {
                    title: "Target Settings",
                    url: "#",
                    icon: Target,
                    items: [
                        { title: "Target Approval", url: "/bia/target-setting/target-approval", icon: BadgeCheck },
                        { title: "Executive", url: "/bia/target-setting/executive", icon: UserCog },
                        { title: "Manager", url: "/bia/target-setting/manager", icon: Briefcase },
                        { title: "Supervisor", url: "/bia/target-setting/supervisor", icon: UserRound },
                    ],
                },
                {
                    title: "Target Setting Reports",
                    url: "#",
                    icon: LineChart,
                    items: [
                        { title: "Executive Health", url: "/bia/target-setting-reports/executive-health", icon: HeartPulse },
                        { title: "Managerial / Supplier", url: "/bia/target-setting-reports/managerial-supplier", icon: Factory },
                        { title: "Salesman KPI", url: "/bia/target-setting-reports/salesman-kpi", icon: Gauge },
                        { title: "AR and Remittance", url: "/bia/target-setting-reports/ar-and-remittance", icon: ArrowLeftRight },
                        { title: "Channel", url: "/bia/target-setting-reports/channel", icon: Network },
                        { title: "Area", url: "/bia/target-setting-reports/area", icon: MapPinned },
                        { title: "Audit Trail", url: "/bia/target-setting/ts-audit-trail", icon: History },
                    ],
                },
            ],
        },

        // ✅ NEW: SCM tree
        {
            title: "SCM",
            url: "#",
            icon: Boxes,
            items: [
                {
                    title: "Inventory Performance Dashboard",
                    url: "#",
                    icon: BarChart4,
                    items: [
                        { title: "ABC Analysis", url: "/bia/scm/inventory-performance-dashboard/abc-analysis", icon: ClipboardList },
                        { title: "FNS Analysis", url: "/bia/scm/inventory-performance-dashboard/fns-analysis", icon: ClipboardList },
                    ],
                },
                {
                    title: "Stock Health Monitor",
                    url: "#",
                    icon: BadgeAlert,
                    items: [
                        { title: "Stock-Out Risk", url: "/bia/scm/stock-health-monitor/stock-out-risk", icon: BadgeAlert },
                        { title: "Aging & SLOB", url: "/bia/scm/stock-health-monitor/aging-and-slob", icon: Timer },
                    ],
                },
                {
                    title: "Supplier Reliability Scorecard",
                    url: "#",
                    icon: Truck,
                    items: [
                        { title: "Lead Time Variance", url: "/bia/scm/supplier-reliability-scorecard/lead-time-variance", icon: Timer },
                        { title: "Fulfillment Rate", url: "/bia/scm/supplier-reliability-scorecard/fulfillment-rate", icon: Percent },
                    ],
                },
            ],
        },
    ],
};

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
    const [roles, setRoles] = React.useState<{
        is_executive: boolean;
        is_division_sales_head: boolean;
        is_supervisor: boolean;
        is_target_setting_approver: boolean;
    }>({
        is_executive: false,
        is_division_sales_head: false,
        is_supervisor: false,
        is_target_setting_approver: false
    });

    React.useEffect(() => {
        async function fetchRoles() {
            try {
                const response = await fetch("/api/bia/target-setting/roles");
                const data = await response.json();
                if (data.roles) {
                    setRoles(data.roles);
                }
            } catch (error) {
                console.error("Failed to fetch roles:", error);
            }
        }
        fetchRoles();
    }, []);

    // Filter Logic
    const filteredNavMain = React.useMemo(() => {
        // if (!roles) return data.navMain; // Fail-closed handled by initial state

        return data.navMain.map((group) => {
            // CRM Group contains the nested items we need to filter
            if (group.title === "CRM") {
                const updatedItems = group.items.map((subGroup) => {
                    // Filter "Target Settings" items
                    if (subGroup.title === "Target Settings") {
                        const filteredSubItems = subGroup.items.filter((item) => {
                            // 1. Target Approval: ONLY for Approvers
                            if (item.title === "Target Approval") {
                                return roles.is_target_setting_approver;
                            }

                            // 2. Executive Menu
                            // Visible to: Executive OR Approver
                            // Hidden for: Manager, Supervisor
                            if (item.title === "Executive") {
                                return roles.is_target_setting_approver || roles.is_executive;
                            }

                            // 3. Manager Menu
                            // Visible to: Executive OR Manager OR Approver
                            // Hidden for: Supervisor
                            if (item.title === "Manager") {
                                return roles.is_target_setting_approver || roles.is_executive || roles.is_division_sales_head;
                            }

                            // 4. Supervisor Menu
                            // Visible to: ALL (Supervisor, Manager, Executive, Approver)
                            if (item.title === "Supervisor") {
                                return (
                                    roles.is_target_setting_approver ||
                                    roles.is_executive ||
                                    roles.is_division_sales_head ||
                                    roles.is_supervisor
                                );
                            }

                            return true;
                        });
                        return { ...subGroup, items: filteredSubItems };
                    }

                    // Filter "Target Setting Reports" items
                    if (subGroup.title === "Target Setting Reports") {
                        const filteredSubItems = subGroup.items.filter((item) => {
                            // 1. Executive Health
                            // Visible to: Executive OR Approver
                            // Hidden for: Manager, Supervisor
                            if (item.title === "Executive Health") {
                                return roles.is_target_setting_approver || roles.is_executive;
                            }

                            // 2. Managerial / Supplier
                            // Visible to: Executive OR Manager OR Approver
                            // Hidden for: Supervisor (User: "except sa Executive Health, and Managerial / Supplier")
                            if (item.title === "Managerial / Supplier") {
                                return roles.is_target_setting_approver || roles.is_executive || roles.is_division_sales_head;
                            }

                            // 3. All Other Reports (Salesman KPI, AR, Channel, Area, SamG)
                            // Visible to: Executive OR Manager OR Supervisor OR Approver
                            return (
                                roles.is_target_setting_approver ||
                                roles.is_executive ||
                                roles.is_division_sales_head ||
                                roles.is_supervisor
                            );
                        });
                        return { ...subGroup, items: filteredSubItems };
                    }

                    return subGroup;
                });

                return { ...group, items: updatedItems };
            }

            return group;
        });
    }, [roles]);

    return (
        <Sidebar
            {...props}
            className={cn(
                // ✅ brighter border in dark mode (para kita)
                "border-r border-sidebar-border/60 dark:border-white/20",
                // ✅ premium depth (subtle ring + shadow)
                "shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_16px_40px_-24px_rgba(0,0,0,0.9)]",
                className
            )}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/main-dashboard">
                                <div className="flex aspect-square size-10 items-center justify-center overflow-hidden">
                                    <Image
                                        src="/vertex_logo_black.png"
                                        alt="VOS Logo"
                                        width={40}
                                        height={40}
                                        className="h-9 w-10 object-contain"
                                        priority
                                    />
                                </div>

                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">VOS Web</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Business Intelligence and Analytics
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <Separator />

            <SidebarContent>
                <div className="px-4 pt-3 pb-2 text-xs font-medium text-muted-foreground">Platform</div>

                <ScrollArea
                    className={cn(
                        "min-h-0 flex-1",
                        "[&_[data-radix-scroll-area-viewport]>div]:block",
                        "[&_[data-radix-scroll-area-viewport]>div]:w-full",
                        "[&_[data-radix-scroll-area-viewport]>div]:min-w-0"
                    )}
                >
                    <div className="w-full min-w-0">
                        <NavMain items={filteredNavMain} />
                    </div>
                </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="p-0">
                <Separator />
                <div className="py-3 text-center text-xs text-muted-foreground">VOS Web v2.0</div>
            </SidebarFooter>
        </Sidebar>
    );
}
