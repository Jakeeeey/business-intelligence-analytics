import React, { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, ChevronUp, ChevronDown, Loader2, Package, ShoppingCart, Tag, Box, Layers, DollarSign } from "lucide-react";
import { fetchCustomerProducts } from "../providers/fetchProvider";
import { ProductSalesDetail } from "../types";

interface CustomerProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerName: string;
    customerCode: string;
    salesmanId: number;
    supplierId: number;
    supplierName: string;
    startDate: string;
    endDate: string;
    viewType?: 'customer' | 'area';
}

export const CustomerProductsModal: React.FC<CustomerProductsModalProps> = ({
    isOpen,
    onClose,
    customerName,
    customerCode,
    salesmanId,
    supplierId,
    supplierName,
    startDate,
    endDate,
    viewType = 'customer',
}) => {
    const [products, setProducts] = useState<ProductSalesDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCustomerProducts(customerCode, salesmanId, supplierId, startDate, endDate, viewType);
            setProducts(data);
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
        }
    }, [customerCode, salesmanId, supplierId, startDate, endDate, viewType]);

    useEffect(() => {
        if (isOpen && customerName) {
            loadProducts();
        }
    }, [isOpen, customerName, viewType, loadProducts]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProducts = React.useMemo(() => {
        if (!sortConfig) return products;

        return [...products].sort((a, b) => {
            const aVal = a[sortConfig.key as keyof ProductSalesDetail];
            const bVal = b[sortConfig.key as keyof ProductSalesDetail];

            if (aVal === undefined || bVal === undefined) return 0;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [products, sortConfig]);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-2.5 w-2.5 opacity-30" />;
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> 
            : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
    };

    const formatPHP = (val: number) => 
        new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(val);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[95vw] w-full h-[94vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/60">
                                <Package className="h-3 w-3" />
                                {viewType === 'area' ? 'Area Breakdown' : 'Product Breakdown'}
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase italic">
                                {customerName}
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                SUPPLIER: <span className="text-emerald-500 font-bold">{supplierName}</span> | PERIOD: {startDate} TO {endDate}
                            </p>
                        </div>
                        <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 text-right">
                            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Total Purchases</p>
                            <p className="text-xl font-mono font-black text-primary italic">
                                {formatPHP(products.reduce((acc, p) => acc + (p.netAmount || 0), 0))}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 border border-border/40 rounded-xl bg-card/10 overflow-hidden">
                        <div className="min-w-full inline-block align-middle">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent border-b border-border/40">
                                        <TableHead 
                                            className="text-center text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('brandName')}
                                        >
                                            <div className="flex items-center justify-center gap-1.5 ml-2">
                                                <Tag className="h-3 w-3" /> Brand {getSortIcon('brandName')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-center text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('categoryName')}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Layers className="h-3 w-3" /> Category {getSortIcon('categoryName')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-[9px] uppercase font-black tracking-wider text-muted-foreground py-4 cursor-pointer hover:text-primary transition-colors pl-6"
                                            onClick={() => handleSort('productName')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <ShoppingCart className="h-3 w-3" /> Product Name {getSortIcon('productName')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('totalQuantity')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Box className="h-3 w-3" /> Qty {getSortIcon('totalQuantity')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('quantityInBox')}
                                        >
                                            Qty In Box {getSortIcon('quantityInBox')}
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('quantityInPiece')}
                                        >
                                            Qty In Pc {getSortIcon('quantityInPiece')}
                                        </TableHead>
                                        <TableHead 
                                            className="text-right text-[9px] uppercase font-black tracking-wider text-muted-foreground mr-4 cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort('netAmount')}
                                        >
                                            <div className="flex items-center justify-end gap-1.5 pr-4">
                                                <DollarSign className="h-3 w-3" /> Net Amount {getSortIcon('netAmount')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Transactional Details...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedProducts.length > 0 ? (
                                        sortedProducts.map((product, idx) => (
                                            <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-border/40 group">
                                                <TableCell className="text-center">
                                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border border-primary/20">
                                                        {product.brandName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                        {product.categoryName}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold text-[11px] text-foreground/80 group-hover:text-primary py-3 uppercase tracking-tight pl-6">
                                                    {product.productName}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-[11px] font-black text-primary/80">
                                                    {product.totalQuantity} <span className="text-[9px] text-muted-foreground font-medium">{product.unitName}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-[11px] text-muted-foreground font-bold">{product.quantityInBox}</TableCell>
                                                <TableCell className="text-right font-mono text-[11px] text-muted-foreground font-bold">{product.quantityInPiece}</TableCell>
                                                <TableCell className="text-right font-mono text-[11px] font-black text-emerald-500 pr-6">
                                                    {formatPHP(product.netAmount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-20 py-10 grayscale">
                                                    <div className="relative">
                                                         <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                                                         <Tag className="h-8 w-8 absolute -bottom-2 -right-2 text-primary" />
                                                    </div>
                                                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Purchase Record Found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
