"use client";

import * as Sentry from "@sentry/nextjs";
import type { WorkspaceState } from "@/types/workspace";
import type { InteractionMode, ExecutionPlan } from "@/types/plan-build";
import type { SkillType } from "@/types/skill";
import type { ChatMessage } from "@/types/chat";

/**
 * Application state for Sentry error context
 */
export interface SentryAppState {
  workspace?: WorkspaceState | null;
  mode?: InteractionMode;
  currentPlan?: ExecutionPlan | null;
  activeSkill?: { type: SkillType; stage: string; confidence?: number } | null;
  messages?: ChatMessage[];
  recentActions?: string[];
  chatId?: string | undefined;
  isLoading?: boolean;
  inputStatus?: "ready" | "submitting" | "streaming" | "error";
  // Plan/Build context additional fields
  isBuilding?: boolean;
  isPaused?: boolean;
  currentStep?: { id: string; title: string; status: string } | null;
  statusLabel?: string;
  hasUnansweredQuestions?: boolean;
}

/**
 * Sanitize messages to remove sensitive information
 */
function sanitizeMessages(messages: ChatMessage[]): Array<{ role: string; content: string; length: number }> {
  return messages.slice(-5).map((msg) => ({
    role: msg.role,
    content: msg.content.slice(0, 200) + (msg.content.length > 200 ? "..." : ""),
    length: msg.content.length,
  }));
}

/**
 * Extract workspace summary for Sentry context
 */
function getWorkspaceSummary(workspace: WorkspaceState | null | undefined): Record<string, unknown> | null {
  if (!workspace) return null;

  const fileCount = Object.keys(workspace.files).length;
  const filePaths = Object.keys(workspace.files).slice(0, 10);

  return {
    fileCount,
    activePath: workspace.activePath,
    mode: workspace.mode,
    projectName: workspace.projectName,
    filePaths,
    hasCheckpoints: workspace.checkpoints?.length > 0,
    checkpointCount: workspace.checkpoints?.length || 0,
    updatedAt: workspace.updatedAt,
  };
}

/**
 * Extract plan summary for Sentry context
 */
function getPlanSummary(plan: ExecutionPlan | null | undefined): Record<string, unknown> | null {
  if (!plan) return null;

  return {
    id: plan.id,
    title: plan.title,
    status: plan.status,
    buildStatus: plan.buildStatus,
    stepCount: plan.steps?.length || 0,
    currentStepIndex: plan.currentStepIndex,
    progress: plan.progress,
    userApproved: plan.userApproved,
    hasUnansweredQuestions: plan.clarifyingQuestions?.some((q) => q.required && !q.answer) || false,
    questionCount: plan.clarifyingQuestions?.length || 0,
  };
}

/**
 * Set Sentry context with application state
 */
export function setSentryContext(state: SentryAppState): void {
  // Workspace context
  const workspaceSummary = getWorkspaceSummary(state.workspace);
  if (workspaceSummary) {
    Sentry.setContext("workspace", workspaceSummary);
  }

  // Plan/Build context
  const planSummary = getPlanSummary(state.currentPlan);
  if (planSummary) {
    Sentry.setContext("plan", planSummary);
  }

  // Mode tag
  if (state.mode) {
    Sentry.setTag("app.mode", state.mode);
  }

  // Active skill context
  if (state.activeSkill) {
    Sentry.setContext("skill", {
      type: state.activeSkill.type,
      stage: state.activeSkill.stage,
      confidence: state.activeSkill.confidence,
    });
    Sentry.setTag("skill.type", state.activeSkill.type);
    Sentry.setTag("skill.stage", state.activeSkill.stage);
  }

  // Recent messages (sanitized)
  if (state.messages && state.messages.length > 0) {
    Sentry.setContext("chat", {
      messageCount: state.messages.length,
      recentMessages: sanitizeMessages(state.messages),
      chatId: state.chatId,
    });
  }

  // Recent actions
  if (state.recentActions && state.recentActions.length > 0) {
    Sentry.setContext("actions", {
      recentActions: state.recentActions.slice(-10),
      actionCount: state.recentActions.length,
    });
  }

  // Status tags
  if (state.isLoading !== undefined) {
    Sentry.setTag("app.loading", state.isLoading ? "true" : "false");
  }

  if (state.inputStatus) {
    Sentry.setTag("app.inputStatus", state.inputStatus);
  }

  if (state.chatId) {
    Sentry.setTag("chat.id", state.chatId);
  }
}

/**
 * Clear all Sentry contexts
 */
export function clearSentryContext(): void {
  Sentry.setContext("workspace", null);
  Sentry.setContext("plan", null);
  Sentry.setContext("skill", null);
  Sentry.setContext("chat", null);
  Sentry.setContext("actions", null);
}

/**
 * Add a breadcrumb for user actions
 */
export function addActionBreadcrumb(
  action: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: category || "user.action",
    message: action,
    level: "info",
    data,
  });
}

/**
 * Capture error with enriched context
 */
export function captureErrorWithContext(
  error: Error,
  state: SentryAppState,
  context?: Record<string, unknown>
): void {
  setSentryContext(state);

  if (context) {
    Sentry.setContext("error_context", context);
  }

  Sentry.captureException(error);
}

/**
 * Hook-compatible function to update Sentry context
 * Call this whenever significant state changes occur
 */
export function updateSentryScope(state: Partial<SentryAppState>): void {
  Sentry.withScope((scope) => {
    if (state.mode) {
      scope.setTag("app.mode", state.mode);
    }

    if (state.activeSkill) {
      scope.setTag("skill.type", state.activeSkill.type);
      scope.setTag("skill.stage", state.activeSkill.stage);
    }

    if (state.inputStatus) {
      scope.setTag("app.inputStatus", state.inputStatus);
    }

    if (state.chatId) {
      scope.setTag("chat.id", state.chatId);
    }
  });
}
