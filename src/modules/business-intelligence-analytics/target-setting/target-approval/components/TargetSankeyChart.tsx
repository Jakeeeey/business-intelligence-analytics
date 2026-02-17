"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from "recharts";
import { Share2, Info, Building2, Layers, ShoppingBag, UserCircle, Users, MousePointer2, Maximize2, Minimize2 } from "lucide-react";
import { 
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface TargetSankeyChartProps {
  companyTarget: any;
  allocations: any[];
  supplierAllocations: any[];
  supervisorAllocations: any[];
  salesmanAllocations: any[];
  isLoading?: boolean;
}

export function TargetSankeyChart({
  companyTarget,
  allocations,
  supplierAllocations,
  supervisorAllocations,
  salesmanAllocations,
  isLoading
}: TargetSankeyChartProps) {
  const [activeNode, setActiveNode] = useState<any>(null);
  const [activeLink, setActiveLink] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipPositioned, setTooltipPositioned] = useState(false);
  // Optimize tooltip with Refs to prevent re-renders on every mouse move
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update ref for data access
    mouseRef.current = { x: e.clientX, y: e.clientY };
    
    // Direct DOM update for performance with adaptive positioning
    if (tooltipRef.current) {
        // Default: Position to bottom-right of cursor
        const offset = 15;
        const tooltipWidth = tooltipRef.current.offsetWidth || 220;
        const viewportWidth = window.innerWidth;
        
        // Calculate X position
        let x = e.clientX + offset;
        
        // Check if tooltip would overflow on the right (with 20px buffer)
        if (x + tooltipWidth + 20 > viewportWidth) {
            // Flip to left side of cursor
            x = e.clientX - offset - tooltipWidth;
        }
        
        // Calculate Y position - always below cursor
        const y = e.clientY + offset;
        
        // Apply transform - CSS transition will handle smooth movement
        tooltipRef.current.style.transform = `translate(${x}px, ${y}px)`;
        
        // Mark tooltip as positioned to make it visible
        if (!tooltipPositioned) {
            setTooltipPositioned(true);
        }
    }
  };

  const handleMouseLeave = () => {
    setActiveNode(null);
    setActiveLink(null);
    setTooltipPositioned(false);
  };

  const chartRef = useRef<HTMLDivElement>(null);

  // Reset tooltip positioned state when tooltip is hidden
  useEffect(() => {
    if (!activeNode && !activeLink) {
      setTooltipPositioned(false);
    }
  }, [activeNode, activeLink]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
       setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatPHP = (val: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const colors: Record<string, string> = {
    company: "#8b5cf6",    // Vibrant purple
    division: "#06b6d4",   // Vibrant cyan
    supplier: "#10b981",   // Vibrant emerald (kept)
    supervisor: "#f97316", // Vibrant orange
    salesman: "#f43f5e"    // Vibrant rose/pink
  };

  const data = useMemo(() => {
    if (!companyTarget) return { nodes: [], links: [] };

    const nodes: { name: string, type: string, color: string, id: string }[] = [];
    const links: { source: number, target: number, value: number, parentValue?: number }[] = [];
    
    const nodeMap = new Map<string, number>();

    const getOrCreateNode = (name: string, type: string, uniqueId: string) => {
        const key = `${type}:${uniqueId}`;
        if (nodeMap.has(key)) return nodeMap.get(key)!;
        const index = nodes.length;
        nodes.push({ name, type, color: colors[type] || "#cbd5e1", id: key });
        nodeMap.set(key, index);
        return index;
    };

    // 1. Root Node
    const companyNode = getOrCreateNode("COMPANY WIDE", "company", "root");
    const rootTotal = companyTarget.target_amount || 0;

    // 2. Division Links
    allocations.forEach(div => {
        if (!div.id || div.target_amount <= 0) return;

        const divNode = getOrCreateNode(div.division_name || `Div #${div.division_id}`, "division", div.id);
        links.push({
            source: companyNode,
            target: divNode,
            value: div.target_amount,
            parentValue: rootTotal
        });

        // 3. Supplier Links
        const relevantSuppliers = supplierAllocations.filter(s => s.tsd_id === div.id);
        relevantSuppliers.forEach(sup => {
            if (!sup.id || sup.target_amount <= 0) return;

            const supNode = getOrCreateNode(sup.supplier_name || `Sup #${sup.supplier_id}`, "supplier", sup.id);
            links.push({
                source: divNode,
                target: supNode,
                value: sup.target_amount,
                parentValue: div.target_amount
            });

            // 4. Supervisor Links
            const relevantSupervisors = supervisorAllocations.filter(s => s.tss_id === sup.id);
            relevantSupervisors.forEach(sv => {
                if (!sv.id || sv.target_amount <= 0) return;

                const svNode = getOrCreateNode(sv.supervisor_name || `Supervisor #${sv.supervisor_user_id}`, "supervisor", sv.id);
                links.push({
                    source: supNode,
                    target: svNode,
                    value: sv.target_amount,
                    parentValue: sup.target_amount
                });

                // 5. Salesman Links
                const relevantSalesmen = salesmanAllocations.filter(s => s.ts_supervisor_id === sv.id);
                relevantSalesmen.forEach(sale => {
                    if (!sale.id || sale.target_amount <= 0) return;

                    const saleNode = getOrCreateNode(sale.salesman_name || `Salesman #${sale.salesman_id}`, "salesman", sale.id);
                    links.push({
                        source: svNode,
                        target: saleNode,
                        value: sale.target_amount,
                        parentValue: sv.target_amount
                    });
                });
            });
        });
    });

    // Validated Data Processing
    
    // 1. Deduplicate Links (Aggregate values for same source-target pairs) & Remove Self-Loops
    const linkMap = new Map<string, any>();
    links.forEach(l => {
        if (l.source === l.target) return; // Prevent self-loops
        
        const key = `${l.source}-${l.target}`;
        if (linkMap.has(key)) {
            const existing = linkMap.get(key);
            existing.value += l.value;
        } else {
            linkMap.set(key, { ...l });
        }
    });
    
    const uniqueLinks = Array.from(linkMap.values());

    // 2. Filter out nodes that are not used in any link
    const activeNodeIndices = new Set<number>();
    uniqueLinks.forEach(l => {
        activeNodeIndices.add(l.source);
        activeNodeIndices.add(l.target);
    });

    // Deep clone nodes to avoid mutation issues in Recharts
    const finalNodes = nodes
        .filter((_, i) => activeNodeIndices.has(i))
        .map(n => ({ ...n }));
        
    const indexMapping = new Map<number, number>();
    let newIndex = 0;
    nodes.forEach((_, i) => {
        if (activeNodeIndices.has(i)) {
            indexMapping.set(i, newIndex++);
        }
    });

    // 3. Map links to new indices and strictly validate existance
    const finalLinks = uniqueLinks
        .map(l => {
            const sourceIndex = indexMapping.get(l.source);
            const targetIndex = indexMapping.get(l.target);
            if (sourceIndex === undefined || targetIndex === undefined) return null;
            return {
                ...l,
                source: sourceIndex,
                target: targetIndex
            };
        })
        .filter(l => l !== null); // Remove any links that failed mapping

    return { nodes: finalNodes, links: finalLinks };
  }, [companyTarget, allocations, supplierAllocations, supervisorAllocations, salesmanAllocations]);

  const isHighlighted = (item: any, type: 'node' | 'link') => {
    if (!activeNode && !activeLink) return true; 

    if (activeNode) {
      if (type === 'node') {
        const targetNodeIndex = activeNode.index;
        if (item.index === targetNodeIndex) return true;
        return data.links.some(l => 
          (l.source === targetNodeIndex && l.target === item.index) ||
          (l.target === targetNodeIndex && l.source === item.index)
        );
      } else {
        return item.source.index === activeNode.index || item.target.index === activeNode.index;
      }
    }

    if (activeLink) {
      if (type === 'link') {
        return item.source.index === activeLink.source.index && item.target.index === activeLink.target.index;
      } else {
        return item.index === activeLink.source.index || item.index === activeLink.target.index;
      }
    }

    return false;
  };

  const DemoNode = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth } = props;
    const isNodeActive = isHighlighted(props, 'node');

    // Force labels for the last stag (Salesman) to look left, others look right or auto
    // Using payload.type is safer than coordinate math
    const isRightAligned = payload.type === 'salesman' || (x > (containerWidth || 1000) * 0.6);

    // Label Truncation Logic
    const MAX_LABEL_LENGTH = 16;
    let label = payload.name;
    if (label.length > MAX_LABEL_LENGTH && !activeNode) {
        label = label.substring(0, MAX_LABEL_LENGTH) + "...";
    }

    // Pill styling logic
    const pillPadding = 8;
    const pillHeight = 20;
    const pillY = y + height / 2 - pillHeight / 2;
    const textWidth = label.length * 6; 
    const pillWidth = textWidth + pillPadding * 2;
    
    let pillX;
    if (isRightAligned) {
         pillX = x - pillWidth - 32;  // Increased spacing to 32px
    } else {
         pillX = x + width + 32;      // Increased spacing to 32px
    }

    // Handlers
    const handleEnter = (e: any) => {
        setActiveNode(props);
        setActiveLink(null); // Explicitly clear link state to prevent stuck tooltips
        if (props.onMouseEnter) props.onMouseEnter(e);
    };
    const handleLeave = (e: any) => {
        setActiveNode(null);
        if (props.onMouseLeave) props.onMouseLeave(e);
    };
    const handleClick = (e: any) => {
        // "Instantly focus" - ensure state is set (redundant with hover but explicit intention)
        setActiveNode(props);
    };

    return (
      <Layer key={`node-${index}`}>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill={payload.color}
          fillOpacity={isNodeActive ? 1 : 0.15}
          stroke={isNodeActive ? "currentColor" : "transparent"}
          strokeWidth={2}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onClick={handleClick}
          className={`transition-all duration-300 cursor-pointer ${isNodeActive ? "stroke-slate-400 dark:stroke-white" : ""}`}
          rx={4} 
        />
        
        {/* Label Pill Background - Light Theme requested */}
        <foreignObject x={pillX} y={pillY} width={pillWidth + 20} height={pillHeight}>
          <div 
             onMouseEnter={handleEnter}
             onMouseLeave={handleLeave}
             onClick={handleClick}
             className={`flex items-center justify-center h-full px-2 rounded-full shadow-sm border transition-all duration-300 cursor-pointer ${
               isNodeActive 
                 ? "bg-white text-slate-900 border-primary ring-2 ring-primary/20 scale-105" 
                 : "bg-white/80 text-slate-600 border-slate-100 hover:bg-white hover:text-slate-900 opacity-80"
             }`}
          >
             <span className="text-[10px] font-bold truncate select-none leading-none">{label}</span>
          </div>
        </foreignObject>
      </Layer>
    );
  };

  const DemoLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, index, payload } = props;
    const isLinkActive = isHighlighted(payload, 'link');

    return (
      <Layer key={`link-${index}`}>
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          `}
          strokeWidth={Math.max(linkWidth, 1)}
          stroke='#3b82f6'
          strokeOpacity={isLinkActive ? 0.5 : 0.15}
          fill="none"
          onMouseEnter={(e) => {
             setActiveLink(payload);
             setActiveNode(null); // Explicitly clear node state
             if (props.onMouseEnter) props.onMouseEnter(e);
          }}
          onMouseLeave={(e) => {
             setActiveLink(null);
             if (props.onMouseLeave) props.onMouseLeave(e);
          }}
          className="transition-all duration-300 cursor-pointer"
        />
      </Layer>
    );
  };

  const StageHeader = ({ label, icon: Icon, color }: { label: string, icon: any, color: string }) => (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className="p-1.5 rounded-md bg-opacity-10" style={{ backgroundColor: `${color}1A` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 whitespace-nowrap">{label}</span>
      <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: `${color}4D` }} />
    </div>
  );

  const renderCustomTooltip = () => {
    const activeItem = activeLink || (activeNode ? activeNode.payload : null);
    if (!activeItem) return null;

    const item = activeItem;
    const isLink = item.source !== undefined && item.target !== undefined;
    const rootTotal = companyTarget?.target_amount || 0;
    
    let value = 0;

    if (isLink) {
        // For links, value comes from the link itself
        value = item.value || 0;
        const percentOfParent = item.parentValue ? (value / item.parentValue * 100).toFixed(1) : "0";
        const percentOfRoot = rootTotal ? (value / rootTotal * 100).toFixed(1) : "0";
        const sourceName = typeof item.source === 'object' ? item.source.name : item.source;
        const targetName = typeof item.target === 'object' ? item.target.name : item.target;

        return (
            <div 
                ref={tooltipRef}
                className="fixed z-50 pointer-events-none bg-white dark:bg-slate-900 border-2 border-primary/20 p-4 rounded-xl shadow-2xl text-[10px] min-w-[220px] max-w-[280px] animate-in fade-in duration-150"
                style={{ transform: 'translate(0px, 0px)', left: 0, top: 0, opacity: tooltipPositioned ? 1 : 0, transition: 'transform 0.1s ease-out' }}
            >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Allocation Breakdown</span>
                    </div>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-[9px]">{percentOfParent}% Contribution</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div>
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">From Source</p>
                    <p className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[90px]">{sourceName}</p>
                    </div>
                    <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">To Target</p>
                    <p className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[90px] ml-auto">{targetName}</p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-500 font-medium">Target Amount</span>
                    <span className="text-[12px] font-black text-primary">{formatPHP(value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-medium">Global Impact</span>
                    <span className="text-[9px] font-bold text-slate-400">{percentOfRoot}% of Company Target</span>
                    </div>
                </div>
            </div>
        );
    }

    // Node - Calculate value from links
    if (activeNode) {
        const nodeIndex = activeNode.index;
        
        // Handle potential Recharts mutation where source/target become objects
        // Sum all outgoing links from this node
        const outgoingLinks = data.links.filter(l => {
            const sourceIndex = typeof l.source === 'object' ? (l.source as any).index : l.source;
            return sourceIndex === nodeIndex;
        });
        
        // Sum all incoming links to this node
        const incomingLinks = data.links.filter(l => {
            const targetIndex = typeof l.target === 'object' ? (l.target as any).index : l.target;
            return targetIndex === nodeIndex;
        });
        
        // For nodes with outgoing links, sum those; otherwise sum incoming
        if (outgoingLinks.length > 0) {
            value = outgoingLinks.reduce((sum, link) => sum + (link.value || 0), 0);
        } else if (incomingLinks.length > 0) {
            value = incomingLinks.reduce((sum, link) => sum + (link.value || 0), 0);
        }
    }
    
    const percentOfRoot = rootTotal ? (value / rootTotal * 100).toFixed(1) : "0";
    const nodeName = activeNode?.payload?.name || item.name;
    const nodeType = activeNode?.payload?.type || item.type || "Checkpoint";

    return (
        <div 
            ref={tooltipRef}
            className="fixed z-50 pointer-events-none bg-white dark:bg-slate-900 border-2 border-primary/20 p-3 rounded-lg shadow-2xl text-[10px] min-w-[150px] max-w-[200px] animate-in fade-in duration-150"
            style={{ transform: 'translate(0px, 0px)', left: 0, top: 0, opacity: tooltipPositioned ? 1 : 0, transition: 'transform 0.1s ease-out' }}
        >
            <p className="font-black text-slate-500 uppercase tracking-tighter mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                {nodeType} Checkpoint
            </p>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-[11px] mb-2">{nodeName}</p>
            <div className="flex justify-between items-baseline">
                <span className="text-[12px] font-black text-primary">{formatPHP(value)}</span>
                <span className="text-slate-400 text-[8px] font-medium">{percentOfRoot}% OF TOTAL</span>
            </div>
        </div>
    );
  };

  return (
    <div 
        ref={chartRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`bg-background transition-all duration-300 ${isFullscreen ? "p-6" : ""}`}
    >
      <Card className={`shadow-md border-slate-200 dark:border-slate-800 transition-all duration-300 ${isFullscreen ? "h-full border-0 shadow-none" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <MousePointer2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight text-primary uppercase">Interactive Hierarchy Flow</CardTitle>
              <CardDescription className="text-[10px]">Hover over nodes to highlight allocation paths</CardDescription>
            </div>
            <TooltipProvider>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-[10px]">
                  <p>Hover over a person or department to see their specific funding stream. Click the expand icon to view full screen.</p>
                </TooltipContent>
              </ShadcnTooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
               {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
             </Button>
          </div>
        </CardHeader>
        
        <CardContent className={`${isFullscreen ? "h-[calc(100vh-100px)]" : "h-[600px]"} pt-4 flex flex-col transition-all duration-500`}>
          {/* Stage Headers */}
          <div className="flex justify-between items-center gap-4 mb-6 px-4">
            <StageHeader label="Company" icon={Building2} color={colors.company} />
            <StageHeader label="Division" icon={Layers} color={colors.division} />
            <StageHeader label="Supplier" icon={ShoppingBag} color={colors.supplier} />
            <StageHeader label="Supervisor" icon={Users} color={colors.supervisor} />
            <StageHeader label="Salesman" icon={UserCircle} color={colors.salesman} />
          </div>

          <div className="flex-1 min-h-0">
            {data.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="text-slate-400 text-sm font-medium">
                    {isLoading ? "Loading hierarchy data..." : "No allocation data available"}
                  </div>
                  {!isLoading && (
                    <p className="text-slate-500 text-xs">
                      Target allocations will appear here once configured
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  key={`sankey-${data.nodes.length}-${data.links.length}`}
                  data={data}
                  node={<DemoNode />}
                  link={<DemoLink />}
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                  nodePadding={isFullscreen ? 60 : 40}
                >
                </Sankey>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Render Custom Tooltip */}
      {renderCustomTooltip()}
    </div>
  );
}
