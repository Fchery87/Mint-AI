"use client";

import { Terminal, ClipboardList, Hammer, Pause, Play, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";
import type { InteractionMode } from "@/types/plan-build";
import { BuildStatus, PlanStatus } from "@/types/plan-build";

interface HeaderProps {
  sessionCost: { cost: string; tokens: string } | null;
  // New Plan/Build mode props
  mode: InteractionMode;
  planStatus: PlanStatus | null;
  buildStatus: BuildStatus | null;
  progress: number;
  statusLabel: string;
  isBuilding: boolean;
  isPaused: boolean;
  onPauseBuild: () => void;
  onResumeBuild: () => void;
  // Web search
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;
  isSearching?: boolean;
  // Output format
  outputFormat: string;
}

export function Header({
  sessionCost,
  mode,
  planStatus,
  buildStatus,
  progress,
  statusLabel,
  isBuilding,
  isPaused,
  onPauseBuild,
  onResumeBuild,
  webSearch,
  setWebSearch,
  isSearching = false,
  outputFormat,
}: HeaderProps) {
  const isPlanMode = mode === "plan";
  const isBuildMode = mode === "build";

  // Determine status color
  const getStatusColor = () => {
    if (isBuildMode) {
      if (buildStatus === BuildStatus.COMPLETED) return "bg-green-500";
      if (buildStatus === BuildStatus.FAILED) return "bg-red-500";
      if (buildStatus === BuildStatus.PAUSED) return "bg-yellow-500";
      if (buildStatus === BuildStatus.EXECUTING) return "bg-blue-500";
    }
    if (isPlanMode) {
      if (planStatus === PlanStatus.READY) return "bg-green-500";
      if (planStatus === PlanStatus.APPROVED) return "bg-emerald-500";
      if (planStatus === PlanStatus.QUESTIONING) return "bg-amber-500";
    }
    return "bg-purple-500";
  };

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
        {/* Session Cost */}
        {sessionCost && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-mint-500/10 border border-mint-500/20 rounded-full text-xs font-medium text-mint-600 dark:text-mint-400">
            <Terminal size={12} />
            <span>{sessionCost.tokens} · {sessionCost.cost}</span>
          </div>
        )}

        {/* Mode Indicator - New Plan/Build */}
        <div className="hidden lg:flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isPlanMode && (
              <motion.div
                key="plan-mode"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full"
              >
                <ClipboardList size={14} className="text-purple-500" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Plan Mode
                </span>
                {planStatus && planStatus !== PlanStatus.IDLE && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} animate-pulse`} />
                    <span className="text-xs text-muted-foreground max-w-32 truncate">
                      {statusLabel}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {isBuildMode && (
              <motion.div
                key="build-mode"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full"
              >
                <Hammer size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Build Mode
                </span>
                
                {/* Progress bar for build mode */}
                {buildStatus === BuildStatus.EXECUTING && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                )}

                {/* Pause/Resume button */}
                {(isBuilding || isPaused) && (
                  <button
                    onClick={isPaused ? onResumeBuild : onPauseBuild}
                    className="p-1 rounded-full hover:bg-blue-500/20 transition-colors"
                    title={isPaused ? "Resume build" : "Pause build"}
                  >
                    {isPaused ? (
                      <Play size={12} className="text-blue-500" />
                    ) : (
                      <Pause size={12} className="text-blue-500" />
                    )}
                  </button>
                )}

                {/* Status label */}
                {buildStatus && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} ${isBuilding ? 'animate-pulse' : ''}`} />
                    <span className="text-xs text-muted-foreground max-w-32 truncate">
                      {statusLabel}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Web Search Toggle - Enhanced with activity indicator */}
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
