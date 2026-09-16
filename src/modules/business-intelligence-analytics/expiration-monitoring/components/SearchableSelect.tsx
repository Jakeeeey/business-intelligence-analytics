"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label = "ALL OPTIONS",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full text-sm font-medium" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between h-9 px-3 border border-border/40 rounded-md bg-background hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-left text-xs uppercase"
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
        </span>
        <ChevronDown size={14} className="shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border border-border/60 rounded-lg shadow-2xl max-h-60 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 sticky top-0 bg-popover z-10">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent border-none focus:outline-none text-[11px] font-black tracking-widest uppercase placeholder:text-muted-foreground/50"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
            <div
              className={`flex items-center justify-between px-3 py-2 text-[11px] font-medium uppercase rounded-md cursor-pointer transition-colors ${!value ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted/50"}`}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchQuery("");
              }}
            >
              <span>{label}</span>
              {!value && <Check size={14} className="shrink-0" />}
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-[11px] text-center text-muted-foreground uppercase font-medium">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center justify-between px-3 py-2 text-[11px] font-medium uppercase rounded-md cursor-pointer mt-1 transition-colors ${value === option.value ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted/50"}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  title={option.label}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {value === option.value && <Check size={14} className="shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
