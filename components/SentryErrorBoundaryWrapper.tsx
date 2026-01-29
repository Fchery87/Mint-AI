"use client";

import { ReactNode, useCallback, useRef } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { usePlanBuildContext } from "@/lib/contexts/PlanBuildContext";
import type { SentryAppState } from "@/lib/sentry-context";

interface SentryErrorBoundaryWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides application state to the ErrorBoundary
 * for Sentry context enrichment.
 * 
 * This component sits inside PlanBuildProvider so it can access the plan/build
 * context, and wraps the children with ErrorBoundary.
 */
export function SentryErrorBoundaryWrapper({ children }: SentryErrorBoundaryWrapperProps) {
  const planBuildContext = usePlanBuildContext();
  
  // Use refs to store external state that will be passed to ErrorBoundary
  // These will be set by hooks/components that have access to chat/workspace state
  const appStateRef = useRef<Partial<SentryAppState>>({});

  // Function to get current application state for Sentry
  const getAppState = useCallback((): Partial<SentryAppState> => {
    return {
      mode: planBuildContext.mode,
      currentPlan: planBuildContext.currentPlan,
      isBuilding: planBuildContext.isBuilding,
      isPaused: planBuildContext.isPaused,
      currentStep: planBuildContext.currentStep,
      statusLabel: planBuildContext.statusLabel,
      hasUnansweredQuestions: planBuildContext.hasUnansweredQuestions,
      ...appStateRef.current,
    };
  }, [
    planBuildContext.mode,
    planBuildContext.currentPlan,
    planBuildContext.isBuilding,
    planBuildContext.isPaused,
    planBuildContext.currentStep,
    planBuildContext.statusLabel,
    planBuildContext.hasUnansweredQuestions,
  ]);

  return (
    <ErrorBoundary getAppState={getAppState}>
      <SentryStateProvider stateRef={appStateRef}>
        {children}
      </SentryStateProvider>
    </ErrorBoundary>
  );
}

// Context to allow child components to update the Sentry state ref
import { createContext, useContext } from "react";

interface SentryStateContextValue {
  updateState: (state: Partial<SentryAppState>) => void;
}

const SentryStateContext = createContext<SentryStateContextValue | undefined>(undefined);

interface SentryStateProviderProps {
  children: ReactNode;
  stateRef: React.MutableRefObject<Partial<SentryAppState>>;
}

function SentryStateProvider({ children, stateRef }: SentryStateProviderProps) {
  const updateState = useCallback((state: Partial<SentryAppState>) => {
    stateRef.current = { ...stateRef.current, ...state };
  }, [stateRef]);

  return (
    <SentryStateContext.Provider value={{ updateState }}>
      {children}
    </SentryStateContext.Provider>
  );
}

/**
 * Hook to update Sentry application state from child components
 * Use this in components that have access to chat/workspace state
 */
export function useUpdateSentryState() {
  const context = useContext(SentryStateContext);
  if (context === undefined) {
    throw new Error("useUpdateSentryState must be used within SentryErrorBoundaryWrapper");
  }
  return context.updateState;
}
