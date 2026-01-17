"use client";

import { Component, ReactNode, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorInfo {
  componentStack?: string;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleReset = () => {
    setHasError(false);
    setError(null);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleCatch = (err: Error, errorInfo: ErrorInfo) => {
    setHasError(true);
    setError(err);

    console.error("Error caught by boundary:", err, errorInfo);

    Sentry.captureException(err, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-slate-400 mb-6">
            An unexpected error occurred. Don&apos;t worry, your work is safe.
          </p>

          {error && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400 mb-2">
                Error details
              </summary>
              <div className="bg-slate-950 rounded p-3 text-xs text-red-400 font-mono overflow-auto max-h-32">
                {error.message ?? 'Unknown error'}
              </div>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-mint-500 hover:bg-mint-600 text-white rounded-md transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <button
              onClick={handleReload}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryInner onError={handleCatch}>
      {children}
    </ErrorBoundaryInner>
  );
}

interface ErrorBoundaryInnerProps {
  children: ReactNode;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryInnerProps> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, { componentStack: errorInfo.componentStack ?? undefined });
  }

  render() {
    return this.props.children;
  }
}
