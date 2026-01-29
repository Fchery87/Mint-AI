/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorFallback } from "./ErrorFallback";
import { setSentryContext, type SentryAppState } from "@/lib/sentry-context";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  /**
   * Function to get current application state for Sentry context enrichment.
   * Should be provided by a parent component that has access to app state.
   */
  getAppState?: () => Partial<SentryAppState>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary class component
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Enrich Sentry context with application state if available
    if (this.props.getAppState) {
      try {
        const appState = this.props.getAppState();
        setSentryContext(appState as SentryAppState);
      } catch (e) {
        console.warn("Failed to get app state for Sentry context:", e);
      }
    }

    // Capture error with Sentry, including component stack
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Call optional onError handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state
    this.setState({ hasError: false, error: null });
    
    // Call optional onReset handler
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback with ErrorFallback component
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * 
 * Usage:
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
