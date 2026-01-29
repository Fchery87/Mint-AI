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
    sm: { icon: "w-5 h-5", text: "text-sm" },
    md: { icon: "w-6 h-6", text: "text-base" },
    lg: { icon: "w-8 h-8", text: "text-lg" },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Custom Logo Icon */}
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600",
          sizeClasses[size].icon,
          iconClassName
        )}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-full h-full p-1.5"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Code brackets with sparkle */}
          <path 
            d="M8 9l-3 3 3 3M16 9l3 3-3 3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-white"
          />
          <path 
            d="M12 6v12" 
            strokeLinecap="round"
            className="text-white/60"
          />
        </svg>
      </div>
      
      {!hideText && (
        <div className={cn("flex flex-col", textClassName)}>
          <span className={cn("font-semibold tracking-tight leading-none text-foreground", sizeClasses[size].text)}>
            Mint
            <span className="text-accent">AI</span>
          </span>
        </div>
      )}
    </div>
  )
}
