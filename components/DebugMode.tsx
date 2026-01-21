"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Search,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Code,
  FileSearch,
  Wrench,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export type DebugPhase =
  | "describe"
  | "analyzing"
  | "hypothesis"
  | "investigating"
  | "solution"
  | "complete";

export interface DebugStep {
  id: string;
  phase: DebugPhase;
  title: string;
  content: string;
  status: "pending" | "active" | "complete" | "skipped";
  timestamp?: number;
}

export interface DebugSession {
  id: string;
  problem: string;
  steps: DebugStep[];
  currentPhase: DebugPhase;
  hypothesis: string | null;
  solution: string | null;
  filesInvestigated: string[];
  createdAt: number;
}

interface DebugModeProps {
  session: DebugSession | null;
  onStartDebug: (problem: string) => void;
  onApplySolution: (solution: string) => void;
  isLoading: boolean;
}

export function DebugMode({
  session,
  onStartDebug,
  onApplySolution,
  isLoading,
}: DebugModeProps) {
  const [problemInput, setProblemInput] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const handleSubmit = useCallback(() => {
    if (!problemInput.trim()) return;
    onStartDebug(problemInput.trim());
    setProblemInput("");
  }, [problemInput, onStartDebug]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getPhaseIcon = (phase: DebugPhase) => {
    switch (phase) {
      case "describe":
        return <Bug size={16} />;
      case "analyzing":
        return <Search size={16} />;
      case "hypothesis":
        return <Lightbulb size={16} />;
      case "investigating":
        return <FileSearch size={16} />;
      case "solution":
        return <Wrench size={16} />;
      case "complete":
        return <CheckCircle2 size={16} />;
      default:
        return <Code size={16} />;
    }
  };

  const getPhaseColor = (_phase: DebugPhase, status: DebugStep["status"]) => {
    if (status === "active") return "text-blue-500 bg-blue-500/10";
    if (status === "complete") return "text-green-500 bg-green-500/10";
    if (status === "skipped") return "text-muted-foreground bg-muted";
    return "text-muted-foreground/50 bg-muted/50";
  };

  // No active session - show input
  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Bug size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold">Debug Mode</h2>
            <p className="text-sm text-muted-foreground">
              Describe the issue you're experiencing and the AI will help
              investigate and find a solution.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              placeholder="Describe the bug or error you're seeing...&#10;&#10;Example: When I click the submit button, nothing happens and there's an error in the console about 'undefined is not a function'"
              className="w-full h-32 px-4 py-3 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!problemInput.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Search size={18} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Bug size={18} />
                  Start Debugging
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-border/40 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Debug Mode will:
            </p>
            <ul className="text-xs text-muted-foreground/70 space-y-1.5">
              <li className="flex items-start gap-2">
                <Search size={12} className="mt-0.5 flex-shrink-0" />
                <span>Analyze your code for potential issues</span>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                <span>Form hypotheses about root causes</span>
              </li>
              <li className="flex items-start gap-2">
                <FileSearch size={12} className="mt-0.5 flex-shrink-0" />
                <span>Investigate relevant files</span>
              </li>
              <li className="flex items-start gap-2">
                <Wrench size={12} className="mt-0.5 flex-shrink-0" />
                <span>Propose verified solutions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Active session - show debug progress
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-orange-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Bug size={18} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">Debugging Session</h3>
            <p className="text-xs text-muted-foreground truncate">
              {session.problem.slice(0, 60)}
              {session.problem.length > 60 ? "..." : ""}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(session.createdAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Debug Steps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {session.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border transition-colors ${
              step.status === "active"
                ? "border-blue-500/30 bg-blue-500/5"
                : step.status === "complete"
                ? "border-green-500/20 bg-green-500/5"
                : "border-border/40 bg-card/30"
            }`}
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPhaseColor(
                  step.phase,
                  step.status
                )}`}
              >
                {getPhaseIcon(step.phase)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{step.title}</span>
                  {step.status === "active" && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-xs text-blue-500"
                    >
                      In progress...
                    </motion.span>
                  )}
                </div>
                {step.timestamp && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {step.content && (
                expandedSteps.has(step.id) ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )
              )}
            </button>

            <AnimatePresence>
              {expandedSteps.has(step.id) && step.content && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground border-t border-border/20 mt-1">
                    <div className="pt-3 whitespace-pre-wrap">{step.content}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Files Investigated */}
        {session.filesInvestigated.length > 0 && (
          <div className="pt-4 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Files Investigated ({session.filesInvestigated.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {session.filesInvestigated.map((file) => (
                <span
                  key={file}
                  className="text-xs px-2 py-1 rounded bg-muted font-mono inline-flex items-center gap-1"
                >
                  <Code size={10} />
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Solution Panel */}
      {session.solution && (
        <div className="px-4 py-3 border-t border-border/40 bg-green-500/5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-green-600 dark:text-green-400">
                Solution Found
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {session.solution}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onApplySolution(session.solution!)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Apply Fix
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Hypothesis without solution yet */}
      {session.hypothesis && !session.solution && (
        <div className="px-4 py-3 border-t border-border/40 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400">
                Current Hypothesis
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {session.hypothesis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Create a new debugging session
 */
export function createDebugSession(problem: string): DebugSession {
  return {
    id: `debug_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    problem,
    steps: [
      {
        id: "step_describe",
        phase: "describe",
        title: "Problem Description",
        content: problem,
        status: "complete",
        timestamp: Date.now(),
      },
      {
        id: "step_analyzing",
        phase: "analyzing",
        title: "Analyzing Codebase",
        content: "",
        status: "active",
      },
    ],
    currentPhase: "analyzing",
    hypothesis: null,
    solution: null,
    filesInvestigated: [],
    createdAt: Date.now(),
  };
}

/**
 * Add a step to the debugging session
 */
export function addDebugStep(
  session: DebugSession,
  phase: DebugPhase,
  title: string,
  content: string
): DebugSession {
  const updatedSteps = session.steps.map((s) =>
    s.status === "active" ? { ...s, status: "complete" as const, timestamp: Date.now() } : s
  );

  return {
    ...session,
    steps: [
      ...updatedSteps,
      {
        id: `step_${Date.now()}`,
        phase,
        title,
        content,
        status: "active" as const,
        timestamp: Date.now(),
      },
    ],
    currentPhase: phase,
  };
}
