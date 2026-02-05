"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

export type MultiSelectOption = { value: string; label: string; disabled?: boolean };

export function MultiSelect(props: {
  value: string[];
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (next: string[]) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { value, options, onChange, placeholder = "Select...", searchPlaceholder = "Search...", className, disabled } = props;

  const selected = React.useMemo(() => new Set(value), [value]);

  function toggle(v: string) {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next.values()));
  }

  const labelMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const o of options) m.set(o.value, o.label);
    return m;
  }, [options]);

  const chips = value
    .map((v) => ({ v, label: labelMap.get(v) ?? v }))
    .slice(0, 2);

  const extra = Math.max(0, value.length - chips.length);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-between gap-2 cursor-pointer", className)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                {chips.map((c) => (
                  <Badge key={c.v} variant="secondary" className="max-w-[180px] truncate">
                    {c.label}
                  </Badge>
                ))}
                {extra > 0 ? <Badge variant="secondary">+{extra}</Badge> : null}
              </div>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>

            <CommandGroup>
              <ScrollArea className="h-60">
                {options.map((o) => {
                  const isOn = selected.has(o.value);
                  return (
                    <CommandItem
                      key={o.value}
                      value={o.label}
                      onSelect={() => {
                        if (o.disabled) return;
                        toggle(o.value);
                      }}
                      className={cn("cursor-pointer", o.disabled && "opacity-50 cursor-not-allowed")}
                    >
                      <span
                        className={cn(
                          "mr-2 inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                          isOn ? "bg-primary text-primary-foreground border-primary" : "bg-background",
                        )}
                      >
                        {isOn ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
