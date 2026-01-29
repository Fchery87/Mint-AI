/**
 * useChat Hook
 *
 * Manages chat state, message handling, and streaming responses.
 * Extracted from page.tsx to separate chat concerns from UI.
 */

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import type { ChatMessage, ChatRequest, ThinkingItem } from "@/types/chat";
import type { SkillType } from "@/types/skill";
import type { ProjectOutput } from "@/lib/project-types";
import { parseProjectOutput } from "@/lib/project-types";
import { detectLanguage } from "@/lib/language-detection";
import { checkCodeQuality, formatQualityReport } from "@/lib/code-quality-check";
import { parsePlanResponse } from "@/lib/plan-parser";
import type { ExecutionPlan } from "@/types/plan-build";
import { withRetry, createFetchRetryPredicate } from "@/lib/retry";

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  chatId: string | undefined;
  inputStatus: "ready" | "submitting" | "streaming" | "error";
  componentCode: string;
  projectOutput: ProjectOutput | null;
  sessionCost: { cost: string; tokens: string } | null;
  activeSkill: { type: SkillType; stage: string; confidence?: number } | null;
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  appendMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setChatId: (id: string | undefined) => void;
  resetChat: () => void;
}

export interface SendMessageOptions {
  chatId?: string;
  outputFormat?: string;
  mode?: "plan" | "build";
  webSearch?: boolean;
  planId?: string;
  currentStepIndex?: number;
  currentPlan?: {
    id: string;
    title: string;
    currentStepIndex: number;
    steps: Array<{ title: string }>;
  } | null;
  onPlanParsed?: (plan: unknown) => void;
  onWorkspaceUpdate?: (output: ProjectOutput) => void;
  onCheckpoint?: () => void;
  onTerminalLine?: (content: string, type: "output" | "success" | "error" | "info") => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const [componentCode, setComponentCode] = useState("");
  const [projectOutput, setProjectOutput] = useState<ProjectOutput | null>(null);
  const [inputStatus, setInputStatus] = useState<"ready" | "submitting" | "streaming" | "error">("ready");
  const [sessionCost, setSessionCost] = useState<{ cost: string; tokens: string } | null>(null);
  const [activeSkill, setActiveSkill] = useState<{ type: SkillType; stage: string; confidence?: number } | null>(null);

  // Use ref to track assistant message index during streaming
  const assistantIndexRef = useRef<number>(0);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setChatId(undefined);
    setComponentCode("");
    setProjectOutput(null);
    setInputStatus("ready");
    setSessionCost(null);
    setActiveSkill(null);
  }, []);

  const sendMessage = useCallback(async (
    message: string,
    options: SendMessageOptions = {}
  ) => {
    if (!message.trim()) return;

    Sentry.addBreadcrumb({
      category: 'chat',
      message: 'User sent message',
      level: 'info',
      data: { 
        messageLength: message.length,
        mode: options.mode || 'plan',
        hasPlan: !!options.currentPlan,
        webSearch: options.webSearch 
      }
    });

    const {
      outputFormat: preferredFormat,
      mode = "plan",
      webSearch = false,
      currentPlan,
      onPlanParsed,
      onWorkspaceUpdate,
      onCheckpoint,
      onTerminalLine,
    } = options;

    // Add user command to terminal
    onTerminalLine?.(`$ ${message}`, "output");

    const detectedLanguage = preferredFormat || detectLanguage(message);
    setActiveSkill(null);

    const userMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInputStatus("submitting");

    const assistantIndex = messages.length + 1;
    assistantIndexRef.current = assistantIndex;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Trigger checkpoint before generation in build mode
    if (mode === "build" && onCheckpoint) {
      Sentry.addBreadcrumb({
        category: 'action',
        message: 'Creating checkpoint before build',
        level: 'info',
        data: { mode }
      });
      onCheckpoint();
    }

    try {
      const chatRequest: ChatRequest = {
        message,
        chatId,
        outputFormat: detectedLanguage,
        mode,
        webSearch,
        ...(mode === "build" && currentPlan
          ? {
              planId: currentPlan.id,
              currentStepIndex: currentPlan.currentStepIndex,
            }
          : {}),
      };

      const response = await withRetry(
        async () => {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chatRequest),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || `HTTP ${res.status}`);
          }

          return res;
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          isRetryable: createFetchRetryPredicate(),
          onRetry: (error, attempt) => {
            toast.error(`Request failed (attempt ${attempt}/3). Retrying...`);
            onTerminalLine?.(`⚠ Request failed: ${error.message}. Retrying (${attempt}/3)...`, "error");
          },
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedExplanation = "";
      let streamedCode = "";
      let accumulatedCode = "";

      if (!reader) {
        throw new Error("No response body");
      }

      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        const messages = sseBuffer.split("\n\n");
        sseBuffer = messages.pop() || "";

        for (const message of messages) {
          if (!message.trim()) continue;

          const lines = message.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (!eventData) continue;

          try {
            const data = JSON.parse(eventData);

            switch (eventType) {
              case "skill-activated":
                setActiveSkill(data.skill);
                setInputStatus("streaming");
                break;

              case "thinking-chunk": {
                const thinkingType = data.thinkingType;
                setInputStatus("streaming");
                setMessages((prev) => {
                  const updated = [...prev];
                  const existingThinking = updated[assistantIndex].thinking || [];
                  const existingIndex = existingThinking.findIndex(
                    (t) => t.thinkingType === thinkingType
                  );

                  const newThinkingItem: ThinkingItem = {
                    content: data.content,
                    thinkingType,
                    isComplete: false,
                  };

                  if (existingIndex >= 0) {
                    existingThinking[existingIndex] = newThinkingItem;
                  } else {
                    existingThinking.push(newThinkingItem);
                  }

                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    thinking: [...existingThinking],
                  };
                  return updated;
                });
                break;
              }

              case "thinking-complete": {
                const thinkingType = data.thinkingType;
                setMessages((prev) => {
                  const updated = [...prev];
                  const existingThinking = updated[assistantIndex].thinking || [];
                  const existingIndex = existingThinking.findIndex(
                    (t) => t.thinkingType === thinkingType
                  );

                  if (existingIndex >= 0) {
                    existingThinking[existingIndex] = {
                      ...existingThinking[existingIndex],
                      isComplete: true,
                    };
                  }

                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    thinking: [...existingThinking],
                  };
                  return updated;
                });
                break;
              }

              case "explanation-chunk":
                streamedExplanation += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    content: streamedExplanation,
                  };
                  return updated;
                });
                break;

              case "code-chunk":
                streamedCode += data.content;
                accumulatedCode += data.content;

                if (data.content.includes("\n") || streamedCode.endsWith("\n")) {
                  setComponentCode(streamedCode);
                }

                const hasCompleteFiles =
                  accumulatedCode.includes("```file:") &&
                  (accumulatedCode.match(/```/g) || []).length >= 2;
                const hasInlineFileMarkers = /(^|\n)file:[^\s]+/.test(accumulatedCode);

                if (hasCompleteFiles || hasInlineFileMarkers) {
                  const parsed = parseProjectOutput(accumulatedCode);
                  if (parsed.type === "project" && parsed.files.length > 0) {
                    setProjectOutput(parsed);
                    // Update workspace in real-time during streaming
                    if (onWorkspaceUpdate) {
                      onWorkspaceUpdate(parsed);
                    }
                  }
                }
                break;

              case "done": {
                if (!chatId) {
                  setChatId(data.chatId);
                }
                const hasCode = typeof data.code === "string" && data.code.trim().length > 0;
                if (hasCode) {
                  setComponentCode(data.code);
                  const parsedOutput = parseProjectOutput(data.code);
                  setProjectOutput(parsedOutput);

                  // Update workspace when code is generated (any mode)
                  if (onWorkspaceUpdate) {
                    onWorkspaceUpdate(parsedOutput);
                  }
                }

                if (mode === "plan" && streamedExplanation && onPlanParsed) {
                  const parsedPlan = parsePlanResponse(streamedExplanation, currentPlan as unknown as ExecutionPlan | null | undefined);
                  onPlanParsed(parsedPlan);
                }

                if (hasCode) {
                  const qualityReport = checkCodeQuality(data.code, detectedLanguage);
                  if (!qualityReport.passed) {
                    const formattedReport = formatQualityReport(qualityReport);
                    console.warn("Code quality issues:", formattedReport);
                  }
                }

                if (data.cost && data.tokens) {
                  setSessionCost({ cost: data.cost, tokens: data.tokens });
                }

                // Add success message to terminal
                onTerminalLine?.("✓ Code generation complete", "success");

                if (data.skill) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      skill: data.skill,
                    };
                    return updated;
                  });
                }
                break;
              }

              case "error":
                onTerminalLine?.(`Error: ${data.error}`, "error");
                throw new Error(data.error);
            }
          } catch (e) {
            console.warn("Failed to parse SSE data:", e, eventData);
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate component";
      Sentry.addBreadcrumb({
        category: 'chat',
        message: 'Chat request failed',
        level: 'error',
        data: { 
          error: errorMessage,
          messageLength: message.length 
        }
      });
      toast.error(errorMessage);
      onTerminalLine?.(`Error: ${errorMessage}`, "error");
      console.error("Error:", error);
      setInputStatus("error");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setTimeout(() => setInputStatus("ready"), 500);
    }
  }, [chatId, messages.length]);

  return {
    messages,
    isLoading,
    chatId,
    inputStatus,
    componentCode,
    projectOutput,
    sessionCost,
    activeSkill,
    sendMessage,
    appendMessage,
    clearMessages,
    setChatId,
    resetChat,
  };
}