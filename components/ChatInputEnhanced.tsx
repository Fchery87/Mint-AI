"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ClipboardList,
  Hammer,
  Bug,
  Sparkles,
  X,
  ChevronUp,
} from "lucide-react";
import type { InteractionMode } from "@/types/plan-build";

interface ChatInputEnhancedProps {
  mode: InteractionMode;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSend: (message: string) => void;
  onModeChange?: (mode: InteractionMode) => void;
  onDebugMode?: () => void;
  hasActivePlan?: boolean;
  planApproved?: boolean;
}

export function ChatInputEnhanced({
  mode,
  isLoading,
  disabled = false,
  placeholder,
  onSend,
  onModeChange,
  onDebugMode,
  hasActivePlan = false,
  planApproved = false,
}: ChatInputEnhancedProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const getPlaceholder = useCallback(() => {
    if (placeholder) return placeholder;
    if (isLoading) return "Generating...";

    if (mode === "plan") {
      if (hasActivePlan && !planApproved) {
        return "Answer questions or modify the plan...";
      }
      return "Describe what you want to build...";
    }

    if (mode === "build") {
      if (hasActivePlan && planApproved) {
        return "Ready to build! The AI will execute your plan step by step...";
      }
      return "Describe your changes or paste code to modify...";
    }

    return "Type a message...";
  }, [mode, hasActivePlan, planApproved, placeholder, isLoading]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
    setShowActions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const suggestedActions = [
    {
      icon: ClipboardList,
      label: "Create a Plan",
      description: "Research and plan before building",
      action: () => {
        onModeChange?.("plan");
        setInput("I want to build ");
        textareaRef.current?.focus();
      },
      visible: mode === "build" && !hasActivePlan,
    },
    {
      icon: Hammer,
      label: "Start Building",
      description: "Jump straight into code generation",
      action: () => {
        onModeChange?.("build");
        textareaRef.current?.focus();
      },
      visible: mode === "plan" && !hasActivePlan,
    },
    {
      icon: Bug,
      label: "Debug Issue",
      description: "Investigate and fix a problem",
      action: () => {
        onDebugMode?.();
      },
      visible: !!onDebugMode,
    },
  ].filter((a) => a.visible);

  return (
    <div className="relative">
      {/* Suggested Actions */}
      <AnimatePresence>
        {showActions && suggestedActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-1 bg-card border border-border/40 rounded-xl shadow-lg"
          >
            {suggestedActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Container */}
      <div
        className={`relative flex items-end gap-2 p-3 rounded-2xl border transition-all ${
          isFocused
            ? "border-primary/50 bg-card shadow-lg ring-2 ring-primary/10"
            : "border-border/40 bg-muted/30"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {/* Left Actions */}
        <div className="flex items-center gap-1 pb-0.5">
          {suggestedActions.length > 0 && (
            <button
              onClick={() => setShowActions(!showActions)}
              className={`p-2 rounded-lg transition-colors ${
                showActions
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Suggested actions"
            >
              {showActions ? (
                <X size={18} />
              ) : (
                <Sparkles size={18} />
              )}
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={getPlaceholder()}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed max-h-[200px] placeholder:text-muted-foreground/50"
        />

        {/* Right Actions */}
        <div className="flex items-center gap-1 pb-0.5">
          {/* Mode Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
              mode === "plan"
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            {mode === "plan" ? (
              <>
                <ClipboardList size={12} />
                Plan
              </>
            ) : (
              <>
                <Hammer size={12} />
                Build
              </>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            title="Send message"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </motion.div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Hints */}
      <div className="flex items-center justify-between px-2 mt-1.5">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">
              Enter
            </kbd>{" "}
            to send
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">
              Shift + Enter
            </kbd>{" "}
            for new line
          </span>
        </div>
        {hasActivePlan && (
          <span className="text-[10px] text-primary/70 flex items-center gap-1">
            <ChevronUp size={10} />
            {planApproved ? "Plan approved - ready to build" : "Plan pending approval"}
          </span>
        )}
      </div>
    </div>
  );
}
