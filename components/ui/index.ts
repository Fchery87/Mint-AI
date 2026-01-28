/**
 * 🌃 Cyberpunk UI Components - "High-Tech, Low-Life"
 * 
 * Aggressively futuristic components for the digital dystopia.
 * All components follow the Cyberpunk/Glitch design system.
 * 
 * Visual Signatures:
 * - Chromatic aberration (RGB splitting)
 * - Scanline overlay
 * - Glitch effects
 * - Neon glow (multi-layer shadows)
 * - Chamfered corners (clip-path)
 * - Circuit/grid patterns
 * - Terminal aesthetic
 */

// Core Components
export { CyberButton, cyberButtonVariants } from "./cyber-button";
export type { CyberButtonProps } from "./cyber-button";

// Layout Components
export {
  CyberCard,
  CyberCardHeader,
  CyberCardFooter,
  CyberCardTitle,
  CyberCardDescription,
  CyberCardContent,
  cyberCardVariants,
} from "./cyber-card";
export type { CyberCardProps } from "./cyber-card";

// Indicators
export { CyberBadge, cyberBadgeVariants } from "./cyber-badge";
export type { CyberBadgeProps } from "./cyber-badge";

// Text Effects
export { GlitchText, RGBShiftText, NeonText } from "./glitch-text";
export type { GlitchTextProps, RGBShiftTextProps, NeonTextProps } from "./glitch-text";

// Re-export existing components for convenience
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

export { Avatar, avatarVariants } from "./avatar";
export type { AvatarProps } from "./avatar";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

export { Separator } from "./separator";
export { Skeleton } from "./skeleton";
export { Label } from "./label";
export type { LabelProps } from "./label";
