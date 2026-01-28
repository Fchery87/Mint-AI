import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Obsidian Mint Avatar Component
 * 
 * User avatars with fallback initials and image support.
 */

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-5 w-5 text-[10px]",
        sm: "h-6 w-6 text-[10px]",
        md: "h-8 w-8 text-xs",
        lg: "h-10 w-10 text-sm",
        xl: "h-12 w-12 text-base",
        "2xl": "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  // Image source
  src?: string;
  // Fallback text (initials)
  alt?: string;
  // Custom fallback component
  fallback?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, children, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    // Get initials from alt text or fallback
    const getInitials = (text?: string) => {
      if (!text) return "?";
      const words = text.split(" ").filter(Boolean);
      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
      }
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    };

    // Show fallback if no image or image failed to load
    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {showFallback ? (
          <div className="flex h-full w-full items-center justify-center bg-surface-elevated text-foreground font-medium">
            {fallback || getInitials(alt)}
          </div>
        ) : (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {children}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
