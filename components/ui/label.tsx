import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Label Component
 * 
 * Form labels with consistent styling and spacing.
 */

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Mark field as required
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required = false, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    );
  }
);
Label.displayName = "Label";

export { Label };
