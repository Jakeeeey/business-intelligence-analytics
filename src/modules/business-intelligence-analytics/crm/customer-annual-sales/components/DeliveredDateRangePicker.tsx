"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DeliveredDateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DeliveredDateRangePicker({
  date: externalDate,
  onDateChange,
}: DeliveredDateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    externalDate
  );
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setInternalDate(externalDate);
    }
  }, [isOpen, externalDate]);

  const handleApply = () => {
    onDateChange(internalDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInternalDate(undefined);
    onDateChange(undefined);
    setIsOpen(false);
  };

  const formatDateLabel = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  const getButtonLabel = () => {
    if (externalDate?.from && externalDate?.to) {
      return `${formatDateLabel(externalDate.from)} - ${formatDateLabel(externalDate.to)}`;
    }
    if (externalDate?.from) {
      return `${formatDateLabel(externalDate.from)} - ...`;
    }
    return "Delivered Date Filter";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="delivered-date-filter"
          variant="outline"
          className="h-10 px-3 text-xs font-medium border-border bg-background hover:bg-accent flex items-center gap-2"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate max-w-[220px]">{getButtonLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 border-border bg-card text-card-foreground shadow-lg rounded-xl" align="start">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Delivered Date Range
              </h4>
              <p className="text-xs text-muted-foreground">
                Select start and end delivery dates
              </p>
            </div>
            {internalDate?.from && (
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {formatDateLabel(internalDate.from)}
                {internalDate.to ? ` — ${formatDateLabel(internalDate.to)}` : ""}
              </span>
            )}
          </div>

          {/* Horizontal Calendars Side by Side */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* From Date */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                From Date
              </span>
              <div className="rounded-lg border border-border bg-card p-1">
                <Calendar
                  mode="single"
                  selected={internalDate?.from}
                  onSelect={(day) =>
                    setInternalDate((prev) => ({
                      from: day,
                      to: prev?.to && day && day > prev.to ? undefined : prev?.to,
                    }))
                  }
                  initialFocus
                  className="p-1"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                To Date
              </span>
              <div className="rounded-lg border border-border bg-card p-1">
                <Calendar
                  mode="single"
                  selected={internalDate?.to}
                  onSelect={(day) =>
                    setInternalDate((prev) => ({
                      from: prev?.from,
                      to: day,
                    }))
                  }
                  className="p-1"
                  disabled={(date) =>
                    internalDate?.from ? date < internalDate.from : false
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-4"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs px-4"
              onClick={handleApply}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
