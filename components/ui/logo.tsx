import { cn } from "@/lib/utils"

export interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  hideText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ 
  className, 
  iconClassName, 
  textClassName, 
  hideText = false,
  size = "md"
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: "w-6 h-6", text: "text-sm", gap: "gap-1.5" },
    md: { icon: "w-8 h-8", text: "text-base", gap: "gap-2" },
    lg: { icon: "w-10 h-10", text: "text-lg", gap: "gap-2.5" },
  }

  return (
    <div className={cn("flex items-center", sizeClasses[size].gap, className)}>
      {/* Mint Leaf Logo Mark */}
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20",
          sizeClasses[size].icon,
          iconClassName
        )}
      >
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          className="w-[70%] h-[70%]"
        >
          {/* Stylized mint leaf / spark hybrid */}
          <path 
            d="M16 4L20 12L28 16L20 20L16 28L12 20L4 16L12 12L16 4Z" 
            fill="white"
            fillOpacity="0.95"
          />
          {/* Inner diamond core */}
          <path 
            d="M16 10L18 14L22 16L18 18L16 22L14 18L10 16L14 14L16 10Z" 
            fill="currentColor"
            className="text-emerald-600"
          />
        </svg>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10" />
      </div>
      
      {!hideText && (
        <div className={cn("flex items-baseline", textClassName)}>
          <span 
            className={cn(
              "font-bold tracking-tight leading-none text-foreground",
              sizeClasses[size].text
            )}
            style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
          >
            Mint
          </span>
          <span 
            className={cn(
              "font-bold tracking-tight leading-none bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent",
              sizeClasses[size].text
            )}
            style={{ fontFamily: "'Satoshi', 'DM Sans', sans-serif" }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  )
}
