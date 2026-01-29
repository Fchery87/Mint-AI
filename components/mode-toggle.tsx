"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // Avoid hydration mismatch
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme
  
  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-md",
        "bg-muted text-muted-foreground hover:text-foreground",
        "transition-colors duration-fast focus-ring"
      )}
      title={`Theme: ${theme} (click to cycle)`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {currentTheme === "light" && (
          <motion.div
            key="light"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={16} className="text-amber-500" />
          </motion.div>
        )}
        {currentTheme === "dark" && (
          <motion.div
            key="dark"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={16} className="text-indigo-400" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle indicator dot for system mode */}
      {theme === "system" && (
        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
      )}
    </button>
  )
}
