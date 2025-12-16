"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // Avoid hydration mismatch
  }

  const modes = [
    { name: "light", icon: Sun },
    { name: "dark", icon: Moon },
    { name: "system", icon: Monitor },
  ]

  return (
    <div className="flex items-center p-1 bg-muted/50 border border-border/40 rounded-full">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = theme === mode.name
        
        return (
          <button
            key={mode.name}
            onClick={() => setTheme(mode.name)}
            className={cn(
              "relative w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground transition-all duration-200",
              isActive && "text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active"
                className="absolute inset-0 bg-background rounded-full shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={14} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
