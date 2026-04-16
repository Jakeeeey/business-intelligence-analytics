"use client";

import type { TacticalSkuFilters } from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TacticalSkuFiltersProps = {
  value: TacticalSkuFilters;
  onChange: (next: TacticalSkuFilters) => void;
  onGenerate: () => void;
  loading: boolean;
};

export function TacticalSkuFiltersBar({
  value,
  onChange,
  onGenerate,
  loading,
}: TacticalSkuFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <Input
            type="month"
            value={value.month}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
            aria-label="Report month"
          />

          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Search product, brand, category, or salesman"
            aria-label="Search"
          />

          <Button onClick={onGenerate} disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}