"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  ArrowRight,
  MessageSquareWarning,
  UserMinus,
  UserPlus,
  Timer,
  Award,
} from "lucide-react";
import { ActionCenterItem, ActionCategory } from "../types";

interface ActionCenterQueueProps {
  items: ActionCenterItem[];
  activeCategory: "ALL" | ActionCategory;
  onSelectCategory: (cat: "ALL" | ActionCategory) => void;
}

export const ActionCenterQueue: React.FC<ActionCenterQueueProps> = ({
  items,
  activeCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (category: ActionCategory) => {
    switch (category) {
      case "CONCERN":
        return <MessageSquareWarning className="w-4 h-4 text-amber-500" />;
      case "RESIGNATION":
        return <UserMinus className="w-4 h-4 text-rose-500" />;
      case "MANPOWER":
        return <UserPlus className="w-4 h-4 text-cyan-500" />;
      case "OVERTIME":
        return <Timer className="w-4 h-4 text-indigo-500" />;
      case "EVALUATION":
      default:
        return <Award className="w-4 h-4 text-purple-500" />;
    }
  };

  const getPriorityBadge = (priority: ActionCenterItem["priority"]) => {
    switch (priority) {
      case "High":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            High Priority
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Medium Priority
          </span>
        );
      case "Low":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Routine
          </span>
        );
    }
  };

  const categories: { label: string; value: "ALL" | ActionCategory }[] = [
    { label: "All Pending Tasks", value: "ALL" },
    { label: "Grievances & Concerns", value: "CONCERN" },
    { label: "Resignations", value: "RESIGNATION" },
    { label: "Manpower Requisitions", value: "MANPOWER" },
    { label: "Overtime Requests", value: "OVERTIME" },
    { label: "Evaluations", value: "EVALUATION" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  HR Action Center &amp; Escalation Queue
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                  {items.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actionable HR workflows across subsidiaries requiring managerial review or approval
              </p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                activeCategory === cat.value
                  ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[460px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              All Clear - No Pending Action Items
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There are currently no escalations or pending requests requiring review for this category.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                    {getPriorityBadge(item.priority)}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.companyCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.subtitle}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.dateFormatted}
                    </span>
                    <span>•</span>
                    <span>{item.companyName}</span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                <Link
                  href={item.linkUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                >
                  <span>Take Action</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
