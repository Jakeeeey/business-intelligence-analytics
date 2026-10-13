"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { FileCheck2, Clock, AlertCircle, BellRing, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DashboardCardItem } from "../types";

interface SalesOrderMetricData {
    count: number;
    totalAmount?: number;
    status?: string;
}

interface SalesOrderForApprovalCardProps {
    card: DashboardCardItem;
}

const CACHE_KEY = "bia_so_for_approval_cache";

/**
 * Synthesizes a crisp, audible notification chime using Web Audio API.
 * Requires zero external audio files and triggers cleanly in any browser.
 */
function playNotificationChime() {
    try {
        const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
            ctx.resume();
        }
        const now = ctx.currentTime;

        // Tone 1: D5 (587.33 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.3, now + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tone 2: A5 (880 Hz) - higher ping
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0.35, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
    } catch (err) {
        console.debug("[SalesOrderForApprovalCard] Audio notification prevented:", err);
    }
}

/**
 * Dispatches a native OS system notification to the laptop / desktop.
 */
function showDesktopNotification(title: string, body: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
        try {
            new Notification(title, {
                body,
                icon: "/favicon.ico",
            });
        } catch (err) {
            console.debug("[SalesOrderForApprovalCard] Desktop notification error:", err);
        }
    }
}

export default function SalesOrderForApprovalCard({ card }: SalesOrderForApprovalCardProps) {
    const isCacheEnabled = card.cached !== false;
    const cacheTtlMs =
        typeof card.cached_time === "number" && card.cached_time > 0
            ? card.cached_time * 1000
            : 60 * 1000;
    const isRingEnabled = card.has_ringtone !== false;
    const isPopupEnabled = card.has_popup !== false;
    const isWsEnabled = card.is_web_socket !== false;
    const pollIntervalMs =
        typeof card.cached_time === "number" && card.cached_time > 0
            ? Math.max(5, card.cached_time) * 1000
            : 12000;

    // 1. Instant Cache Initialization based on card.cached configuration
    const [data, setData] = useState<SalesOrderMetricData | null>(() => {
        if (typeof window === "undefined" || !isCacheEnabled) return null;
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.timestamp && Date.now() - parsed.timestamp < cacheTtlMs) {
                    return parsed.data as SalesOrderMetricData;
                }
                if (!parsed.timestamp && typeof parsed.count === "number") {
                    return parsed as SalesOrderMetricData;
                }
            }
        } catch {
            // ignore cache parse issues
        }
        return null;
    });

    const [loading, setLoading] = useState<boolean>(() => {
        if (typeof window === "undefined" || !isCacheEnabled) return true;
        return !sessionStorage.getItem(CACHE_KEY);
    });
    const [error, setError] = useState<string | null>(null);
    const [hasNewArrival, setHasNewArrival] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [hasDesktopPermission, setHasDesktopPermission] = useState<boolean>(false);

    // Track previous count to detect newly added orders
    const prevCountRef = useRef<number | null>(null);
    const isFirstMountRef = useRef(true);

    // Request desktop notification permission on mount if popup is enabled
    useEffect(() => {
        if (isPopupEnabled && typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
                setHasDesktopPermission(true);
            } else if (Notification.permission === "default") {
                Notification.requestPermission()
                    .then((perm) => {
                        setHasDesktopPermission(perm === "granted");
                    })
                    .catch(() => {});
            }
        }
    }, [isPopupEnabled]);

    const requestPermissionPrompt = () => {
        if (typeof window !== "undefined" && "Notification" in window) {
            Notification.requestPermission().then((perm) => {
                const isGranted = perm === "granted";
                setHasDesktopPermission(isGranted);
                if (isGranted) {
                    toast.success("Laptop Notifications Enabled", {
                        description: "You will now receive desktop alerts for new sales orders.",
                    });
                }
            });
        }
    };

    const handleNewArrivalDetection = useCallback(
        (newCount: number) => {
            if (isFirstMountRef.current) {
                // Record initial baseline count without ringing on first page load
                prevCountRef.current = newCount;
                isFirstMountRef.current = false;
                return;
            }

            if (prevCountRef.current !== null && newCount > prevCountRef.current) {
                const diff = newCount - prevCountRef.current;
                const message = `${diff === 1 ? "A new sales order" : `${diff} new sales orders`} arrived for approval.`;

                // 1. Play audio ring if has_ringtone is enabled
                if (isRingEnabled) {
                    playNotificationChime();
                }

                // 2. Visual flash on the card
                setHasNewArrival(true);
                setTimeout(() => setHasNewArrival(false), 4000);

                // 3. Show popups (toast & laptop desktop) if has_popup is enabled
                if (isPopupEnabled) {
                    toast.info("Sales Order for Approval", {
                        description: message,
                        duration: 6000,
                    });
                    showDesktopNotification("Sales Order for Approval", message);
                }
            }

            prevCountRef.current = newCount;
        },
        [isRingEnabled, isPopupEnabled]
    );

    const fetchMetric = useCallback(
        async (showSpinner = false) => {
            if (showSpinner) setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/bia/my-dashboard/metrics/sales-order-for-approval", {
                    cache: "no-store",
                });
                if (!res.ok) {
                    throw new Error("Failed to load metric");
                }
                const json: SalesOrderMetricData = await res.json();
                setData(json);

                // Cache in session storage if enabled
                if (isCacheEnabled) {
                    try {
                        sessionStorage.setItem(
                            CACHE_KEY,
                            JSON.stringify({ data: json, timestamp: Date.now() })
                        );
                    } catch {
                        // ignore storage quota issues
                    }
                }

                handleNewArrivalDetection(json.count);
            } catch (err) {
                console.error("[SalesOrderForApprovalCard] Fetch error:", err);
                setError("Unable to load data");
            } finally {
                if (showSpinner) setLoading(false);
            }
        },
        [handleNewArrivalDetection, isCacheEnabled]
    );

    // Initial fetch on mount
    useEffect(() => {
        fetchMetric(data === null);
    }, [fetchMetric, data]);

    // Real-time synchronization (WebSocket if enabled, plus smart heartbeat polling)
    useEffect(() => {
        let ws: WebSocket | null = null;
        let isMounted = true;
        let pollTimer: ReturnType<typeof setInterval> | null = null;

        const tryConnectWs = () => {
            if (!isWsEnabled) return;
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                if (!baseUrl) return;
                const wsUrl = baseUrl.replace(/^http/, "ws") + "/websocket";
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    if (!isMounted) return;
                    setWsConnected(true);
                    try {
                        ws?.send(
                            JSON.stringify({
                                type: "subscribe",
                                collection: "sales_order",
                                query: {
                                    fields: ["order_id", "order_status"],
                                    filter: { order_status: { _eq: "For Approval" } },
                                },
                            })
                        );
                    } catch {
                        // ignore send errors
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        if (
                            payload.type === "subscription" ||
                            payload.event === "create" ||
                            payload.event === "update"
                        ) {
                            fetchMetric(false);
                        }
                    } catch {
                        // ignore non-json messages
                    }
                };

                ws.onclose = () => {
                    if (isMounted) setWsConnected(false);
                };

                ws.onerror = () => {
                    if (isMounted) setWsConnected(false);
                };
            } catch {
                if (isMounted) setWsConnected(false);
            }
        };

        if (isWsEnabled) {
            tryConnectWs();
        }

        // Heartbeat polling aligned with cached_time configuration
        pollTimer = setInterval(() => {
            fetchMetric(false);
        }, pollIntervalMs);

        return () => {
            isMounted = false;
            if (pollTimer) clearInterval(pollTimer);
            if (ws) {
                try {
                    ws.close();
                } catch {
                    // ignore
                }
            }
        };
    }, [fetchMetric, isWsEnabled, pollIntervalMs]);

    return (
        <a
            href="/crm/customer-hub/sales-order-approval"
            className="block w-full max-w-[200px] sm:max-w-[210px] aspect-square no-underline text-inherit focus:outline-none select-none"
        >
            <Card
                className={`flex flex-col border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-xs hover:shadow-md hover:border-amber-500/60 transition-all duration-300 overflow-hidden py-0 gap-0 dark:border-zinc-800 w-full h-full aspect-square justify-between cursor-pointer group ${
                    hasNewArrival ? "ring-2 ring-amber-500 animate-pulse" : ""
                }`}
            >
                {/* Top Amber Accent Bar */}
                <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-amber-400 shrink-0" />

                {/* Compact Header */}
                <div className="px-3 py-2 border-b border-border/40 dark:border-zinc-800/60 flex items-center justify-between gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                requestPermissionPrompt();
                            }}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 hover:ring-1 hover:ring-amber-500/50 transition-all cursor-pointer"
                            title={
                                hasDesktopPermission
                                    ? "Laptop notifications active"
                                    : "Click to enable laptop desktop alerts"
                            }
                        >
                            {hasNewArrival ? (
                                <BellRing className="h-3 w-3 text-amber-600 animate-bounce" />
                            ) : (
                                <FileCheck2 className="h-3 w-3" />
                            )}
                        </button>
                        <span className="text-[11px] font-semibold text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Sales Orders
                        </span>
                    </div>

                    <Badge
                        variant="outline"
                        className="shrink-0 gap-0.5 border-amber-500/30 bg-amber-50/80 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] px-1 py-0 font-medium"
                    >
                        <Clock className="h-2 w-2" />
                        <span>Approval</span>
                        <ArrowUpRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Badge>
                </div>

                {/* Square Center Hero Count */}
                <div className="px-3 py-2 flex-1 flex flex-col justify-center items-center text-center">
                    {loading && !data ? (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                            <Spinner className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px]">Loading...</span>
                        </div>
                    ) : error && !data ? (
                        <div className="flex items-center gap-1 p-1.5 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-[10px]">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{error}</span>
                        </div>
                    ) : (
                        <div>
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono leading-none tabular-nums group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {data?.count ?? 0}
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground block mt-1">
                                For Approval
                            </span>
                        </div>
                    )}
                </div>

                {/* Compact Footer */}
                <div className="px-2.5 py-1.5 border-t border-border/40 dark:border-zinc-800/60 flex items-center justify-between text-[9px] text-muted-foreground bg-muted/20 dark:bg-zinc-900/30 shrink-0">
                    <span className="font-mono text-muted-foreground/80 truncate max-w-[100px]">
                        #{card.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {hasDesktopPermission && (
                            <span
                                className="text-[8px] text-amber-600 dark:text-amber-400 font-mono font-medium"
                                title="Laptop OS notifications active"
                            >
                                🔔 OS
                            </span>
                        )}
                        <span
                            className={`inline-flex items-center gap-1 font-medium shrink-0 ${
                                wsConnected
                                    ? "text-sky-600 dark:text-sky-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                            }`}
                            title={wsConnected ? "WebSocket Connected" : "Live Heartbeat"}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    wsConnected ? "bg-sky-500" : "bg-emerald-500"
                                } animate-pulse`}
                            />
                            {wsConnected ? "Socket" : "Live"}
                        </span>
                    </div>
                </div>
            </Card>
        </a>
    );
}
