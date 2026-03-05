import React from "react";
import { PivotReport } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, FileSpreadsheet } from "lucide-react";

interface MovementPivotTableProps {
    report: PivotReport;
}

export const MovementPivotTable: React.FC<MovementPivotTableProps> = ({ report }) => {
    if (!report || report.families.length === 0) {
        return (
            <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No data found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        There are no product movements matching the selected supplier and date criteria.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {report.families.map((family) => (
                <Card key={family.familyId} className="overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="bg-muted/30 border-b py-4 px-6 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                                <Layers className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg font-bold">
                                {family.familyName}
                            </CardTitle>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
                            Unit: {family.unit}
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[280px] font-semibold text-muted-foreground border-r bg-muted/10 pl-6 align-bottom py-4">
                                        Movement Type
                                    </TableHead>
                                    {report.columns.map((col) => (
                                        <TableHead
                                            key={col}
                                            // FIX: Added whitespace-normal, max-w-[200px], align-bottom, and leading-snug
                                            className="text-right font-semibold text-muted-foreground border-r bg-muted/10 last:border-r-0 min-w-[120px] max-w-[180px] whitespace-normal leading-snug align-bottom px-4 py-4 break-words"
                                        >
                                            {col}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(family.movements).sort().map((movementType) => (
                                    <TableRow key={`${family.familyId}-${movementType}`} className="transition-colors hover:bg-muted/30">
                                        <TableCell className="pl-6 border-r font-medium text-foreground">
                                            {movementType}
                                        </TableCell>
                                        {report.columns.map((col) => {
                                            const val = family.movements[movementType][col] || 0;
                                            return (
                                                <TableCell
                                                    key={col}
                                                    className={`text-right border-r last:border-r-0 px-4 font-mono ${val !== 0 ? 'text-foreground font-medium' : 'text-muted-foreground/40'}`}
                                                >
                                                    {val !== 0
                                                        ? Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val)
                                                        : '-'}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};