import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadTimeVarianceSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 h-full">
      {/* Title and Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="mt-2 h-4 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="h-[350px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
