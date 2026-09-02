import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiltersProps {
  datePreset: string;
  setDatePreset: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  suppliersList: { id: string; name: string }[];
  selectedSuppliers: string[];
  isAllSelected: boolean;
  toggleSupplier: (id: string) => void;
  toggleAll: () => void;
  loadData: () => void;
  loading: boolean;
}

export function Filters({
  datePreset,
  setDatePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  suppliersList,
  selectedSuppliers,
  isAllSelected,
  toggleSupplier,
  toggleAll,
  loadData,
  loading
}: FiltersProps) {
  const [openDropdown, setOpenDropdown] = useState(false);

  const presets = [
    { value: 'all-time', label: 'All Time' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="flex flex-wrap gap-6 items-end w-full bg-card p-4 rounded-xl border shadow-sm">
      {/* Quick Range Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Quick Range</label>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button
              key={p.value}
              variant={datePreset === p.value ? "default" : "secondary"}
              onClick={() => setDatePreset(p.value)}
              className="h-8 px-4 text-xs rounded-md"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs (only visible when 'custom' is active) */}
      {datePreset === 'custom' && (
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 w-[150px]">
            <label className="text-sm font-medium">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1 w-[150px]">
            <label className="text-sm font-medium">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      )}
      
      {/* Suppliers Dropdown and Fetch Data Button */}
      <div className="flex flex-col gap-2 flex-1 min-w-[300px]">
        <label className="text-sm font-medium">Suppliers</label>
        <div className="flex gap-2 w-full">
          <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between font-normal text-left h-10">
                <span className="truncate">
                  {isAllSelected 
                    ? 'All Suppliers (Summary)' 
                    : `${selectedSuppliers.length} Supplier(s) selected`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search supplier..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No supplier found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={toggleAll} className="font-semibold cursor-pointer">
                      <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isAllSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                        <Check className="h-4 w-4" />
                      </div>
                      (Select All)
                    </CommandItem>
                    {suppliersList.map(s => {
                      const isSelected = selectedSuppliers.includes(s.id);
                      return (
                        <CommandItem 
                          key={s.id} 
                          onSelect={() => toggleSupplier(s.id)}
                          className="cursor-pointer"
                        >
                          <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                            <Check className="h-4 w-4" />
                          </div>
                          {s.name}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <Button 
            onClick={loadData}
            disabled={loading}
            className="h-10 px-8"
          >
            {loading ? 'Fetching...' : 'Fetch Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
