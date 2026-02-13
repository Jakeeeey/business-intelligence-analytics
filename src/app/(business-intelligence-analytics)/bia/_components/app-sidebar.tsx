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
                        { title: "SamG", url: "/bia/target-setting-reports/samg", icon: Users },
                    ],
                },
            ],
        },
    ],
};

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
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
                        <NavMain items={data.navMain} />
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
