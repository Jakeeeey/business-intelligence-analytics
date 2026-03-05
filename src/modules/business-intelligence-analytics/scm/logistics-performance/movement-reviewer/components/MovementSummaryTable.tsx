import React from "react";
import { SummaryReport } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface MovementSummaryTableProps {
    report: SummaryReport;
}

export const MovementSummaryTable: React.FC<MovementSummaryTableProps> = ({ report }) => {
    return (
        <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="bg-primary/5 border-b py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Total Movements Summary</CardTitle>
                        <CardDescription>Aggregate volume of the highest unit (Boxes/Cases) across all products.</CardDescription>
                    </div>
                </div>
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
                                    // FIX: Wrapped text styling applied here as well
                                    className="text-right font-semibold text-muted-foreground border-r bg-muted/10 last:border-r-0 min-w-[120px] max-w-[180px] whitespace-normal leading-snug align-bottom px-4 py-4 break-words"
                                >
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(report.movements).sort().map((movementType) => (
                            <TableRow key={movementType} className="transition-colors hover:bg-muted/30">
                                <TableCell className="pl-6 border-r font-semibold text-foreground">
                                    {movementType}
                                </TableCell>
                                {report.columns.map((col) => {
                                    const val = report.movements[movementType][col] || 0;
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
    );
};