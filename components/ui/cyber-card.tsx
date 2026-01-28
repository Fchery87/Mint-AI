import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 🌃 Cyberpunk Card Component
 * 
 * Futuristic cards with:
 * - Chamfered corners
 * - Terminal aesthetic (traffic light header)
 * - Holographic variant (glass + glow)
 * - Neon border glow on hover
 * - Circuit pattern backgrounds
 */

const cyberCardVariants = cva(
  "relative bg-card text-card-foreground transition-all duration-slow",
  {
    variants: {
      variant: {
        // Default - Basic card with chamfered corners
        default:
          "border border-border hover:border-primary hover:shadow-neon hover:-translate-y-0.5",
        
        // Terminal - Decorative header with traffic lights
        terminal:
          "border border-border cyber-chamfer-md overflow-hidden",
        
        // Holographic - Glass effect with glow
        holographic:
          "bg-muted/30 backdrop-blur-md border border-primary/30 shadow-neon cyber-chamfer-md hover:shadow-neon-lg",
        
        // Glitch - Unstable, corrupted appearance
        glitch:
          "border border-primary/50 cyber-chamfer-md shadow-neon-sm hover:shadow-neon hover:animate-glitch",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CyberCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cyberCardVariants> {
  // Enable hover effect
  hoverEffect?: boolean;
  // Terminal variant title
  terminalTitle?: string;
}

const CyberCard = React.forwardRef<HTMLDivElement, CyberCardProps>(
  ({ className, variant, hoverEffect = true, terminalTitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cyberCardVariants({ variant }),
          hoverEffect && variant === "default" && "hover:border-primary hover:shadow-neon hover:-translate-y-0.5",
          variant === "default" && "cyber-chamfer-md",
          className
        )}
        {...props}
      >
        {/* Terminal Header */}
        {variant === "terminal" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            {terminalTitle && (
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                {terminalTitle}
              </span>
            )}
          </div>
        )}
        
        {/* Holographic Corner Accents */}
        {variant === "holographic" && (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50" />
          </>
        )}
        
        {/* Circuit Pattern Background */}
        {(variant === "default" || variant === "glitch") && (
          <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
        )}
        
        <div className={cn("relative z-10", variant === "terminal" && "p-4")}>
          {children}
        </div>
      </div>
    );
  }
);
CyberCard.displayName = "CyberCard";

// Card sub-components
const CyberCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CyberCardHeader.displayName = "CyberCardHeader";

const CyberCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display font-bold uppercase tracking-widest leading-none", className)}
    {...props}
  />
));
CyberCardTitle.displayName = "CyberCardTitle";

const CyberCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-mono", className)}
    {...props}
  />
));
CyberCardDescription.displayName = "CyberCardDescription";

const CyberCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CyberCardContent.displayName = "CyberCardContent";

const CyberCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CyberCardFooter.displayName = "CyberCardFooter";

export {
  CyberCard,
  CyberCardHeader,
  CyberCardFooter,
  CyberCardTitle,
  CyberCardDescription,
  CyberCardContent,
  cyberCardVariants,
};
