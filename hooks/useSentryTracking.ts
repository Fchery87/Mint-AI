"use client";

import { useEffect, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";
import { useUpdateSentryState } from "@/components/SentryErrorBoundaryWrapper";
import type { SentryAppState } from "@/lib/sentry-context";
import type { ChatMessage } from "@/types/chat";
import type { SkillType } from "@/types/skill";
import type { WorkspaceState } from "@/types/workspace";

interface UseSentryChatTrackingProps {
  messages: ChatMessage[];
  chatId: string | undefined;
  isLoading: boolean;
  inputStatus: "ready" | "submitting" | "streaming" | "error";
  activeSkill: { type: SkillType; stage: string; confidence?: number } | null;
  workspace: WorkspaceState | null;
}

/**
 * Hook to track chat state in Sentry context
 * Call this in your main page/component that uses useChat
 */
export function useSentryChatTracking({
  messages,
  chatId,
  isLoading,
  inputStatus,
  activeSkill,
  workspace,
}: UseSentryChatTrackingProps) {
  const updateSentryState = useUpdateSentryState();

  // Update Sentry state whenever relevant state changes
  useEffect(() => {
    const state: Partial<SentryAppState> = {
      messages,
      chatId,
      isLoading,
      inputStatus,
      activeSkill,
      workspace,
    };

    updateSentryState(state);

    // Also update Sentry scope for immediate effect
    Sentry.withScope((scope) => {
      scope.setTag("chat.id", chatId || "none");
      scope.setTag("app.loading", isLoading ? "true" : "false");
      scope.setTag("app.inputStatus", inputStatus);
      
      if (activeSkill) {
        scope.setTag("skill.type", activeSkill.type);
        scope.setTag("skill.stage", activeSkill.stage);
      }

      if (workspace) {
        scope.setContext("workspace", {
          fileCount: Object.keys(workspace.files).length,
          activePath: workspace.activePath,
          mode: workspace.mode,
        });
      }
    });
  }, [
    messages,
    chatId,
    isLoading,
    inputStatus,
    activeSkill,
    workspace,
    updateSentryState,
  ]);

  // Function to track user actions
  const trackAction = useCallback((action: string, data?: Record<string, unknown>) => {
    Sentry.addBreadcrumb({
      category: "user.action",
      message: action,
      level: "info",
      data,
    });
  }, []);

  return { trackAction };
}

/**
 * Hook to track workspace state in Sentry context
 * Use this in components that manage workspace state
 */
export function useSentryWorkspaceTracking(workspace: WorkspaceState | null) {
  const updateSentryState = useUpdateSentryState();

  useEffect(() => {
    updateSentryState({ workspace });
  }, [workspace, updateSentryState]);
}

/**
 * Hook to manually capture an error with full context
 */
export function useSentryErrorCapture() {
  const updateSentryState = useUpdateSentryState();

  const captureError = useCallback((
    error: Error,
    context?: Record<string, unknown>
  ) => {
    if (context) {
      Sentry.setContext("error_context", context);
    }
    Sentry.captureException(error);
  }, []);

  return { captureError };
}
