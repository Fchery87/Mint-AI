import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Button Component
 * 
 * Premium button system with multiple variants and sizes.
 * Features smooth transitions, focus states, and accessibility.
 */

const buttonVariants = cva(
  // Base styles - always applied
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // Primary - Electric mint with glow effect
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-md hover:shadow-glow",
        
        // Secondary - Muted mint, subtle
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        
        // Ghost - Transparent with hover state
        ghost:
          "hover:bg-surface-elevated text-foreground hover:text-primary active:bg-surface-elevated/80",
        
        // Outline - Bordered, transparent background
        outline:
          "border border-border bg-transparent hover:bg-surface-elevated hover:border-primary/50 active:bg-surface-elevated/80",
        
        // Destructive - Red for dangerous actions
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-md",
        
        // Link - Text-only, minimal
        link:
          "text-primary underline-offset-4 hover:underline decoration-primary/50 hover:decoration-primary",
        
        // Gradient - Mint gradient for CTAs
        gradient:
          "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 active:scale-[0.98] shadow-md hover:shadow-glow",
      },
      size: {
        // Extra small - compact buttons
        xs: "h-7 px-2.5 text-xs",
        
        // Small - secondary actions
        sm: "h-8 px-3 text-xs",
        
        // Default - standard button size
        default: "h-9 px-4 py-2",
        
        // Large - primary actions, more prominence
        lg: "h-10 px-6 text-base",
        
        // Extra large - hero CTAs
        xl: "h-12 px-8 text-lg",
        
        // Icon - Square button for icons
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
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
