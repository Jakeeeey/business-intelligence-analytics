"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarClock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1).reverse(); // 12 → 1
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 00 … 55
const MERIDIEM = ["AM", "PM"] as const;

type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
};

function TimeColumn({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-[268px] min-w-0 flex-col", className)}>
      <div className="border-b bg-muted/40 py-1.5 text-center text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
        {label}
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-1.5">{children}</div>
    </div>
  );
}

/**
 * Inline 12-hour date + time picker: a Calendar beside scrollable hour / minute /
 * AM-PM columns, under a selected-value strip. Rendered inline (never in a
 * popover) so it stays inside the dialog's scroll-locked subtree — a portaled
 * popover cannot be wheel-scrolled while a modal dialog is open.
 */
export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const next = new Date(date);
    if (value) next.setHours(value.getHours(), value.getMinutes());
    onChange(next);
  };

  const handleTimeChange = (type: "hour" | "minute" | "ampm", raw: string) => {
    const current = value ?? new Date();
    const next = new Date(current);

    if (type === "hour") {
      const hour12 = parseInt(raw, 10);
      next.setHours((hour12 % 12) + (next.getHours() >= 12 ? 12 : 0));
    } else if (type === "minute") {
      next.setMinutes(parseInt(raw, 10));
    } else {
      const hours = next.getHours();
      if (raw === "AM" && hours >= 12) next.setHours(hours - 12);
      else if (raw === "PM" && hours < 12) next.setHours(hours + 12);
    }

    onChange(next);
  };

  const hour12 = value ? value.getHours() % 12 || 12 : null;
  const isPM = value ? value.getHours() >= 12 : false;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          className="rounded-lg border p-2"
        />
        <div className="flex min-w-0 divide-x overflow-hidden rounded-lg border">
          <TimeColumn label="Hour" className="flex-1">
            {HOURS.map((hour) => (
              <Button
                key={hour}
                type="button"
                size="sm"
                variant={hour12 === hour ? "default" : "ghost"}
                className="w-full justify-center tabular-nums"
                onClick={() => handleTimeChange("hour", hour.toString())}
              >
                {hour}
              </Button>
            ))}
          </TimeColumn>
          <TimeColumn label="Min" className="flex-1">
            {MINUTES.map((minute) => (
              <Button
                key={minute}
                type="button"
                size="sm"
                variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                className="w-full justify-center tabular-nums"
                onClick={() => handleTimeChange("minute", minute.toString())}
              >
                {minute.toString().padStart(2, "0")}
              </Button>
            ))}
          </TimeColumn>
          <TimeColumn label="AM/PM" className="flex-1">
            {MERIDIEM.map((meridiem) => (
              <Button
                key={meridiem}
                type="button"
                size="sm"
                variant={value && (meridiem === "PM") === isPM ? "default" : "ghost"}
                className="w-full justify-center"
                onClick={() => handleTimeChange("ampm", meridiem)}
              >
                {meridiem}
              </Button>
            ))}
          </TimeColumn>
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <CalendarClock
            className={cn("size-4 shrink-0", value ? "text-primary" : "text-muted-foreground")}
          />
          <span className={cn("truncate", value ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {value ? format(value, "MMMM d, yyyy · hh:mm aa") : "No date & time selected yet"}
          </span>
        </span>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
            onClick={() => onChange(undefined)}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
