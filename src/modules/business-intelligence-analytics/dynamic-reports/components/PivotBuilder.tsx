"use client";

import React, { useState, useMemo, useCallback } from "react";
import { 
  DndContext, 
  DragOverlay, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerActivationConstraint,
  defaultDropAnimationSideEffects,
  rectIntersection
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  LayoutGrid, 
  Rows, 
  Columns, 
  Calculator, 
  GripVertical,
  Settings2,
  Filter as FilterIcon,
  CalendarDays,
  Search,
  Save,
  Trash2,
  Plus,
  FolderOpen,
  ChevronDown,
  X,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DraggableField, PivotZone, AggregationType, DateGrouping, FilterOperator } from "../types";
import { ReportLayout } from "../services/DynamicReportService";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PivotBuilderProps {
  zones: Record<string, PivotZone>;
  setZones: (zones: Record<string, PivotZone>) => void;
  data: Record<string, unknown>[]; // Raw data for unique value extraction
  onValueAggChange: (fieldId: string, agg: AggregationType) => void;
  onDateGroupingChange: (zoneId: string, fieldId: string, grouping: DateGrouping) => void;
  onFilterChange: (fieldId: string, operator: FilterOperator, value: string) => void;
  onSaveLayout?: () => void;
  savedLayouts?: ReportLayout[];
  onApplyLayout?: (layout: ReportLayout) => void;
  onDeleteLayout?: (id: string | number) => void;
  onNewLayout?: () => void;
  activeLayoutId?: string | number | null;
  layoutName?: string;
  onLayoutNameChange?: (name: string) => void;
}

const zoneStyles = {
  rows: "border-l-[3px] border-l-blue-600 border-y border-r border-border bg-blue-50/30 dark:bg-blue-900/10",
  columns: "border-l-[3px] border-l-purple-600 border-y border-r border-border bg-purple-50/30 dark:bg-purple-900/10",
  values: "border-l-[3px] border-l-emerald-600 border-y border-r border-border bg-emerald-50/30 dark:bg-emerald-900/10",
  filters: "border-l-[3px] border-l-amber-600 border-y border-r border-border bg-amber-50/30 dark:bg-amber-900/10",
  available: "bg-transparent"
};

const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[_-]/g, ' ')      // Replace underscores/hyphens with spaces
    .trim()
    .toUpperCase();             // Convert to ALL CAPS
};

export function PivotBuilder({ 
  zones, 
  setZones, 
  data, 
  onValueAggChange, 
  onDateGroupingChange, 
  onFilterChange, 
  onSaveLayout,
  savedLayouts = [],
  onApplyLayout,
  onDeleteLayout,
  onNewLayout,
  activeLayoutId,
  layoutName = "",
  onLayoutNameChange
}: PivotBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAvailableFields = useMemo(() => {
    return zones.available.fields.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatHeader(f.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zones.available.fields, searchQuery]);

  const activationConstraint: PointerActivationConstraint = {
    distance: 5,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = useCallback((id: string): string | undefined => {
    if (zones[id]) return id;
    const rawId = id.includes('-') ? id.split('-')[1] : id;
    return Object.keys(zones).find((key) => 
      zones[key].fields.some((f) => f.id === rawId)
    );
  }, [zones]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const rawActiveId = activeId.includes('-') ? activeId.split('-')[1] : activeId;
    
    if (!zones[activeContainer] || !zones[overContainer]) return;

    const activeFields = zones[activeContainer].fields;
    const overFields = zones[overContainer].fields;

    const activeIndex = activeFields.findIndex((f) => f.id === rawActiveId);
    const field = activeFields[activeIndex];

    if (field) {
      const newZones = { ...zones };
      
      const updatedField = { ...field };
      if (overContainer === 'values' && activeContainer !== 'values') {
        updatedField.aggType = 'sum';
      }

      if (overContainer === 'filters') {
        updatedField.filterOperator = 'equals';
        if (field.type === 'string' && !field.filterValue) {
          const uniqueVals = new Set<string>();
          data.forEach(r => {
            const v = r[field.sourceId || field.id];
            if (v !== undefined && v !== null) uniqueVals.add(String(v));
          });
          updatedField.filterValue = Array.from(uniqueVals).join(',');
        }
      }

      // If dragging from available, we DON'T remove it from available (Cloning behavior).
      // However, dnd-kit Sortable expects it to move. So we temporarily remove it here, 
      // and we will ensure the 'available' list always stays full in our master state or handleDragEnd.
      // Actually, to avoid UI flicker, let's just let it be removed during drag, and we'll restore it in handleDragEnd.
      newZones[activeContainer] = {
        ...zones[activeContainer],
        fields: activeFields.filter(f => f.id !== rawActiveId)
      };

      const rawOverId = overId.includes('-') ? overId.split('-')[1] : overId;
      const overIndex = overFields.findIndex((f) => f.id === rawOverId);
      const newIndex = overIndex >= 0 ? overIndex : overFields.length;

      const newOverFields = [...overFields];
      newOverFields.splice(newIndex, 0, updatedField);

      newZones[overContainer] = {
        ...zones[overContainer],
        fields: newOverFields
      };

      setZones(newZones);
    }
  }, [zones, findContainer, setZones, data]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Restore the full available list from data columns so it never depletes
    const masterAvailableFields = Object.keys(data[0] || {}).map(c => {
      const isDate = c.toLowerCase().includes('date') || c.toLowerCase().includes('time') || c.toLowerCase().endsWith('_at');
      const isNumeric = data.some(r => typeof r[c] === 'number');
      return {
        id: c,
        sourceId: c,
        name: c,
        type: isDate ? 'date' : isNumeric ? 'number' : 'string',
        dateGrouping: isDate ? 'daily' : undefined
      } as DraggableField;
    });

    let newZones = { ...zones };

    if (over) {
      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);

      if (activeContainer && activeContainer === overContainer) {
        // Reordering within the same container
        const rawActiveId = activeId.includes('-') ? activeId.split('-')[1] : activeId;
        const rawOverId = overId.includes('-') ? overId.split('-')[1] : overId;
        
        const fields = newZones[activeContainer].fields;
        const oldIndex = fields.findIndex((f) => f.id === rawActiveId);
        const newIndex = fields.findIndex((f) => f.id === rawOverId);

        newZones[activeContainer] = {
          ...newZones[activeContainer],
          fields: arrayMove(fields, oldIndex, newIndex)
        };
      } else if (activeContainer && overContainer) {
        // Just finished a cross-container move (handled visually by DragOver)
        // Now we assign a permanent unique ID to the dropped item so it can be duplicated later
        const rawActiveId = activeId.includes('-') ? activeId.split('-')[1] : activeId;
        
        const fieldIndex = newZones[overContainer].fields.findIndex(f => f.id === rawActiveId);
        if (fieldIndex !== -1) {
          const field = { ...newZones[overContainer].fields[fieldIndex] };
          
          // Generate unique ID for Values zone to allow duplicates
          if (overContainer === 'values') {
            field.id = `val_${field.sourceId || field.id}_${Math.random().toString(36).substr(2, 9)}`;
          }

          // EXCLUSIVITY RULE: Rows, Columns, Filters can only have ONE instance of a sourceId
          if (overContainer !== 'values' && overContainer !== 'available') {
            const sourceId = field.sourceId || field.id;
            ['rows', 'columns', 'filters'].forEach(zoneKey => {
              if (zoneKey !== overContainer) {
                newZones[zoneKey] = {
                  ...newZones[zoneKey],
                  fields: newZones[zoneKey].fields.filter(f => (f.sourceId || f.id) !== sourceId)
                };
              }
            });
          }

          newZones[overContainer].fields[fieldIndex] = field;
        }
      }
    } else {
      // Dropped outside any valid container -> DELETE it (unless it was already in available)
      const activeId = active.id as string;
      const activeContainer = findContainer(activeId);
      if (activeContainer && activeContainer !== 'available') {
        const rawActiveId = activeId.includes('-') ? activeId.split('-')[1] : activeId;
        newZones[activeContainer] = {
          ...newZones[activeContainer],
          fields: newZones[activeContainer].fields.filter(f => f.id !== rawActiveId)
        };
      }
    }

    // Always reset available fields to the master list to ensure it's persistent
    newZones.available = {
      ...newZones.available,
      fields: masterAvailableFields
    };

    setZones(newZones);
    setActiveId(null);
  }, [zones, findContainer, setZones, data]);

  const activeField = useMemo(() => {
    if (!activeId) return null;
    const rawId = activeId.includes('-') ? activeId.split('-')[1] : activeId;
    // When dragging from available, it might be in the master list
    const masterAvailableFields = Object.keys(data[0] || {}).map(c => ({ id: c, sourceId: c, name: c, type: 'string' }));
    
    for (const zone of Object.values(zones)) {
      const field = zone.fields.find(f => f.id === rawId);
      if (field) return field;
    }
    
    return masterAvailableFields.find(f => f.id === rawId) as DraggableField || null;
  }, [activeId, zones, data]);

  const activeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    ['rows', 'columns', 'values', 'filters'].forEach(z => {
      if (zones[z]) {
        zones[z].fields.forEach(f => ids.add(f.sourceId || f.id));
      }
    });
    return ids;
  }, [zones]);

  const handleRemoveField = useCallback((fieldId: string) => {
    const newZones = { ...zones };
    for (const zoneKey of ['rows', 'columns', 'values', 'filters']) {
      if (newZones[zoneKey]) {
        newZones[zoneKey] = {
          ...newZones[zoneKey],
          fields: newZones[zoneKey].fields.filter(f => f.id !== fieldId)
        };
      }
    }
    setZones(newZones);
  }, [zones, setZones]);

  return (
    <div className="h-full p-4">
      <div 
        className={cn(
          "h-full flex flex-col bg-background border border-border rounded-md overflow-hidden relative shadow-sm transition-colors duration-300",
          "dark:bg-slate-950/40 dark:border-border"
        )}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.4) 1px, transparent 0)`,
          backgroundSize: '16px 16px'
        }}
      >
        <TooltipProvider delayDuration={400}>
          {/* 1. COMPACT HEADER */}
          <div className="px-5 py-4 border-b border-border bg-muted/30 dark:bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-between">
            <h2 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2 text-foreground/80">
              <Settings2 className="w-3.5 h-3.5 text-primary" />
              PIVOT LAYOUT
            </h2>
            <div className="flex items-center gap-1">
              {activeLayoutId && onDeleteLayout && (
                <button 
                  onClick={() => onDeleteLayout(activeLayoutId)}
                  className="p-1.5 hover:bg-destructive/10 text-destructive transition-all active:scale-90 rounded"
                  title="Delete current layout"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onSaveLayout && (
                <button 
                  onClick={onSaveLayout}
                  className="p-1.5 hover:bg-primary/10 text-primary rounded transition-all active:scale-90 rounded"
                  title="Save current layout"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/20">
            {/* 1.5 SAVED VIEWS & NAMING (NEW IN-PLACE UI) */}
            <div className="px-5 py-4 border-b border-border/40 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                  <Input 
                    value={layoutName}
                    onChange={(e) => onLayoutNameChange?.(e.target.value)}
                    placeholder={activeLayoutId ? "RENAME LAYOUT..." : "NEW LAYOUT NAME..."}
                    className={cn(
                      "h-9 pl-8 text-[11px] font-bold tracking-tight bg-background border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-sm",
                      activeLayoutId && "text-primary"
                    )}
                  />
                  <FolderOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 w-9 flex items-center justify-center bg-background border border-primary/20 rounded-lg hover:bg-muted transition-all active:scale-95 shadow-sm">
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-xl border-border shadow-premium z-[600] p-1">
                    <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest px-2 py-1.5">
                      {savedLayouts.length > 0 ? "Your Saved Layouts" : "Management"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuGroup>
                      {savedLayouts.length > 0 ? (
                        savedLayouts.map(l => (
                          <DropdownMenuItem 
                            key={l.id}
                            onSelect={() => {
                              if (onApplyLayout) onApplyLayout(l);
                            }}
                            className={cn(
                              "rounded-lg py-2.5 text-[11px] font-bold focus:bg-primary/5",
                              activeLayoutId?.toString() === l.id.toString() && "bg-primary/5 text-primary"
                            )}
                          >
                            {l.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-[10px] text-muted-foreground italic text-center">
                          No layouts saved yet
                        </div>
                      )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem 
                      onSelect={() => onNewLayout?.()}
                      className="rounded-lg py-2.5 text-[10px] font-black text-primary focus:bg-primary/5 flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      CREATE NEW VIEW
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 2. AVAILABLE FIELDS SECTION */}
            <div className="bg-muted/10 dark:bg-slate-900/20 border-b border-border/40 backdrop-blur-[2px]">
               <div className="px-5 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3 opacity-40" />
                    Available Fields
                  </label>
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold font-mono border-border/50 bg-background dark:bg-slate-900 tabular-nums">
                    {zones.available.fields.length.toString().padStart(2, '0')}
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
                  <Input 
                    placeholder="SEARCH FIELDS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 pl-7 text-[9px] font-black uppercase bg-background/50 dark:bg-slate-950/50 border-border/30 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              
              <div className="px-5 pb-6">
                <DroppableZone 
                  id="available" 
                  fields={filteredAvailableFields} 
                  activeSourceIds={activeSourceIds}
                  placeholder={searchQuery ? "NO MATCHING FIELDS" : "NO FIELDS AVAILABLE"}
                  className="bg-transparent border-none min-h-0 p-0"
                  data={data}
                />
              </div>
            </div>

            {/* 3. DROP ZONES SECTION (ROWS, COLS, VALUES, FILTERS) */}
            <div className="p-4 space-y-6 bg-background/40 dark:bg-slate-950/60 backdrop-blur-md">
               <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <ZoneHeader title="Rows" icon={<Rows className="w-3 h-3" />} count={zones.rows.fields.length} />
                    <DroppableZone 
                      id="rows" 
                      fields={zones.rows.fields} 
                      placeholder="DROP ROWS" 
                      isCompact 
                      onDateGroupingChange={onDateGroupingChange}
                      onRemove={handleRemoveField}
                      className={zoneStyles.rows}
                      data={data}
                    />
                  </div>

                  <div className="space-y-2">
                    <ZoneHeader title="Columns" icon={<Columns className="w-3 h-3 rotate-90" />} count={zones.columns.fields.length} />
                    <DroppableZone 
                      id="columns" 
                      fields={zones.columns.fields} 
                      placeholder="DROP COLUMNS" 
                      isCompact 
                      onDateGroupingChange={onDateGroupingChange}
                      onRemove={handleRemoveField}
                      className={zoneStyles.columns}
                      data={data}
                    />
                  </div>

                  <div className="space-y-2">
                    <ZoneHeader title="Values" icon={<Calculator className="w-3 h-3" />} count={zones.values.fields.length} />
                    <DroppableZone 
                      id="values" 
                      fields={zones.values.fields} 
                      isValues 
                      onAggChange={onValueAggChange}
                      placeholder="DROP VALUES" 
                      isCompact
                      onRemove={handleRemoveField}
                      className={zoneStyles.values}
                      data={data}
                    />
                  </div>

                  <div className="space-y-2">
                    <ZoneHeader title="Filters" icon={<FilterIcon className="w-3 h-3" />} count={zones.filters?.fields.length || 0} />
                    <DroppableZone 
                      id="filters" 
                      fields={zones.filters?.fields || []} 
                      placeholder="DROP FILTERS" 
                      isCompact
                      onFilterChange={onFilterChange}
                      onRemove={handleRemoveField}
                      className={zoneStyles.filters}
                      data={data}
                    />
                  </div>
               </div>
            </div>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.4' } }
            })
          }}>
            {activeField ? (
              <div className="shadow-premium border-2 border-primary/50 cursor-grabbing scale-105 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/95 backdrop-blur-md transition-all">
                <GripVertical className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tight truncate select-none">
                  {formatHeader(activeField.name)}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </TooltipProvider>
    </div>
  </div>
);
}

function ZoneHeader({ title, icon, count }: { title: string; icon: React.ReactNode; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
        <span className="text-primary opacity-60">{icon}</span>
        {title}
      </label>
      <span className="text-[9px] font-bold font-mono text-muted-foreground/40 tabular-nums">
        {count.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

interface DroppableZoneProps {
  id: string;
  fields: DraggableField[];
  isValues?: boolean;
  onAggChange?: (fieldId: string, agg: AggregationType) => void;
  onDateGroupingChange?: (zoneId: string, fieldId: string, grouping: DateGrouping) => void;
  onFilterChange?: (fieldId: string, operator: FilterOperator, value: string) => void;
  onRemove?: (fieldId: string) => void;
  activeSourceIds?: Set<string>;
  placeholder?: string;
  isCompact?: boolean;
  className?: string;
  data: Record<string, unknown>[];
}

function DroppableZone({ id, fields, isValues, onAggChange, onDateGroupingChange, onFilterChange, onRemove, activeSourceIds, placeholder, isCompact, className, data }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useSortable({ id });
  const sortableItems = useMemo(() => fields.map(f => `${id}-${f.id}`), [id, fields]);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[40px] rounded-xl border border-dashed transition-all duration-300 relative",
        fields.length === 0 ? "bg-muted/5 border-border/50" : "bg-muted/10 border-border/60",
        isOver && "border-primary/50 bg-primary/5 scale-[1.01] shadow-inner",
        className
      )}
    >
      {fields.length === 0 && placeholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
          <span className="text-[8px] font-black uppercase tracking-widest">{placeholder}</span>
        </div>
      )}
      
      <SortableContext id={id} items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className={cn("p-1.5 space-y-1.5", isCompact && "p-1 space-y-1")}>
          {fields.map(field => (
            <SortableItem 
              key={`${id}-${field.id}`} 
              id={`${id}-${field.id}`} 
              zoneId={id}
              field={field} 
              isValues={isValues}
              onAggChange={onAggChange}
              onDateGroupingChange={onDateGroupingChange}
              onFilterChange={onFilterChange}
              onRemove={onRemove}
              isActiveInLayout={id === 'available' && activeSourceIds?.has(field.sourceId || field.id)}
              isCompact={isCompact}
              data={data}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableItem({ id, zoneId, field, isValues, onAggChange, onDateGroupingChange, onFilterChange, onRemove, isActiveInLayout, isCompact, data }: { 
  id: string; 
  zoneId: string;
  field: DraggableField; 
  isValues?: boolean;
  onAggChange?: (fieldId: string, agg: AggregationType) => void;
  onDateGroupingChange?: (zoneId: string, fieldId: string, grouping: DateGrouping) => void;
  onFilterChange?: (fieldId: string, operator: FilterOperator, value: string) => void;
  onRemove?: (fieldId: string) => void;
  isActiveInLayout?: boolean;
  isCompact?: boolean;
  data: Record<string, unknown>[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const formattedName = formatHeader(field.name);
  const isLongLabel = formattedName.length > 15;

  const itemZoneStyles = {
    rows: "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10",
    columns: "border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10",
    values: "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10",
    filters: "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10",
    available: "border-border/60 bg-background"
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        if (zoneId !== 'available' && onRemove) {
          e.preventDefault();
          onRemove(field.id);
        }
      }}
      style={style}
      className={cn(
        "group flex flex-col gap-1 px-2 py-1.5 rounded-lg border shadow-sm transition-all duration-200",
        "cursor-grab active:cursor-grabbing",
        itemZoneStyles[zoneId as keyof typeof itemZoneStyles] || itemZoneStyles.available,
        "hover:border-primary/60 hover:shadow-md active:scale-[0.98]",
        isDragging && "opacity-20 scale-95",
        isCompact && "px-1.5 py-1"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground/30 group-hover:text-primary transition-colors">
          <GripVertical className="w-3 h-3" />
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1 text-[10px] font-black uppercase tracking-tight truncate select-none text-foreground/70 group-hover:text-foreground">
              {formattedName}
            </span>
          </TooltipTrigger>
          {isLongLabel && (
            <TooltipContent side="right" className="bg-slate-900 text-slate-50 border-none font-black text-[9px] tracking-widest uppercase">
              {formattedName}
            </TooltipContent>
          )}
        </Tooltip>
        
        {/* Active Indicator for Available Zone */}
        {zoneId === 'available' && isActiveInLayout && (
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        )}

        {/* Remove Button for Layout Zones */}
        {zoneId !== 'available' && onRemove && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-all"
            title="Remove field"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Aggregation Selector (for Values) */}
        {isValues && onAggChange && (
            <Select 
              value={field.aggType || "sum"}
              onValueChange={(val) => onAggChange(field.id, val as AggregationType)}
            >
              <SelectTrigger className="h-6 w-16 text-[8px] font-black uppercase rounded-md border border-primary/20 bg-primary/5 focus:ring-0 p-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-premium font-mono z-[600]">
                <SelectItem value="sum" className="text-[9px] font-bold uppercase py-1">SUM</SelectItem>
                <SelectItem value="count" className="text-[9px] font-bold uppercase py-1">COUNT</SelectItem>
                <SelectItem value="average" className="text-[9px] font-bold uppercase py-1">AVG</SelectItem>
                <SelectItem value="min" className="text-[9px] font-bold uppercase py-1">MIN</SelectItem>
                <SelectItem value="max" className="text-[9px] font-bold uppercase py-1">MAX</SelectItem>
              </SelectContent>
            </Select>
        )}
      </div>

      {/* Advanced Exception: DATE GROUPING (if field is date and in Rows/Cols) */}
      {!isValues && field.type === 'date' && onDateGroupingChange && zoneId !== 'available' && zoneId !== 'filters' && (
        <div className="flex items-center gap-1 mt-0.5 pt-1 border-t border-border/30">
          <CalendarDays className="w-2.5 h-2.5 text-primary opacity-40" />
          <Select 
            value={field.dateGrouping || "daily"}
            onValueChange={(val) => onDateGroupingChange(zoneId, field.id, val as DateGrouping)}
          >
            <SelectTrigger className="h-5 flex-1 text-[7px] font-black uppercase rounded bg-muted/30 border-none focus:ring-0 p-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border shadow-premium font-mono z-[600]">
              <SelectItem value="daily" className="text-[8px] font-bold uppercase py-1">Daily</SelectItem>
              <SelectItem value="weekly" className="text-[8px] font-bold uppercase py-1">Weekly</SelectItem>
              <SelectItem value="monthly" className="text-[8px] font-bold uppercase py-1">Monthly</SelectItem>
              <SelectItem value="quarterly" className="text-[8px] font-bold uppercase py-1">Quarterly</SelectItem>
              <SelectItem value="yearly" className="text-[8px] font-bold uppercase py-1">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

       {/* Advanced Exception: EXCEL-STYLE FILTERING (for Filters zone) */}
      {zoneId === 'filters' && onFilterChange && (
        <div className="flex flex-col gap-1.5 mt-1 pt-1.5 border-t border-border/30">
          {field.type === 'string' ? (
            <FilterValuePicker 
              field={field} 
              data={data} 
              onChange={(value) => onFilterChange(field.id, 'equals', value)} 
            />
          ) : (
            <>
              <div className="flex items-center gap-1">
                <FilterIcon className="w-2.5 h-2.5 text-primary opacity-40" />
                <Select 
                  value={field.filterOperator || "equals"}
                  onValueChange={(val) => onFilterChange(field.id, val as FilterOperator, field.filterValue || "")}
                >
                  <SelectTrigger className="h-6 flex-1 text-[8px] font-black uppercase rounded bg-muted/30 border border-border/40 focus:ring-0 p-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-premium font-mono z-[600]">
                    <SelectItem value="equals" className="text-[9px] font-bold uppercase py-1">EQUALS</SelectItem>
                    <SelectItem value="contains" className="text-[9px] font-bold uppercase py-1">CONTAINS</SelectItem>
                    <SelectItem value="gt" className="text-[9px] font-bold uppercase py-1">GREATER THAN</SelectItem>
                    <SelectItem value="lt" className="text-[9px] font-bold uppercase py-1">LESS THAN</SelectItem>
                    <SelectItem value="not_equals" className="text-[9px] font-bold uppercase py-1">NOT EQUALS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input 
                placeholder="Value..."
                defaultValue={field.filterValue || ""}
                onChange={(e) => onFilterChange(field.id, field.filterOperator || "equals", e.target.value)}
                className="h-6 text-[9px] font-bold bg-background/50 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- NEW COMPONENT: EXCEL-STYLE FILTER PICKER ---
function FilterValuePicker({ field, data, onChange }: { field: DraggableField; data: Record<string, unknown>[]; onChange: (val: string) => void }) {
  const [search, setSearch] = useState("");
  
  // Extract unique values for this field
  const uniqueValues = useMemo(() => {
    const values = new Set<string>();
    if (!Array.isArray(data)) return []; // Safety check
    data.forEach(row => {
      const val = row[field.id];
      if (val !== undefined && val !== null) {
        values.add(String(val));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data, field.id]);

  const filteredValues = useMemo(() => {
    if (!search) return uniqueValues;
    return uniqueValues.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  }, [uniqueValues, search]);

  const selectedValues = useMemo(() => {
    if (!field.filterValue) return [];
    return field.filterValue.split(",").map(v => v.trim());
  }, [field.filterValue]);

  const handleToggle = (val: string) => {
    let newSelected: string[];
    if (selectedValues.includes(val)) {
      newSelected = selectedValues.filter(v => v !== val);
    } else {
      newSelected = [...selectedValues, val];
    }
    onChange(newSelected.join(","));
  };

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      onChange("");
    } else {
      onChange(uniqueValues.join(","));
    }
  };

  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="relative group/search">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/30 group-focus-within/search:text-primary/50 transition-colors" />
        <Input 
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-5 pl-5 pr-1 text-[8px] font-bold bg-background/30 border-border/20 focus-visible:ring-0 focus-visible:border-primary/30"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll();
          }}
          className="text-[7px] font-black uppercase text-primary hover:underline"
        >
          {selectedValues.length === uniqueValues.length ? "CLEAR ALL" : "SELECT ALL"}
        </button>
        <span className="text-[7px] font-bold text-muted-foreground/40 tabular-nums">
          {selectedValues.length}/{uniqueValues.length}
        </span>
      </div>

      <div className="max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/40 pr-1 space-y-0.5">
        {filteredValues.map(val => {
          const isSelected = selectedValues.includes(val);
          return (
            <div 
              key={val}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(val);
              }}
              className={cn(
                "flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-all",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-2.5 h-2.5 rounded-sm border flex items-center justify-center transition-colors",
                isSelected ? "bg-primary border-primary shadow-[0_0_5px_rgba(var(--primary),0.3)]" : "border-border/60"
              )}>
                {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
              </div>
              <span className={cn(
                "text-[9px] truncate transition-colors",
                isSelected ? "font-black text-foreground" : "font-medium text-muted-foreground"
              )}>
                {val}
              </span>
            </div>
          );
        })}
        {filteredValues.length === 0 && (
          <div className="py-2 text-center text-[7px] font-bold text-muted-foreground opacity-30 italic">
            NO ITEMS FOUND
          </div>
        )}
      </div>
    </div>
  );
}
