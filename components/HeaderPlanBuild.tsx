"use client";

import { Terminal, ClipboardList, Hammer, Pause, Play, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { CyberBadge, GlitchText } from "@/components/ui";
import type { InteractionMode } from "@/types/plan-build";
import { BuildStatus, PlanStatus } from "@/types/plan-build";

interface HeaderProps {
  sessionCost: { cost: string; tokens: string } | null;
  mode: InteractionMode;
  planStatus: PlanStatus | null;
  buildStatus: BuildStatus | null;
  progress: number;
  statusLabel: string;
  isBuilding: boolean;
  isPaused: boolean;
  onPauseBuild: () => void;
  onResumeBuild: () => void;
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;
  isSearching?: boolean;
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-primary/20 bg-void-black/95 backdrop-blur supports-[backdrop-filter]:bg-void-black/60 cyber-grid opacity-90"
    >
      {/* Left Section - Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Logo />
          <GlitchText 
            className="font-display font-bold text-lg tracking-widest text-primary"
            enableGlitch={isBuilding}
          >
            MINT_AI
          </GlitchText>
        </div>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Session Cost Badge */}
        {sessionCost && (
          <CyberBadge variant="primary" shape="sharp" className="hidden sm:flex gap-1.5 border-primary/30">
            <Terminal size={10} className="text-primary" />
            <span className="font-mono text-xs">{sessionCost.tokens} · {sessionCost.cost}</span>
          </CyberBadge>
        )}

        {/* Mode Indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isPlanMode && (
              <motion.div
                key="plan-mode"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <CyberBadge 
                  variant="secondary" 
                  showDot={planStatus !== PlanStatus.IDLE}
                  shape="sharp"
                  className="gap-1.5"
                >
                  <ClipboardList size={12} className="text-secondary" />
                  <span className="text-xs uppercase tracking-widest">Plan</span>
                  {planStatus && planStatus !== PlanStatus.IDLE && (
                    <span className="text-secondary/80 max-w-24 truncate">
                      {statusLabel}
                    </span>
                  )}
                </CyberBadge>
              </motion.div>
            )}

            {isBuildMode && (
              <motion.div
                key="build-mode"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <CyberBadge 
                  variant="primary" 
                  showDot={isBuilding}
                  shape="sharp"
                  className="gap-1.5"
                >
                  <Hammer size={12} />
                  <span className="text-xs uppercase tracking-widest">Build</span>
                  
                  {/* Progress bar for build mode */}
                  {buildStatus === BuildStatus.EXECUTING && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-primary-foreground/20 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary-foreground"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-mono">{progress}%</span>
                    </div>
                  )}

                  {/* Pause/Resume button */}
                  {(isBuilding || isPaused) && (
                    <button
                      onClick={isPaused ? onResumeBuild : onPauseBuild}
                      className="p-0.5 hover:bg-primary-foreground/10 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-foreground"
                      title={isPaused ? "Resume build" : "Pause build"}
                    >
                      {isPaused ? (
                        <Play size={10} />
                      ) : (
                        <Pause size={10} />
                      )}
                    </button>
                  )}

                  {buildStatus && (
                    <span className="text-xs text-primary-foreground/80 max-w-24 truncate">
                      {statusLabel}
                    </span>
                  )}
                </CyberBadge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Web Search Toggle */}
        <button
          onClick={() => setWebSearch(!webSearch)}
          className={`
            hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium uppercase tracking-wider
            transition-all duration-150 hover:scale-105 active:scale-95
            ${webSearch 
              ? 'bg-primary text-primary-foreground cyber-chamfer-sm shadow-neon' 
              : 'bg-card text-muted-foreground hover:text-foreground border border-border cyber-chamfer-sm'
            }
          `}
        >
          <Search size={11} className={isSearching ? "animate-pulse" : ""} />
          <span>{isSearching ? "Searching..." : "Web"}</span>
        </button>

        {/* Output Format Badge */}
        <CyberBadge 
          variant="tertiary" 
          shape="sharp"
          className="hidden md:flex gap-1.5"
        >
          <div className="w-1 h-1 rounded-full bg-tertiary animate-pulse" />
          <span className="font-mono text-xs uppercase">{outputFormat}</span>
        </CyberBadge>

        {/* Theme Toggle */}
        <div className="w-px h-5 bg-border hidden sm:block" />
        <ModeToggle />
      </div>
    </motion.header>
  );
}
