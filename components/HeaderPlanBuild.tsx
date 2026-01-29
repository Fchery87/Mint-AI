"use client";

import { Search, Command, Sparkles, Globe, Folder, Terminal as TerminalIcon, Layout, Settings, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  sessionCost: { cost: string; tokens: string } | null;
  mode: "plan" | "build";
  planStatus: string | null;
  buildStatus: string | null;
  progress: number;
  statusLabel: string;
  isBuilding: boolean;
  isPaused: boolean;
  onPauseBuild: () => void;
  onResumeBuild: () => void;
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;
  outputFormat: string;
}

export function Header({
  sessionCost,
  mode,
  isBuilding,
  progress,
  statusLabel,
  webSearch,
  setWebSearch,
  outputFormat,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-12 px-4 flex items-center justify-between border-b border-border bg-card"
    >
      {/* Left - Logo */}
      <div className="flex items-center gap-4">
        <Logo size="sm" />
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border/50 hover:border-border transition-colors cursor-pointer">
          <Search size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ask AI & Search</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 ml-2">
            <Command size={12} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Center - Status */}
      <div className="hidden lg:flex items-center gap-4">
        {isBuilding && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        )}
        {statusLabel && !isBuilding && (
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Deploy Button */}
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors">
          <Play size={14} fill="currentColor" />
          Deploy
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Web Toggle */}
        <button
          onClick={() => setWebSearch(!webSearch)}
          className={cn(
            "p-2 rounded-md transition-colors",
            webSearch ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground"
          )}
          title="Toggle Web Search"
        >
          <Globe size={16} />
        </button>

        {/* Layout Toggle */}
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors">
          <Layout size={16} />
        </button>

        {/* Settings */}
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </motion.header>
  );
}
