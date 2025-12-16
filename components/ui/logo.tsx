import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  hideText?: boolean
}

export function Logo({ className, iconClassName, textClassName, hideText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20", 
          iconClassName
        )}
      >
        <Zap size={18} fill="currentColor" className="relative z-10" />
        <div className="absolute inset-0 bg-white/20 blur-sm rounded-lg opacity-50" />
      </div>
      
      {!hideText && (
        <div className={cn("flex flex-col", textClassName)}>
          <span className="font-bold tracking-tight text-lg leading-none">Mint AI</span>
        </div>
      )}
    </div>
  )
}
