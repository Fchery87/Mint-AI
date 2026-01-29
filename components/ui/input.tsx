import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Input Component
 * 
 * Premium input system with smooth focus states and clean aesthetics.
 * Supports text inputs with optional icons and labels.
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Optional icon element to display inside the input
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  // Container className for additional styling
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("relative", containerClassName)}>
        {/* Start Icon */}
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {startIcon}
          </div>
        )}
        
        {/* Input Field */}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm",
            // Placeholder
            "placeholder:text-muted-foreground",
            // Focus state
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Transitions
            "transition-all duration-fast",
            // Icon padding
            startIcon && "pl-9",
            endIcon && "pr-9",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* End Icon */}
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
