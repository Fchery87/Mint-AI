/**
 * Streaming Types
 *
 * Defines the event types and interfaces for streaming responses
 * following the "thinking UI" / "stream-of-thought" pattern.
 */

export type StreamEventType =
  | 'thinking'      // Reasoning/thinking content
  | 'tool'          // Tool execution
  | 'text'          // Regular response text
  | 'code'          // Code blocks
  | 'progress'      // Progress updates
  | 'done'          // Stream complete
  | 'error';        // Error occurred

export interface StreamEvent {
  type: StreamEventType;
  data: any;
  timestamp: number;
}

export interface ThinkingEventData {
  thinkingType: string;        // e.g., 'requirements', 'architecture', 'components'
  content: string;             // The thinking content
  isComplete: boolean;         // Is this thinking block done
}

export interface ToolEventData {
  toolName: string;            // e.g., 'list_files', 'read_file', 'web_search'
  status: 'started' | 'running' | 'complete' | 'error';
  message?: string;            // Human-readable status message
  result?: any;                // Tool result (if complete)
}

export interface ProgressEventData {
  stage: string;               // Current stage: 'analyzing', 'planning', 'coding', 'testing'
  message: string;             // Progress message
  percent?: number;            // Optional percentage (0-100)
}

export interface TextEventData {
  content: string;             // Text chunk
  isCode: boolean;             // Is this inside a code block
  language?: string;           // Code language if isCode
}

export interface DoneEventData {
  totalDuration: number;       // Total response time in ms
  tokenCount: number;          // Total tokens generated
  toolCalls: number;           // Number of tool calls made
}

/**
 * SSE Format Helpers
 */
export function formatSSE(eventType: StreamEventType, data: any): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function parseSSE(line: string): { event?: string; data?: string } | null {
  if (line.startsWith('event: ')) {
    return { event: line.slice(7).trim() };
  }
  if (line.startsWith('data: ')) {
    return { data: line.slice(6).trim() };
  }
  return null;
}
