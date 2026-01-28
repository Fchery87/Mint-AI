import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 🌃 Glitch Text Component
 * 
 * Chromatic aberration effect with RGB splitting.
 * Creates that "corrupted signal" look on text.
 * 
 * Features:
 * - Random glitch animation
 * - RGB color splitting (red/cyan offsets)
 * - Blinking cursor option
 * - Multiple severity levels
 */

export interface GlitchTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  // Enable random glitch animation
  enableGlitch?: boolean;
  // Show blinking cursor at end
  showCursor?: boolean;
  // Intensity of the glitch effect
  intensity?: "low" | "medium" | "high";
  // Color variant
  color?: "primary" | "secondary" | "tertiary";
}

const GlitchText = React.forwardRef<HTMLHeadingElement, GlitchTextProps>(
  (
    {
      className,
      children,
      enableGlitch = true,
      showCursor = false,
      intensity = "medium",
      color = "primary",
      ...props
    },
    ref
  ) => {
    const [text] = React.useState(typeof children === "string" ? children : "");
    
    // Color variants for chromatic aberration
    const colorOffsets = {
      primary: { left: "#ff00ff", right: "#00d4ff" }, // Magenta/Cyan
      secondary: { left: "#00ff88", right: "#ff00ff" }, // Green/Magenta
      tertiary: { left: "#ff00ff", right: "#ffff00" }, // Magenta/Yellow
    };

    const offsets = colorOffsets[color];

    // Intensity variants
    const intensityStyles = {
      low: {
        clipPath: "polygon(0 5%, 100% 5%, 100% 10%, 0 10%)",
        offset: "1px",
      },
      medium: {
        clipPath: "polygon(0 15%, 100% 15%, 100% 30%, 0 30%)",
        offset: "2px",
      },
      high: {
        clipPath: "polygon(0 2%, 100% 2%, 100% 5%, 0 5%)",
        offset: "3px",
      },
    };

    const style = intensityStyles[intensity];

    return (
      <span
        ref={ref}
        className={cn(
          "relative inline-block font-display font-black uppercase tracking-widest",
          enableGlitch && "cyber-glitch",
          className
        )}
        data-text={text}
        {...props}
      >
        {children}
        
        {/* Blinking Cursor */}
        {showCursor && (
          <span className="inline-block w-0.5 h-current bg-primary ml-1 animate-blink align-middle" />
        )}
      </span>
    );
  }
);
GlitchText.displayName = "GlitchText";

/**
 * 🌃 RGB Shift Text Component
 * 
 * Simpler chromatic aberration without animation.
 * Good for headlines that need to look "interference-affected" but stable.
 */
export interface RGBShiftTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  // Color variant
  color?: "primary" | "secondary" | "tertiary";
}

const RGBShiftText = React.forwardRef<HTMLHeadingElement, RGBShiftTextProps>(
  ({ className, children, color = "primary", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-block font-display font-black uppercase tracking-widest",
          color === "primary" && "rgb-shift-primary",
          color === "secondary" && "rgb-shift-secondary",
          color === "tertiary" && "rgb-shift-tertiary",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
RGBShiftText.displayName = "RGBShiftText";

/**
 * 🌃 Neon Text Component
 * 
 * Glowing text effect with multi-layer shadows.
 * Creates the "neon sign" look.
 */
export interface NeonTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  // Glow intensity
  intensity?: "sm" | "md" | "lg";
  // Color variant
  color?: "primary" | "secondary" | "tertiary";
  // Enable flicker animation
  flicker?: boolean;
}

const NeonText = React.forwardRef<HTMLHeadingElement, NeonTextProps>(
  ({ className, children, intensity = "md", color = "primary", flicker = false, ...props }, ref) => {
    const glowStyles = {
      primary: {
        sm: "0 0 5px rgba(0, 255, 136, 0.8), 0 0 10px rgba(0, 255, 136, 0.4)",
        md: "0 0 5px rgba(0, 255, 136, 0.8), 0 0 10px rgba(0, 255, 136, 0.4), 0 0 20px rgba(0, 255, 136, 0.2)",
        lg: "0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4), 0 0 80px rgba(0, 255, 136, 0.2)",
      },
      secondary: {
        sm: "0 0 5px rgba(255, 0, 255, 0.8), 0 0 10px rgba(255, 0, 255, 0.4)",
        md: "0 0 5px rgba(255, 0, 255, 0.8), 0 0 10px rgba(255, 0, 255, 0.4), 0 0 20px rgba(255, 0, 255, 0.2)",
        lg: "0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4)",
      },
      tertiary: {
        sm: "0 0 5px rgba(0, 212, 255, 0.8), 0 0 10px rgba(0, 212, 255, 0.4)",
        md: "0 0 5px rgba(0, 212, 255, 0.8), 0 0 10px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)",
        lg: "0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.4)",
      },
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-block font-display font-black uppercase tracking-widest text-neon",
          color === "secondary" && "text-neon-secondary",
          color === "tertiary" && "text-neon-tertiary",
          flicker && "animate-flicker",
          className
        )}
        style={{
          textShadow: glowStyles[color][intensity],
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);
NeonText.displayName = "NeonText";

export { GlitchText, RGBShiftText, NeonText };
