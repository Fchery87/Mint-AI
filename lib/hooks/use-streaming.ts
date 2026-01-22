'use client';

import { useState, useRef, useCallback } from 'react';
import { SkillType } from '@/types/skill';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type StreamEventType =
  | 'skill'
  | 'progress'
  | 'thinking'
  | 'tool'
  | 'text'
  | 'code'
  | 'done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data: any;
}

export interface ThinkingItem {
  thinkingType: string;
  content: string;
  isComplete: boolean;
}

export interface ToolItem {
  toolName: string;
  status: 'starting' | 'running' | 'complete' | 'error';
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: ThinkingItem[];
  tools?: ToolItem[];
  skill?: { type: SkillType; stage: string };
}

export interface UseChatStreamOptions {
  onSendMessage: (message: string) => Promise<Response>;
  onError?: (error: Error) => void;
}

export interface UseChatStreamReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  activeSkill: { type: SkillType; stage: string } | null;
  progress: { stage: string; message: string; percent?: number } | null;
  sendMessage: (message: string) => Promise<void>;
  abort: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useChatStream({
  onSendMessage,
  onError,
}: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState<{
    type: SkillType;
    stage: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    stage: string;
    message: string;
    percent?: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      // Add user message
      const userMessage: ChatMessage = { role: 'user', content: message };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setActiveSkill(null);
      setProgress(null);

      // Create placeholder for assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        thinking: [],
        tools: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();
        const response = await onSendMessage(message);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';
        let currentThinking: ThinkingItem | null = null;
        let currentTool: ToolItem | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for event: lines
            if (!line.startsWith('event: ')) continue;

            const eventType = line.slice(7).trim();

            // Find the data: line that follows
            let dataLine = '';
            let dataIndex = i + 1;
            while (
              dataIndex < lines.length &&
              !lines[dataIndex].startsWith('data: ')
            ) {
              dataIndex++;
            }
            if (dataIndex >= lines.length) continue;

            dataLine = lines[dataIndex];
            if (!dataLine.startsWith('data: ')) continue;

            // Skip processed lines
            i = dataIndex;

            try {
              const data = JSON.parse(dataLine.slice(6));
              const event: StreamEvent = {
                type: eventType as StreamEventType,
                data,
              };

              switch (event.type) {
                case 'skill':
                  setActiveSkill({ type: data.type, stage: data.stage });
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      skill: data,
                    };
                    return updated;
                  });
                  break;

                case 'progress':
                  setProgress({
                    stage: data.stage,
                    message: data.message,
                    percent: data.percent,
                  });
                  break;

                case 'thinking':
                  // Handle thinking completion event (isComplete: true with no/empty content)
                  if (data.isComplete) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      const thinking = lastMsg.thinking || [];
                      const existingIndex = thinking.findIndex(
                        (t) => t.thinkingType === data.thinkingType,
                      );

                      if (existingIndex >= 0) {
                        thinking[existingIndex] = {
                          ...thinking[existingIndex],
                          isComplete: true,
                        };
                      } else {
                        // Create new thinking item marked as complete
                        thinking.push({
                          thinkingType: data.thinkingType,
                          content: data.content || '',
                          isComplete: true,
                        });
                      }

                      updated[updated.length - 1] = { ...lastMsg, thinking };
                      return updated;
                    });
                    currentThinking = null;
                    break;
                  }

                  // Handle normal thinking content events
                  if (
                    !currentThinking ||
                    currentThinking.thinkingType !== data.thinkingType
                  ) {
                    // Complete previous thinking if any
                    if (currentThinking) {
                      setMessages((prev) => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        const thinking = lastMsg.thinking || [];
                        const existingIndex = thinking.findIndex(
                          (t) =>
                            t.thinkingType === currentThinking!.thinkingType,
                        );

                        if (existingIndex >= 0) {
                          thinking[existingIndex] = {
                            ...thinking[existingIndex],
                            isComplete: true,
                          };
                        }

                        updated[updated.length - 1] = { ...lastMsg, thinking };
                        return updated;
                      });
                    }
                    currentThinking = {
                      thinkingType: data.thinkingType,
                      content: data.content || '',
                      isComplete: false,
                    };
                  } else {
                    currentThinking.content += data.content || '';
                  }
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    const thinking = lastMsg.thinking || [];
                    const existingIndex = thinking.findIndex(
                      (t) => t.thinkingType === data.thinkingType,
                    );

                    if (existingIndex >= 0) {
                      thinking[existingIndex] = currentThinking!;
                    } else {
                      thinking.push(currentThinking!);
                    }

                    updated[updated.length - 1] = { ...lastMsg, thinking };
                    return updated;
                  });
                  break;

                case 'tool':
                  currentTool = {
                    toolName: data.toolName,
                    status: data.status,
                    message: data.message,
                  };
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    const tools = lastMsg.tools || [];
                    const existingIndex = tools.findIndex(
                      (t) =>
                        t.toolName === data.toolName && t.status !== 'complete',
                    );

                    if (existingIndex >= 0) {
                      tools[existingIndex] = currentTool!;
                    } else {
                      tools.push(currentTool!);
                    }

                    updated[updated.length - 1] = { ...lastMsg, tools };
                    return updated;
                  });
                  break;

                case 'text':
                  assistantContent += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: assistantContent,
                    };
                    return updated;
                  });
                  break;

                case 'done':
                  setProgress(null);
                  setIsLoading(false);
                  break;

                case 'error':
                  throw new Error(data.error);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        onError?.(err);
        setIsLoading(false);
        // Remove assistant placeholder on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [isLoading, onSendMessage, onError],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setProgress(null);
  }, []);

  return {
    messages,
    isLoading,
    activeSkill,
    progress,
    sendMessage,
    abort,
  };
}
