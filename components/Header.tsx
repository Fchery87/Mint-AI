"use client";

import { Terminal, ClipboardList, Hammer, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";

interface HeaderProps {
  sessionCost: { cost: string; tokens: string } | null;
  // New Plan/Build mode props
  mode: "plan" | "build";
  setMode: (mode: "plan" | "build") => void;
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;
  outputFormat: string;
  // Optional status info
  statusLabel?: string;
  isSearching?: boolean;
}

export function Header({
  sessionCost,
  mode,
  setMode,
  webSearch,
  setWebSearch,
  outputFormat,
  statusLabel,
  isSearching = false,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex items-center gap-3">
        <Logo />
      </div>
      <div className="flex items-center gap-3">
        {sessionCost && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-mint-500/10 border border-mint-500/20 rounded-full text-xs font-medium text-mint-600 dark:text-mint-400">
            <Terminal size={12} />
            <span>{sessionCost.tokens} · {sessionCost.cost}</span>
          </div>
        )}

        {/* New Plan/Build mode toggle */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-muted/50 rounded-full">
          <button
            onClick={() => setMode("plan")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mode === "plan"
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Plan mode - Research and create a plan before building"
          >
            <ClipboardList size={12} />
            Plan
          </button>
          <button
            onClick={() => setMode("build")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              mode === "build"
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Build mode - Execute and write code"
          >
            <Hammer size={12} />
            Build
          </button>
        </div>

        {/* Status label if provided */}
        {statusLabel && (
          <div className="hidden xl:flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="max-w-40 truncate">{statusLabel}</span>
          </div>
        )}

        {/* Web Search Toggle */}
        <label className="hidden lg:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors">
          <input
            type="checkbox"
            checked={webSearch}
            onChange={(e) => setWebSearch(e.target.checked)}
            className="accent-primary w-3 h-3"
          />
          <Search size={12} className={isSearching ? "animate-pulse text-primary" : ""} />
          <span className={isSearching ? "text-primary" : ""}>
            {isSearching ? "Searching..." : "Web search"}
          </span>
        </label>

        {/* Output Format Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {outputFormat}
        </div>

        <ModeToggle />
      </div>
    </motion.header>
  );
}
