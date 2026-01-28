import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 🌃 Cyberpunk Button Component
 * 
 * Aggressively futuristic buttons with:
 * - Chamfered corners (clip-path)
 * - Neon glow effects
 * - Glitch animations
 * - Terminal aesthetic
 * - Chromatic aberration on hover
 */

const cyberButtonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.2em] transition-all duration-base disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-neon",
  {
    variants: {
      variant: {
        // Default - Transparent with neon border
        default:
          "bg-transparent border-2 border-primary text-primary cyber-chamfer-sm hover:bg-primary hover:text-background hover:shadow-neon",
        
        // Glitch - Solid neon with chromatic aberration
        glitch:
          "bg-primary text-background border-2 border-primary cyber-chamfer-sm shadow-neon hover:shadow-neon-lg hover:scale-105 active:scale-95 relative overflow-hidden",
        
        // Secondary - Magenta neon
        secondary:
          "bg-transparent border-2 border-secondary text-secondary cyber-chamfer-sm hover:bg-secondary hover:text-background hover:shadow-neon-secondary",
        
        // Tertiary - Cyan neon
        tertiary:
          "bg-transparent border-2 border-tertiary text-tertiary cyber-chamfer-sm hover:bg-tertiary hover:text-background hover:shadow-neon-tertiary",
        
        // Outline - Subtle border
        outline:
          "bg-transparent border-2 border-border text-foreground cyber-chamfer-sm hover:border-primary hover:text-primary hover:shadow-neon-sm",
        
        // Ghost - No border, minimal
        ghost:
          "bg-transparent border-0 text-muted-foreground hover:text-primary hover:bg-primary/10",
        
        // Destructive - Red-pink neon
        destructive:
          "bg-transparent border-2 border-destructive text-destructive cyber-chamfer-sm hover:bg-destructive hover:text-background hover:shadow-neon",
      },
      size: {
        // Compact
        sm: "h-8 px-4 text-xs",
        // Default
        default: "h-10 px-6 text-sm",
        // Large
        lg: "h-12 px-8 text-base",
        // Icon only
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  asChild?: boolean;
  // Enable glitch animation effect
  enableGlitch?: boolean;
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, asChild = false, enableGlitch = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(
          cyberButtonVariants({ variant, size, className }),
          enableGlitch && "animate-glitch"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
CyberButton.displayName = "CyberButton";

export { CyberButton, cyberButtonVariants };
