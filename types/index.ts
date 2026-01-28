/**
 * Mint AI Types
 *
 * Centralized type definitions for the Mint AI application.
 * All types are explicitly exported (no default exports).
 */

// Chat types
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ThinkingItem,
  ToolItem,
} from './chat';

// Workspace types
export type {
  WorkspaceMode,
  WorkspaceFiles,
  WorkspaceCheckpoint,
  WorkspaceState,
  PendingChangeStatus,
  PendingChange,
} from './workspace';

// Terminal types
export type {
  TerminalLineType,
  TerminalLine,
} from './terminal';

// Plan/Build types
export type {
  InteractionMode,
  PlanStepStatus,
  StepComplexity,
  PlanStep,
  ClarifyingQuestion,
  FileRelevance,
  AnalyzedFile,
  ExecutionPlan,
  PlanBuildState,
  PlanBuildEvent,
  PlanBuildAction,
} from './plan-build';

// Plan/Build enums (exported separately)
export { PlanStatus, BuildStatus } from './plan-build';

// Plan/Build utilities
export {
  initialPlanBuildState,
  createEmptyPlan,
  calculatePlanProgress,
} from './plan-build';

// Skill types
export type {
  SkillContext,
  SkillConfig,
  SkillResult,
  SkillHandler,
  IntentMatch,
  TDDConfig,
  SkillRegistry,
} from './skill';

// Skill enums (exported separately)
export { SkillType, WorkflowStage } from './skill';
