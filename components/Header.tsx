"use client";

import { Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";

interface HeaderProps {
  sessionCost: { cost: string; tokens: string } | null;
  agentMode: "agent" | "ask";
  setAgentMode: (mode: "agent" | "ask") => void;
  webSearch: boolean;
  setWebSearch: (value: boolean) => void;
  outputFormat: string;
}

export function Header({
  sessionCost,
  agentMode,
  setAgentMode,
  webSearch,
  setWebSearch,
  outputFormat,
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
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-full text-xs font-medium">
          <button
            onClick={() => setAgentMode("ask")}
            className={`px-3 py-1 rounded-full transition-colors ${
              agentMode === "ask"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Ask mode (no workspace changes)"
          >
            Ask
          </button>
          <button
            onClick={() => setAgentMode("agent")}
            className={`px-3 py-1 rounded-full transition-colors ${
              agentMode === "agent"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Agent mode (updates workspace)"
          >
            Agent
          </button>
        </div>
        <label className="hidden lg:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={webSearch}
            onChange={(e) => setWebSearch(e.target.checked)}
            className="accent-primary"
          />
          Web search
        </label>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {outputFormat}
        </div>
        <ModeToggle />
      </div>
    </motion.header>
  );
}
