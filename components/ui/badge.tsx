import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Badge Component
 * 
 * Status indicators, labels, and tags with multiple variants.
 */

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
      },
      dot: {
        true: "gap-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  // Optional dot indicator
  showDot?: boolean;
  // Dot color (overrides variant)
  dotClassName?: string;
}

function Badge({ className, variant, showDot = false, dotClassName, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, dot: showDot }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-success-foreground",
            variant === "warning" && "bg-warning-foreground",
            variant === "destructive" && "bg-destructive-foreground",
            variant === "secondary" && "bg-secondary-foreground",
            !variant || variant === "default" && "bg-primary-foreground",
            dotClassName
          )}
        />
      )}
      {children}
    </div>
  );
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
