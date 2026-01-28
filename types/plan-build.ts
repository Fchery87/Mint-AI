/**
 * Mint AI Plan/Build Mode Types
 *
 * Defines the types for the Plan/Build mode paradigm that replaces
 * the legacy Ask/Agent mode toggle.
 */

/**
 * The primary interaction mode for the AI.
 * - plan: Research, analyze, create structured plan before execution
 * - build: Execute the approved plan step by step
 */
export type InteractionMode = 'plan' | 'build';

/**
 * Status of the current planning phase
 */
export enum PlanStatus {
  IDLE = 'idle',
  RESEARCHING = 'researching',
  ANALYZING = 'analyzing',
  QUESTIONING = 'questioning',
  DRAFTING = 'drafting',
  READY = 'ready',
  APPROVED = 'approved',
}

/**
 * Status of the current build phase
 */
export enum BuildStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  EXECUTING = 'executing',
  PAUSED = 'paused',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Status of an individual plan step
 */
export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Complexity estimate for a plan step
 */
export type StepComplexity = 'low' | 'medium' | 'high';

/**
 * A single step in the execution plan
 */
export interface PlanStep {
  /** Unique step ID */
  id: string;
  /** Step order/sequence number */
  order: number;
  /** Step title */
  title: string;
  /** Detailed step description */
  description: string;
  /** Current execution status */
  status: PlanStepStatus;
  /** Files that will be modified in this step */
  filesToModify?: string[];
  /** Files that will be created in this step */
  filesToCreate?: string[];
  /** Estimated complexity of the step */
  estimatedComplexity?: StepComplexity;
  /** IDs of steps this step depends on */
  dependencies?: string[];
  /** Result or error message from execution */
  output?: string;
}

/**
 * A clarifying question from the AI to the user
 */
export interface ClarifyingQuestion {
  /** Question ID */
  id: string;
  /** The question text */
  question: string;
  /** Optional suggested answer options */
  options?: string[];
  /** Whether this question must be answered */
  required: boolean;
  /** User's answer (if provided) */
  answer?: string;
}

/**
 * Relevance level for analyzed files
 */
export type FileRelevance = 'high' | 'medium' | 'low';

/**
 * A file discovered or analyzed during planning
 */
export interface AnalyzedFile {
  /** File path */
  path: string;
  /** Relevance to the current task */
  relevance: FileRelevance;
  /** Reason for relevance assessment */
  reason: string;
  /** Whether this file will be modified */
  willModify: boolean;
}

/**
 * The structured plan created in Plan Mode
 */
export interface ExecutionPlan {
  /** Unique plan ID */
  id: string;
  /** Plan title */
  title: string;
  /** Plan description */
  description: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Current plan status */
  status: PlanStatus;
  /** Files analyzed during planning */
  analyzedFiles: AnalyzedFile[];
  /** Context about the codebase */
  codebaseContext: string;
  /** Steps in the execution plan */
  steps: PlanStep[];
  /** Questions for the user */
  clarifyingQuestions: ClarifyingQuestion[];
  /** Current step index during execution */
  currentStepIndex: number;
  /** Current build status */
  buildStatus: BuildStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Reference to checkpoint created before build */
  checkpointId?: string;
  /** Whether the user has approved this plan */
  userApproved: boolean;
  /** Whether the user has modified this plan */
  userModified: boolean;
  /** Estimated duration for completion */
  estimatedDuration?: string;
}

/**
 * State for the Plan/Build mode system
 */
export interface PlanBuildState {
  /** Current interaction mode */
  mode: InteractionMode;
  /** Current active plan */
  currentPlan: ExecutionPlan | null;
  /** History of plans */
  planHistory: ExecutionPlan[];
  /** Whether the plan is editable */
  isPlanEditable: boolean;
  /** Whether to show diff preview */
  showDiffPreview: boolean;
  /** Whether to auto-approve non-destructive changes */
  autoApproveNonDestructive: boolean;
}

/**
 * Events emitted during Plan/Build workflow
 */
export type PlanBuildEvent =
  | { type: 'plan-started'; title: string }
  | { type: 'research-update'; content: string; filesFound: number }
  | { type: 'question-asked'; question: ClarifyingQuestion }
  | { type: 'plan-step-added'; step: PlanStep }
  | { type: 'plan-ready'; plan: ExecutionPlan }
  | { type: 'build-started'; planId: string }
  | { type: 'step-started'; stepId: string; stepIndex: number }
  | { type: 'step-progress'; stepId: string; progress: number; message: string }
  | { type: 'step-completed'; stepId: string; output?: string }
  | { type: 'step-failed'; stepId: string; error: string }
  | { type: 'build-paused'; reason: string }
  | { type: 'build-completed'; summary: string }
  | { type: 'build-failed'; error: string; canRetry: boolean };

/**
 * Actions for updating Plan/Build state
 */
export type PlanBuildAction =
  | { type: 'START_PLANNING'; message: string }
  | { type: 'UPDATE_PLAN_STATUS'; status: PlanStatus }
  | { type: 'SET_PLAN'; plan: ExecutionPlan }
  | { type: 'UPDATE_STEP'; stepId: string; updates: Partial<PlanStep> }
  | { type: 'ANSWER_QUESTION'; questionId: string; answer: string }
  | { type: 'APPROVE_PLAN' }
  | { type: 'EDIT_PLAN'; plan: ExecutionPlan }
  | { type: 'START_BUILD' }
  | { type: 'PAUSE_BUILD' }
  | { type: 'RESUME_BUILD' }
  | { type: 'CANCEL_BUILD' }
  | { type: 'SWITCH_MODE'; mode: InteractionMode }
  | { type: 'RESET' };

/**
 * Default initial state for Plan/Build mode
 */
export const initialPlanBuildState: PlanBuildState = {
  mode: 'plan',
  currentPlan: null,
  planHistory: [],
  isPlanEditable: true,
  showDiffPreview: true,
  autoApproveNonDestructive: false,
};

/**
 * Create a new empty execution plan
 */
export function createEmptyPlan(title: string): ExecutionPlan {
  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: PlanStatus.IDLE,
    analyzedFiles: [],
    codebaseContext: '',
    steps: [],
    clarifyingQuestions: [],
    currentStepIndex: 0,
    buildStatus: BuildStatus.IDLE,
    progress: 0,
    userApproved: false,
    userModified: false,
  };
}

/**
 * Calculate progress based on completed steps
 */
export function calculatePlanProgress(plan: ExecutionPlan): number {
  if (plan.steps.length === 0) return 0;
  const completed = plan.steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped',
  ).length;
  return Math.round((completed / plan.steps.length) * 100);
}
