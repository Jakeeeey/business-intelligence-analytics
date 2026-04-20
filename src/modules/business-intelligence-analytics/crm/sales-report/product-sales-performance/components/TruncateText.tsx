"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TruncateTextProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export function TruncateText({
  children,
  title,
  className,
}: TruncateTextProps) {
  const resolvedTitle =
    title ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);

  return (
    <span
      className={cn("block min-w-0 truncate", className)}
      title={resolvedTitle}
    >
      {children}
    </span>
  );
}
