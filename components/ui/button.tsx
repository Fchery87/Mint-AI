import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Component
 * 
 * Clean, modern button system with multiple variants and sizes.
 * Features smooth transitions, focus states, and accessibility.
 */

const buttonVariants = cva(
  // Base styles - always applied
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Solid accent color
        default:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow",
        
        // Secondary - Muted background
        secondary:
          "bg-muted text-foreground hover:bg-muted/80",
        
        // Ghost - Transparent with hover state
        ghost:
          "hover:bg-muted text-foreground",
        
        // Outline - Bordered, transparent background
        outline:
          "border border-input bg-background hover:bg-muted hover:border-accent/50",
        
        // Destructive - Red for dangerous actions
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        
        // Link - Text-only, minimal
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        // Extra small - compact buttons
        xs: "h-7 px-2 text-xs gap-1.5",
        
        // Small - secondary actions
        sm: "h-8 px-3 text-xs",
        
        // Default - standard button size
        default: "h-9 px-4 py-2",
        
        // Large - primary actions, more prominence
        lg: "h-10 px-6",
        
        // Extra large - hero CTAs
        xl: "h-12 px-8 text-base",
        
        // Icon - Square button for icons
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
