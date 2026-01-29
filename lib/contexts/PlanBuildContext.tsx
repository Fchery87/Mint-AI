"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  PlanBuildState,
  PlanBuildAction,
  ExecutionPlan,
  PlanStep,
  InteractionMode,
} from "@/types/plan-build";
import {
  PlanStatus,
  BuildStatus,
  initialPlanBuildState,
  createEmptyPlan,
  calculatePlanProgress,
} from "@/types/plan-build";

/**
 * Reducer for Plan/Build state management
 */
function planBuildReducer(
  state: PlanBuildState,
  action: PlanBuildAction
): PlanBuildState {
  switch (action.type) {
    case "START_PLANNING": {
      const newPlan = createEmptyPlan(
        action.message.length > 50
          ? action.message.slice(0, 50) + "..."
          : action.message
      );
      return {
        ...state,
        mode: "plan",
        currentPlan: {
          ...newPlan,
          status: PlanStatus.RESEARCHING,
        },
        isPlanEditable: false,
      };
    }

    case "UPDATE_PLAN_STATUS": {
      if (!state.currentPlan) return state;
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          status: action.status,
          updatedAt: Date.now(),
        },
        isPlanEditable: action.status === PlanStatus.READY,
      };
    }

    case "SET_PLAN": {
      return {
        ...state,
        currentPlan: action.plan,
        isPlanEditable: action.plan.status === PlanStatus.READY,
      };
    }

    case "UPDATE_STEP": {
      if (!state.currentPlan) return state;
      const steps = state.currentPlan.steps.map((step) =>
        step.id === action.stepId ? { ...step, ...action.updates } : step
      );
      const progress = calculatePlanProgress({
        ...state.currentPlan,
        steps,
      });
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          steps,
          progress,
          updatedAt: Date.now(),
        },
      };
    }

    case "ANSWER_QUESTION": {
      if (!state.currentPlan?.clarifyingQuestions) return state;
      const questions = state.currentPlan.clarifyingQuestions.map((q) =>
        q.id === action.questionId ? { ...q, answer: action.answer } : q
      );
      // Check if all required questions are answered
      const allRequired = questions.filter((q) => q.required);
      const allAnswered = allRequired.every((q) => q.answer);
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          clarifyingQuestions: questions,
          status: allAnswered ? PlanStatus.READY : state.currentPlan.status,
          updatedAt: Date.now(),
        },
      };
    }

    case "APPROVE_PLAN": {
      if (!state.currentPlan) return state;
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          status: PlanStatus.APPROVED,
          userApproved: true,
          updatedAt: Date.now(),
        },
        isPlanEditable: false,
      };
    }

    case "EDIT_PLAN": {
      return {
        ...state,
        currentPlan: {
          ...action.plan,
          userModified: true,
          updatedAt: Date.now(),
        },
      };
    }

    case "START_BUILD": {
      if (!state.currentPlan || !state.currentPlan.userApproved) return state;
      return {
        ...state,
        mode: "build",
        currentPlan: {
          ...state.currentPlan,
          buildStatus: BuildStatus.PREPARING,
          currentStepIndex: 0,
          progress: 0,
          updatedAt: Date.now(),
        },
        isPlanEditable: false,
      };
    }

    case "PAUSE_BUILD": {
      if (!state.currentPlan) return state;
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          buildStatus: BuildStatus.PAUSED,
          updatedAt: Date.now(),
        },
      };
    }

    case "RESUME_BUILD": {
      if (!state.currentPlan) return state;
      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          buildStatus: BuildStatus.EXECUTING,
          updatedAt: Date.now(),
        },
      };
    }

    case "CANCEL_BUILD": {
      if (!state.currentPlan) return state;
      return {
        ...state,
        mode: "plan",
        planHistory: [state.currentPlan, ...state.planHistory].slice(0, 10),
        currentPlan: null,
        isPlanEditable: true,
      };
    }

    case "SWITCH_MODE": {
      return {
        ...state,
        mode: action.mode,
      };
    }

    case "RESET": {
      if (state.currentPlan) {
        return {
          ...initialPlanBuildState,
          planHistory: [state.currentPlan, ...state.planHistory].slice(0, 10),
        };
      }
      return initialPlanBuildState;
    }

    default:
      return state;
  }
}

/**
 * Context value type
 */
interface PlanBuildContextValue extends PlanBuildState {
  // Actions
  startPlanning: (message: string) => void;
  updatePlanStatus: (status: PlanStatus) => void;
  setPlan: (plan: ExecutionPlan) => void;
  updateStep: (stepId: string, updates: Partial<PlanStep>) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  approvePlan: () => void;
  editPlan: (plan: ExecutionPlan) => void;
  startBuild: () => void;
  pauseBuild: () => void;
  resumeBuild: () => void;
  cancelBuild: () => void;
  switchMode: (mode: InteractionMode) => void;
  reset: () => void;

  // Computed values
  canStartBuild: boolean;
  isBuilding: boolean;
  isPaused: boolean;
  currentStep: PlanStep | null;
  statusLabel: string;
  hasUnansweredQuestions: boolean;
}

const PlanBuildContext = createContext<PlanBuildContextValue | undefined>(
  undefined
);

/**
 * Provider component
 */
export function PlanBuildProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(planBuildReducer, initialPlanBuildState);

  // Actions
  const startPlanning = useCallback((message: string) => {
    dispatch({ type: "START_PLANNING", message });
  }, []);

  const updatePlanStatus = useCallback((status: PlanStatus) => {
    dispatch({ type: "UPDATE_PLAN_STATUS", status });
  }, []);

  const setPlan = useCallback((plan: ExecutionPlan) => {
    dispatch({ type: "SET_PLAN", plan });
  }, []);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<PlanStep>) => {
      dispatch({ type: "UPDATE_STEP", stepId, updates });
    },
    []
  );

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    dispatch({ type: "ANSWER_QUESTION", questionId, answer });
  }, []);

  const approvePlan = useCallback(() => {
    dispatch({ type: "APPROVE_PLAN" });
  }, []);

  const editPlan = useCallback((plan: ExecutionPlan) => {
    dispatch({ type: "EDIT_PLAN", plan });
  }, []);

  const startBuild = useCallback(() => {
    dispatch({ type: "START_BUILD" });
  }, []);

  const pauseBuild = useCallback(() => {
    dispatch({ type: "PAUSE_BUILD" });
  }, []);

  const resumeBuild = useCallback(() => {
    dispatch({ type: "RESUME_BUILD" });
  }, []);

  const cancelBuild = useCallback(() => {
    dispatch({ type: "CANCEL_BUILD" });
  }, []);

  const switchMode = useCallback((mode: InteractionMode) => {
    dispatch({ type: "SWITCH_MODE", mode });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Computed values
  const canStartBuild = useMemo(() => {
    if (!state.currentPlan) return false;
    // Plan must be in READY status to be approved
    if (state.currentPlan.status !== PlanStatus.READY) return false;
    if (state.currentPlan.steps.length === 0) return false;
    const unansweredRequired = state.currentPlan.clarifyingQuestions?.filter(
      (q) => q.required && !q.answer
    ) || [];
    return unansweredRequired.length === 0;
  }, [state.currentPlan]);

  const isBuilding = useMemo(() => {
    return (
      state.mode === "build" &&
      state.currentPlan?.buildStatus === BuildStatus.EXECUTING
    );
  }, [state.mode, state.currentPlan]);

  const isPaused = useMemo(() => {
    return state.currentPlan?.buildStatus === BuildStatus.PAUSED;
  }, [state.currentPlan]);

  const currentStep = useMemo(() => {
    if (!state.currentPlan || state.currentPlan.steps.length === 0) return null;
    return state.currentPlan.steps[state.currentPlan.currentStepIndex] || null;
  }, [state.currentPlan]);

  const statusLabel = useMemo(() => {
    if (!state.currentPlan) {
      return state.mode === "plan" ? "Ready to plan" : "Ready to build";
    }

    if (state.mode === "plan") {
      switch (state.currentPlan.status) {
        case PlanStatus.RESEARCHING:
          return "Researching codebase...";
        case PlanStatus.ANALYZING:
          return "Analyzing requirements...";
        case PlanStatus.QUESTIONING:
          return "Awaiting your input...";
        case PlanStatus.DRAFTING:
          return "Creating plan...";
        case PlanStatus.READY:
          return "Plan ready for review";
        case PlanStatus.APPROVED:
          return "Plan approved";
        default:
          return "Planning...";
      }
    }

    if (state.mode === "build") {
      switch (state.currentPlan.buildStatus) {
        case BuildStatus.PREPARING:
          return "Preparing build...";
        case BuildStatus.EXECUTING:
          return `Building: Step ${state.currentPlan.currentStepIndex + 1}/${state.currentPlan.steps.length}`;
        case BuildStatus.PAUSED:
          return "Build paused";
        case BuildStatus.VERIFYING:
          return "Verifying changes...";
        case BuildStatus.COMPLETED:
          return "Build complete!";
        case BuildStatus.FAILED:
          return "Build failed";
        default:
          return "Building...";
      }
    }

    return "";
  }, [state.mode, state.currentPlan]);

  const hasUnansweredQuestions = useMemo(() => {
    if (!state.currentPlan?.clarifyingQuestions) return false;
    return state.currentPlan.clarifyingQuestions.some(
      (q) => q.required && !q.answer
    );
  }, [state.currentPlan]);

  const value = useMemo<PlanBuildContextValue>(
    () => ({
      ...state,
      startPlanning,
      updatePlanStatus,
      setPlan,
      updateStep,
      answerQuestion,
      approvePlan,
      editPlan,
      startBuild,
      pauseBuild,
      resumeBuild,
      cancelBuild,
      switchMode,
      reset,
      canStartBuild,
      isBuilding,
      isPaused,
      currentStep,
      statusLabel,
      hasUnansweredQuestions,
    }),
    [
      state,
      startPlanning,
      updatePlanStatus,
      setPlan,
      updateStep,
      answerQuestion,
      approvePlan,
      editPlan,
      startBuild,
      pauseBuild,
      resumeBuild,
      cancelBuild,
      switchMode,
      reset,
      canStartBuild,
      isBuilding,
      isPaused,
      currentStep,
      statusLabel,
      hasUnansweredQuestions,
    ]
  );

  return (
    <PlanBuildContext.Provider value={value}>
      {children}
    </PlanBuildContext.Provider>
  );
}

/**
 * Hook to use Plan/Build context
 */
export function usePlanBuildContext() {
  const context = useContext(PlanBuildContext);
  if (context === undefined) {
    throw new Error("usePlanBuildContext must be used within a PlanBuildProvider");
  }
  return context;
}
