import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Textarea Component
 * 
 * Multi-line text input with auto-resize support.
 */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Enable auto-resize as content grows
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const mergedRef = (ref || textareaRef) as React.RefObject<HTMLTextAreaElement>;

    // Auto-resize handler
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <textarea
        ref={mergedRef}
        className={cn(
          // Base styles
          "flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Transitions
          "transition-all duration-fast",
          // Scrollbar styling
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30",
          // Resize behavior
          !autoResize && "resize-y",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
