/**
 * Mint AI Chat Types
 *
 * Defines types for chat messages, requests, and responses.
 */

import type { SkillType } from './skill';

/**
 * A single thinking item representing the AI's reasoning process
 */
export interface ThinkingItem {
  /** The thinking content/reasoning text */
  content: string;
  /** The type of thinking (e.g., 'requirements', 'architecture', 'edgecases') */
  thinkingType: string;
  /** Whether this thinking item is complete */
  isComplete: boolean;
}

/**
 * A tool execution item showing tool usage in the chat
 */
export interface ToolItem {
  /** Name of the tool being executed */
  toolName: string;
  /** Current status of the tool execution */
  status: 'starting' | 'running' | 'complete' | 'error';
  /** Optional status message */
  message?: string;
}

/**
 * A chat message from either the user or assistant
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Optional thinking/reasoning blocks */
  thinking?: ThinkingItem[];
  /** Optional tool execution items */
  tools?: ToolItem[];
  /** Optional tool results as string */
  toolResults?: string;
  /** Optional skill information */
  skill?: {
    type: SkillType;
    stage: string;
  };
}

/**
 * Request body for chat API
 */
export interface ChatRequest {
  /** The user's message */
  message: string;
  /** Optional chat ID for continuing a conversation */
  chatId?: string;
  /** Optional output format (e.g., 'React', 'Vue', 'Python') */
  outputFormat?: string;
  /** Interaction mode: 'plan' for planning, 'build' for execution */
  mode?: 'plan' | 'build';
  /** Whether to enable web search */
  webSearch?: boolean;
  /** Optional: force a specific skill */
  forceSkill?: string;
  /** Plan ID for Build mode context */
  planId?: string;
  /** Current step index for Build mode */
  currentStepIndex?: number;
}

/**
 * Response from chat API (non-streaming)
 */
export interface ChatResponse {
  /** Response ID */
  id: string;
  /** Generated code */
  code: string;
  /** Response message */
  message: string;
}
