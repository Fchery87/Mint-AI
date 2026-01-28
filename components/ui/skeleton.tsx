import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Skeleton Component
 * 
 * Loading placeholders with shimmer effect.
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-elevated shimmer", className)}
      {...props}
    />
  );
}

export { Skeleton };
