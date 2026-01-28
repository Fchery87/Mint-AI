import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 🌃 Cyberpunk Badge Component
 * 
 * Status indicators with:
 * - Neon glow effects
 * - Chamfered corners
 * - Blinking animations
 * - Terminal aesthetic
 */

const cyberBadgeVariants = cva(
  "inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all duration-fast",
  {
    variants: {
      variant: {
        // Primary - Electric green neon
        primary: "bg-primary/10 border border-primary/30 text-primary shadow-neon-sm hover:shadow-neon",
        
        // Secondary - Magenta neon
        secondary: "bg-secondary/10 border border-secondary/30 text-secondary shadow-neon-sm hover:shadow-neon-secondary",
        
        // Tertiary - Cyan neon
        tertiary: "bg-tertiary/10 border border-tertiary/30 text-tertiary shadow-neon-sm hover:shadow-neon-tertiary",
        
        // Destructive - Red-pink neon
        destructive: "bg-destructive/10 border border-destructive/30 text-destructive hover:shadow-neon",
        
        // Outline - Subtle border
        outline: "bg-transparent border border-border text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm",
        
        // Glitch - Unstable effect
        glitch: "bg-primary/10 border border-primary/50 text-primary shadow-neon-sm animate-glitch",
      },
      shape: {
        // Sharp corners
        sharp: "cyber-chamfer-sm",
        // Terminal cut corners
        terminal: "cyber-chamfer-md",
        // No special shape
        none: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      shape: "sharp",
    },
  }
);

export interface CyberBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cyberBadgeVariants> {
  // Show blinking dot indicator
  showDot?: boolean;
  // Dot color (overrides variant)
  dotColor?: "primary" | "secondary" | "tertiary" | "destructive";
}

const CyberBadge = React.forwardRef<HTMLDivElement, CyberBadgeProps>(
  ({ className, variant, shape, showDot = false, dotColor, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cyberBadgeVariants({ variant, shape }),
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-none animate-pulse",
              dotColor === "primary" && "bg-primary shadow-neon-sm",
              dotColor === "secondary" && "bg-secondary shadow-neon-sm",
              dotColor === "tertiary" && "bg-tertiary shadow-neon-sm",
              dotColor === "destructive" && "bg-destructive",
              !dotColor && variant === "primary" && "bg-primary shadow-neon-sm",
              !dotColor && variant === "secondary" && "bg-secondary shadow-neon-sm",
              !dotColor && variant === "tertiary" && "bg-tertiary shadow-neon-sm",
              !dotColor && variant === "destructive" && "bg-destructive",
              !dotColor && !variant && "bg-primary shadow-neon-sm"
            )}
          />
        )}
        {children}
      </div>
    );
  }
);
CyberBadge.displayName = "CyberBadge";

export { CyberBadge, cyberBadgeVariants };
