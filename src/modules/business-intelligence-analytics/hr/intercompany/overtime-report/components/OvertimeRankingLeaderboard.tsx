"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  Clock,
  CheckCircle2,
  Eye,
  Building2,
  Flame,
} from "lucide-react";
import { EmployeeOvertimeSummary } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OvertimeRankingLeaderboardProps {
  employees: EmployeeOvertimeSummary[];
  onViewDetail: (emp: EmployeeOvertimeSummary) => void;
}

type RankingCriteria = "approvedHours" | "actualHours" | "filedHours" | "requestsCount";

export function OvertimeRankingLeaderboard({
  employees,
  onViewDetail,
}: OvertimeRankingLeaderboardProps) {
  const [criteria, setCriteria] = useState<RankingCriteria>("approvedHours");
  const [topLimit, setTopLimit] = useState<number>(10);

  // Filter only employees who have filed overtime or rendered actual overtime
  const overtimeEmployees = useMemo(() => {
    return employees.filter(
      (e) =>
        e.totalOtHours > 0 ||
        e.totalOtRequests > 0 ||
        e.totalActualOtHours > 0 ||
        e.totalApprovedOtHours > 0
    );
  }, [employees]);

  // Ranked list sorted by selected criteria
  const rankedEmployees = useMemo(() => {
    const list = [...overtimeEmployees];
    list.sort((a, b) => {
      if (criteria === "approvedHours") {
        if (b.totalApprovedOtHours !== a.totalApprovedOtHours) {
          return b.totalApprovedOtHours - a.totalApprovedOtHours;
        }
        return b.totalActualOtHours - a.totalActualOtHours;
      }
      if (criteria === "actualHours") {
        if (b.totalActualOtHours !== a.totalActualOtHours) {
          return b.totalActualOtHours - a.totalActualOtHours;
        }
        return b.totalApprovedOtHours - a.totalApprovedOtHours;
      }
      if (criteria === "filedHours") {
        if (b.totalFiledOtHours !== a.totalFiledOtHours) {
          return b.totalFiledOtHours - a.totalFiledOtHours;
        }
        return b.totalApprovedOtHours - a.totalApprovedOtHours;
      }
      if (criteria === "requestsCount") {
        if (b.totalOtRequests !== a.totalOtRequests) {
          return b.totalOtRequests - a.totalOtRequests;
        }
        return b.totalApprovedOtHours - a.totalApprovedOtHours;
      }
      return 0;
    });
    return list;
  }, [overtimeEmployees, criteria]);

  // Maximum value for proportional progress calculation
  const maxMetricValue = useMemo(() => {
    if (rankedEmployees.length === 0) return 1;
    if (criteria === "approvedHours") return rankedEmployees[0].totalApprovedOtHours || 1;
    if (criteria === "actualHours") return rankedEmployees[0].totalActualOtHours || 1;
    if (criteria === "filedHours") return rankedEmployees[0].totalFiledOtHours || 1;
    return rankedEmployees[0].totalOtRequests || 1;
  }, [rankedEmployees, criteria]);

  const top3 = useMemo(() => rankedEmployees.slice(0, 3), [rankedEmployees]);
  const displayedList = useMemo(() => {
    if (topLimit === 0) return rankedEmployees;
    return rankedEmployees.slice(0, topLimit);
  }, [rankedEmployees, topLimit]);

  return (
    <div className="space-y-6">
      {/* 1. Ranking Controls & Overview Header */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Highest Overtime Rankings
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-mono font-semibold"
                >
                  <Flame className="h-3 w-3 mr-1 text-amber-500" />
                  Top Performers
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Intercompany ranking: Actual Overtime vs Filed vs Actual Approved Overtime
              </p>
            </div>
          </div>

          {/* Criteria & Limit Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background border border-border/80 shadow-xs">
              <button
                type="button"
                onClick={() => setCriteria("actualHours")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  criteria === "actualHours"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Actual OT
              </button>
              <button
                type="button"
                onClick={() => setCriteria("approvedHours")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  criteria === "approvedHours"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Actual Approved
              </button>
              <button
                type="button"
                onClick={() => setCriteria("filedHours")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  criteria === "filedHours"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Filed OT
              </button>
              <button
                type="button"
                onClick={() => setCriteria("requestsCount")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  criteria === "requestsCount"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Requests Count
              </button>
            </div>

            <Select
              value={String(topLimit)}
              onValueChange={(val) => setTopLimit(Number(val))}
            >
              <SelectTrigger className="h-8 w-28 text-xs rounded-xl border-border/80 bg-background">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="25">Top 25</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="0">All Ranked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="order-2 md:order-1 rounded-2xl border border-slate-400/30 bg-gradient-to-b from-slate-400/10 via-card to-card p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-400/15 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-400/30">
                  <Medal className="h-3.5 w-3.5 text-slate-400" />
                  #2 Silver
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                  {top3[1].companyCode}
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-slate-400/20 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xl border-2 border-slate-400/40 shadow-inner">
                  {top3[1].name.charAt(0).toUpperCase()}
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2 line-clamp-1">
                  {top3[1].name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {top3[1].position} • {top3[1].department}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-400" /> Actual OT:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {top3[1].totalActualOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Filed OT:</span>
                  <span className="font-mono font-medium text-foreground">
                    {top3[1].totalFiledOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium text-emerald-600 dark:text-emerald-400">
                    Actual Approved:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {top3[1].totalApprovedOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Reqs / Approval:</span>
                  <span className="font-semibold text-foreground">
                    {top3[1].approvedOtRequests}/{top3[1].totalOtRequests} ({top3[1].approvalRate}%)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(top3[1])}
                  className="w-full h-7 text-xs rounded-lg mt-2 border-slate-400/30 hover:bg-slate-400/10"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View Overtime Profile
                </Button>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Elevated in Center) */}
          {top3[0] && (
            <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/15 via-card to-card p-5 shadow-lg shadow-amber-500/10 flex flex-col justify-between transition-all scale-100 md:-translate-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs shadow-sm">
                  <Trophy className="h-3.5 w-3.5" />
                  #1 Champion
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40">
                  {top3[0].companyCode}
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="relative inline-block">
                  <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-2xl border-2 border-white dark:border-zinc-900 shadow-md">
                    {top3[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -top-2.5 -right-1 h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow">
                    👑
                  </div>
                </div>
                <h4 className="text-base font-extrabold text-foreground mt-2 line-clamp-1">
                  {top3[0].name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {top3[0].position} • {top3[0].department}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-amber-500/30 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Actual OT:
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {top3[0].totalActualOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Filed OT:</span>
                  <span className="font-mono font-medium text-foreground">
                    {top3[0].totalFiledOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Actual Approved OT:
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {top3[0].totalApprovedOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[11px]">
                  <span className="text-muted-foreground">Reqs / Approval:</span>
                  <span className="font-semibold text-foreground">
                    {top3[0].approvedOtRequests}/{top3[0].totalOtRequests} ({top3[0].approvalRate}%)
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => onViewDetail(top3[0])}
                  className="w-full h-8 text-xs font-bold rounded-xl mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View Overtime Profile
                </Button>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="order-3 md:order-3 rounded-2xl border border-amber-700/30 bg-gradient-to-b from-amber-700/10 via-card to-card p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-700/30">
                  <Medal className="h-3.5 w-3.5 text-amber-700" />
                  #3 Bronze
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                  {top3[2].companyCode}
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-xl border-2 border-amber-700/40 shadow-inner">
                  {top3[2].name.charAt(0).toUpperCase()}
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2 line-clamp-1">
                  {top3[2].name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {top3[2].position} • {top3[2].department}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-700" /> Actual OT:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {top3[2].totalActualOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Filed OT:</span>
                  <span className="font-mono font-medium text-foreground">
                    {top3[2].totalFiledOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium text-emerald-600 dark:text-emerald-400">
                    Actual Approved:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {top3[2].totalApprovedOtHours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Reqs / Approval:</span>
                  <span className="font-semibold text-foreground">
                    {top3[2].approvedOtRequests}/{top3[2].totalOtRequests} ({top3[2].approvalRate}%)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(top3[2])}
                  className="w-full h-7 text-xs rounded-lg mt-2 border-amber-700/30 hover:bg-amber-700/10"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View Overtime Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Full Ranked Leaderboard Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Official Leaderboard Standings
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-semibold">
              {displayedList.length} Ranked
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Ranked by{" "}
            <span className="font-semibold text-foreground">
              {criteria === "actualHours"
                ? "Actual Overtime Hours"
                : criteria === "approvedHours"
                ? "Actual Approved OT Hours"
                : criteria === "filedHours"
                ? "Filed Overtime Hours"
                : "Total Requests Filed"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-transparent">
                <TableHead className="w-16 text-center text-xs font-semibold">
                  Rank
                </TableHead>
                <TableHead className="min-w-[170px] text-xs font-semibold">
                  Employee
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Subsidiary
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Department
                </TableHead>
                <TableHead className="min-w-[150px] text-xs font-semibold">
                  Rank Progress
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Actual OT
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Filed OT
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Actual Approved
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Requests
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Approval %
                </TableHead>
                <TableHead className="w-20 text-right text-xs font-semibold">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    No overtime activity found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                displayedList.map((emp, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const rankBadgeStyle =
                    rank === 1
                      ? "bg-amber-500 text-white font-black"
                      : rank === 2
                      ? "bg-slate-400 text-white font-bold"
                      : rank === 3
                      ? "bg-amber-700 text-white font-bold"
                      : "bg-muted text-muted-foreground font-semibold border";

                  const metricVal =
                    criteria === "actualHours"
                      ? emp.totalActualOtHours
                      : criteria === "approvedHours"
                      ? emp.totalApprovedOtHours
                      : criteria === "filedHours"
                      ? emp.totalFiledOtHours
                      : emp.totalOtRequests;

                  const sharePct = Math.round((metricVal / maxMetricValue) * 100);

                  return (
                    <TableRow
                      key={`${emp.companyId}-${emp.userId}`}
                      className="hover:bg-muted/40 border-b border-border/40 text-xs transition-colors"
                    >
                      {/* Rank */}
                      <TableCell className="text-center">
                        <div
                          className={`h-7 w-7 rounded-lg mx-auto flex items-center justify-center text-xs ${rankBadgeStyle}`}
                        >
                          {rank}
                        </div>
                      </TableCell>

                      {/* Employee */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {emp.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Subsidiary */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-muted border border-border text-foreground">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {emp.companyCode}
                        </span>
                      </TableCell>

                      {/* Department */}
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{emp.department}</p>
                          <p className="text-[11px] text-muted-foreground">{emp.position}</p>
                        </div>
                      </TableCell>

                      {/* Visual Progress */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-foreground">
                              {criteria === "requestsCount"
                                ? `${metricVal} reqs`
                                : `${metricVal.toFixed(1)} hrs`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {sharePct}%
                            </span>
                          </div>
                          <Progress
                            value={sharePct}
                            className={`h-2 ${
                              isTop3 ? "[&>div]:bg-amber-500" : "[&>div]:bg-indigo-500"
                            }`}
                          />
                        </div>
                      </TableCell>

                      {/* 1. Actual Overtime */}
                      <TableCell className="text-right tabular-nums">
                        <span className="font-semibold text-foreground">
                          {emp.totalActualOtHours.toFixed(1)} hrs
                        </span>
                      </TableCell>

                      {/* 2. Filed Overtime */}
                      <TableCell className="text-right tabular-nums">
                        <span className="text-muted-foreground">
                          {emp.totalFiledOtHours.toFixed(1)} hrs
                        </span>
                      </TableCell>

                      {/* 3. Actual Approved Overtime */}
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={`font-bold ${
                            emp.totalApprovedOtHours > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {emp.totalApprovedOtHours.toFixed(1)} hrs
                        </span>
                      </TableCell>

                      {/* Total Reqs */}
                      <TableCell className="text-right tabular-nums">
                        <span className="font-semibold text-foreground">
                          {emp.approvedOtRequests}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {" "}/ {emp.totalOtRequests}
                        </span>
                      </TableCell>

                      {/* Approval Rate */}
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            emp.approvalRate >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : emp.approvalRate >= 50
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {emp.approvalRate}%
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(emp)}
                          className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
