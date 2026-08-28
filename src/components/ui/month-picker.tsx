import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MonthPicker({ value, onChange, disabled }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse initial year
  const initialYear = value ? parseInt(value.split("-")[0], 10) : new Date().getFullYear();
  const [currentYear, setCurrentYear] = React.useState(initialYear);

  // Sync internal year when value changes externally
  React.useEffect(() => {
    if (value) {
      setCurrentYear(parseInt(value.split("-")[0], 10));
    }
  }, [value]);

  const handleMonthSelect = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, "0");
    onChange(`${currentYear}-${formattedMonth}`);
    setOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return "Select month...";
    const [year, month] = value.split("-");
    const monthName = MONTHS[parseInt(month, 10) - 1];
    return `${monthName} ${year}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-9 justify-start text-left font-normal bg-background border-border/60 dark:border-zinc-800",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-card border-border/60 shadow-md dark:border-zinc-800" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-border/60 dark:border-zinc-800"
            onClick={() => setCurrentYear(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-sm text-foreground">{currentYear}</div>
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-border/60 dark:border-zinc-800"
            onClick={() => setCurrentYear(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {MONTHS_SHORT.map((month, idx) => {
            const isSelected = value === `${currentYear}-${String(idx + 1).padStart(2, "0")}`;
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-9 text-sm rounded-md",
                  isSelected 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-foreground font-normal hover:bg-muted"
                )}
                onClick={() => handleMonthSelect(idx)}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
