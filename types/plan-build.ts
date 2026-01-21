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
 * A single step in the execution plan
 */
export interface PlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  filesToModify?: string[];
  filesToCreate?: string[];
  estimatedComplexity?: 'low' | 'medium' | 'high';
  dependencies?: string[]; // IDs of steps this depends on
  output?: string; // Result or error message
}

/**
 * Questions the AI needs answered before proceeding
 */
export interface ClarifyingQuestion {
  id: string;
  question: string;
  options?: string[]; // Suggested answers
  required: boolean;
  answer?: string;
}

/**
 * Files discovered or analyzed during planning
 */
export interface AnalyzedFile {
  path: string;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
  willModify: boolean;
}

/**
 * The structured plan created in Plan Mode
 */
export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  status: PlanStatus;

  // Research phase outputs
  analyzedFiles: AnalyzedFile[];
  codebaseContext: string;

  // Planning phase outputs
  steps: PlanStep[];
  clarifyingQuestions: ClarifyingQuestion[];

  // Execution tracking
  currentStepIndex: number;
  buildStatus: BuildStatus;
  progress: number; // 0-100
  checkpointId?: string; // Reference to checkpoint created before build

  // Metadata
  userApproved: boolean;
  userModified: boolean;
  estimatedDuration?: string;
}

/**
 * State for the Plan/Build mode system
 */
export interface PlanBuildState {
  mode: InteractionMode;
  currentPlan: ExecutionPlan | null;
  planHistory: ExecutionPlan[];

  // UI state
  isPlanEditable: boolean;
  showDiffPreview: boolean;
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
