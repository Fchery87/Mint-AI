/**
 * Error Fallback Component
 *
 * User-friendly error display with clean modern styling.
 * Used by ErrorBoundary to display errors gracefully.
 */

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Terminal, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  className,
}: ErrorFallbackProps) {
  // Report error to Sentry
  const handleReportError = () => {
    Sentry.captureException(error, {
      tags: {
        source: "error-boundary",
        errorType: error.name,
      },
      extra: {
        message: error.message,
        stack: error.stack,
      },
    });
  };

  // Get user-friendly error message
  const getUserMessage = () => {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return "Connection lost. Please check your internet connection.";
    }
    if (error.message.includes("permission") || error.message.includes("access")) {
      return "Access denied. You don't have permission to perform this action.";
    }
    if (error.message.includes("timeout")) {
      return "Operation timed out. The server is taking too long to respond.";
    }
    return "An unexpected error occurred. Please try again.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[300px] p-6",
        "bg-background",
        className
      )}
    >
      {/* Error Icon */}
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
      </motion.div>

      {/* Error Code */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-medium text-rose-500/80 mb-2 uppercase tracking-wide"
      >
        {error.name || "Error"}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-xl font-semibold text-foreground mb-3"
      >
        Something went wrong
      </motion.h2>

      {/* User-friendly message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground text-center max-w-md mb-6"
      >
        {getUserMessage()}
      </motion.p>

      {/* Technical details (collapsible) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-lg mb-6"
      >
        <details className="group">
          <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <Terminal className="w-3.5 h-3.5" />
            <span>View Technical Details</span>
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border font-mono text-xs text-muted-foreground overflow-auto">
            <p className="text-rose-500/80 mb-1">{error.message}</p>
            {error.stack && (
              <pre className="text-[10px] opacity-60 whitespace-pre-wrap">
                {error.stack.split("\n").slice(0, 5).join("\n")}
              </pre>
            )}
          </div>
        </details>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        {/* Retry Button */}
        <button
          onClick={resetErrorBoundary}
          className={cn(
            "group flex items-center gap-2 px-5 py-2.5 rounded-lg",
            "bg-accent text-accent-foreground",
            "hover:bg-accent/90 transition-all duration-200",
            "text-sm font-medium"
          )}
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </button>

        {/* Report Button */}
        <button
          onClick={handleReportError}
          className={cn(
            "group flex items-center gap-2 px-5 py-2.5 rounded-lg",
            "bg-muted text-muted-foreground",
            "border border-border",
            "hover:bg-muted/80 hover:text-foreground transition-all duration-200",
            "text-sm font-medium"
          )}
        >
          <Bug className="w-4 h-4" />
          Report Issue
        </button>
      </motion.div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xs text-muted-foreground/60"
      >
        If the problem persists, please contact support
      </motion.p>
    </motion.div>
  );
}

export default ErrorFallback;
