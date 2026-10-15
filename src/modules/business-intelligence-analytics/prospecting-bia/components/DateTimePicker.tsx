"use client";

import * as React from "react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1).reverse(); // 12 → 1
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 00 … 55
const MERIDIEM = ["AM", "PM"] as const;

const COLUMN = "h-[280px] overflow-y-auto overscroll-contain p-1";

type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
};

/**
 * Inline 12-hour date + time picker: a Calendar beside scrollable hour /
 * minute / AM-PM columns. Rendered inline (no popover) so it stays inside the
 * dialog's scroll-locked subtree — a portaled popover cannot be wheel-scrolled
 * while a modal dialog is open.
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
      const isPM = next.getHours() >= 12;
      next.setHours((hour12 % 12) + (isPM ? 12 : 0));
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
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
        <div className="flex h-[280px] w-fit divide-x rounded-md border">
          <div className={cn(COLUMN, "w-14")}>
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
          </div>
          <div className={cn(COLUMN, "w-14")}>
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
          </div>
          <div className={cn(COLUMN, "w-16")}>
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
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? `Selected: ${format(value, "MM/dd/yyyy hh:mm aa")}` : "No date & time selected"}
      </p>
    </div>
  );
}
