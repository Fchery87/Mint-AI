/**
 * SSE Streaming Parser
 *
 * State machine-based parser for Server-Sent Events (SSE) streaming responses.
 * Handles parsing of AI-generated content with thinking tags, code blocks,
 * and file markers.
 */

import { SkillType } from '@/types/skill';

// ============================================================================
// Types
// ============================================================================

export interface SSEParseState {
  /** Accumulated buffer content */
  buffer: string;
  /** Whether currently inside a code block */
  inCodeBlock: boolean;
  /** Whether currently inside a thinking block */
  inThinkingBlock: boolean;
  /** Current thinking type (e.g., 'requirements', 'architecture') */
  thinkingType: string | null;
  /** Whether waiting for a file marker after code block start */
  pendingFileMarker: boolean;
}

export type SSEEvent =
  | { type: 'skill-activated'; skill: { type: SkillType; stage: string; confidence: number } }
  | { type: 'thinking-chunk'; thinkingType: string; content: string }
  | { type: 'thinking-complete'; thinkingType: string }
  | { type: 'explanation-chunk'; content: string }
  | { type: 'code-chunk'; content: string }
  | { type: 'file-marker'; marker: string }
  | { type: 'tool-call'; tool: string; args: Record<string, unknown>; callId: string }
  | { type: 'tool-result'; callId: string; result: unknown; error?: string }
  | { type: 'file-diff'; path: string; before: string; after: string }
  | { type: 'progress'; taskId: string; status: 'started' | 'completed' | 'failed'; message?: string }
  | { type: 'command-output'; command: string; output: string; exitCode: number }
  | { type: 'done' }
  | { type: 'error'; error: string };

export interface SSEParseResult {
  /** Events generated from this chunk */
  events: SSEEvent[];
  /** Updated state after processing */
  newState: SSEParseState;
}

// ============================================================================
// Constants
// ============================================================================

const THINKING_START_REGEX = /<thinking\s+type="([^"]+)">/;
const THINKING_END_TAG = '</thinking>';
const CODE_BLOCK_MARKER = '```';
const FILE_MARKER_PREFIX = 'file:';
const MIN_CHUNK_SIZE = 20;
const THINKING_TAG_MAX_LENGTH = 12; // </thinking> is 11 chars

// ============================================================================
// State Factory
// ============================================================================

/**
 * Create a fresh parse state
 */
export function createParseState(): SSEParseState {
  return {
    buffer: '',
    inCodeBlock: false,
    inThinkingBlock: false,
    thinkingType: null,
    pendingFileMarker: false,
  };
}

// ============================================================================
// State Machine Parser
// ============================================================================

/**
 * Parse an SSE chunk and generate events
 * Uses a state machine pattern for robust handling of partial content
 */
export function parseSSEChunk(
  chunk: string,
  state: SSEParseState
): SSEParseResult {
  const events: SSEEvent[] = [];
  let buffer = state.buffer + chunk;
  let inCodeBlock = state.inCodeBlock;
  let inThinkingBlock = state.inThinkingBlock;
  let thinkingType = state.thinkingType;
  let pendingFileMarker = state.pendingFileMarker;

  // Process buffer until no more complete patterns can be extracted
  while (buffer.length > 0) {
    // State: Inside thinking block
    if (inThinkingBlock && thinkingType) {
      const result = processThinkingBlock(
        buffer,
        thinkingType,
        events
      );

      if (result.consumed) {
        buffer = result.remainingBuffer;
        if (result.complete) {
          inThinkingBlock = false;
          thinkingType = null;
        }
        continue;
      }
      break; // Need more data
    }

    // State: Inside code block
    if (inCodeBlock) {
      const result = processCodeBlock(buffer, pendingFileMarker, events);

      if (result.consumed) {
        buffer = result.remainingBuffer;
        inCodeBlock = !result.codeBlockEnded;
        pendingFileMarker = result.pendingFileMarker ?? false;
        continue;
      }
      break; // Need more data
    }

    // State: Outside any block - look for start markers
    const thinkingStartMatch = buffer.match(THINKING_START_REGEX);
    const codeBlockIndex = buffer.indexOf(CODE_BLOCK_MARKER);

    // Check for thinking start tag
    if (thinkingStartMatch && thinkingStartMatch.index !== undefined) {
      const beforeThinking = buffer.substring(0, thinkingStartMatch.index);

      // Send any text before thinking tag as explanation
      if (beforeThinking.trim()) {
        events.push({
          type: 'explanation-chunk',
          content: beforeThinking,
        });
      }

      // Transition to thinking state
      buffer = buffer.substring(
        thinkingStartMatch.index + thinkingStartMatch[0].length
      );
      thinkingType = thinkingStartMatch[1];
      inThinkingBlock = true;
      continue;
    }

    // Check for code block start
    if (codeBlockIndex !== -1) {
      const beforeCode = buffer.substring(0, codeBlockIndex);

      // Send any text before code block as explanation
      if (beforeCode.trim()) {
        events.push({
          type: 'explanation-chunk',
          content: beforeCode,
        });
      }

      // Transition to code block state
      buffer = buffer.substring(codeBlockIndex + CODE_BLOCK_MARKER.length);
      inCodeBlock = true;
      pendingFileMarker = true; // Expect file marker after ```
      continue;
    }

    // No complete patterns found - check if we should flush buffer
    const flushResult = processPlainText(buffer);
    if (flushResult.consumed) {
      if (flushResult.content) {
        events.push({
          type: 'explanation-chunk',
          content: flushResult.content,
        });
      }
      buffer = flushResult.remainingBuffer;
      continue;
    }

    break; // Need more data
  }

  return {
    events,
    newState: {
      buffer,
      inCodeBlock,
      inThinkingBlock,
      thinkingType,
      pendingFileMarker,
    },
  };
}

// ============================================================================
// State Handlers
// ============================================================================

interface ProcessResult {
  consumed: boolean;
  remainingBuffer: string;
  complete?: boolean;
  codeBlockEnded?: boolean;
  pendingFileMarker?: boolean;
}

interface PlainTextResult {
  consumed: boolean;
  content: string;
  remainingBuffer: string;
}

/**
 * Process content inside a thinking block
 */
function processThinkingBlock(
  buffer: string,
  thinkingType: string,
  events: SSEEvent[]
): ProcessResult {
  const endTagIndex = buffer.indexOf(THINKING_END_TAG);

  // Complete thinking block found
  if (endTagIndex !== -1) {
    const content = buffer.substring(0, endTagIndex);

    if (content.trim()) {
      events.push({
        type: 'thinking-chunk',
        thinkingType,
        content,
      });
    }

    events.push({
      type: 'thinking-complete',
      thinkingType,
    });

    return {
      consumed: true,
      remainingBuffer: buffer.substring(endTagIndex + THINKING_END_TAG.length),
      complete: true,
    };
  }

  // Check for potential partial closing tag - hold back if incomplete
  const potentialCloseIndex = buffer.lastIndexOf('<');
  const hasPartialCloseTag =
    potentialCloseIndex !== -1 &&
    potentialCloseIndex > buffer.length - THINKING_TAG_MAX_LENGTH &&
    !buffer.includes('>', potentialCloseIndex);

  // Check if we have enough content to send
  const shouldFlush =
    buffer.length > MIN_CHUNK_SIZE ||
    buffer.includes('\n') ||
    buffer.endsWith('. ');

  if (!shouldFlush || buffer.length <= THINKING_TAG_MAX_LENGTH - 1) {
    return { consumed: false, remainingBuffer: buffer };
  }

  // Extract safe content (before any potential partial tag)
  let contentToSend = buffer;
  let remainingBuffer = '';

  if (potentialCloseIndex !== -1 && potentialCloseIndex > 0) {
    const afterLt = buffer.substring(potentialCloseIndex);
    // Check if this looks like the start of </thinking>
    if (afterLt.startsWith('</') || afterLt === '<') {
      contentToSend = buffer.substring(0, potentialCloseIndex);
      remainingBuffer = buffer.substring(potentialCloseIndex);
    }
  }

  if (contentToSend.trim()) {
    events.push({
      type: 'thinking-chunk',
      thinkingType,
      content: contentToSend,
    });
  }

  return {
    consumed: true,
    remainingBuffer,
    complete: false,
  };
}

/**
 * Process content inside a code block
 */
function processCodeBlock(
  buffer: string,
  pendingFileMarker: boolean,
  events: SSEEvent[]
): ProcessResult {
  // Handle pending file marker (immediately after opening ```)
  if (pendingFileMarker) {
    const newlineIndex = buffer.indexOf('\n');

    if (newlineIndex !== -1) {
      const firstLine = buffer.substring(0, newlineIndex).trim();

      // Check if first line is a file marker
      if (firstLine.startsWith(FILE_MARKER_PREFIX)) {
        // File marker found - emit event and consume it
        events.push({
          type: 'file-marker',
          marker: firstLine,
        });
        buffer = buffer.substring(newlineIndex + 1);
        pendingFileMarker = false;
        // Continue processing the rest as code
      } else if (firstLine === '') {
        // Empty first line - check second line
        const secondNewlineIndex = buffer.indexOf('\n', newlineIndex + 1);
        if (secondNewlineIndex !== -1) {
          const secondLine = buffer
            .substring(newlineIndex + 1, secondNewlineIndex)
            .trim();
          if (secondLine.startsWith(FILE_MARKER_PREFIX)) {
            // File marker on second line - emit event
            events.push({
              type: 'file-marker',
              marker: secondLine,
            });
            buffer = buffer.substring(secondNewlineIndex + 1);
            pendingFileMarker = false;
          } else {
            // No file marker
            pendingFileMarker = false;
          }
        } else {
          // Need more data to determine
          return { consumed: false, remainingBuffer: buffer, pendingFileMarker: true };
        }
      } else {
        // No file marker
        pendingFileMarker = false;
      }
    } else {
      // Need more data to check for file marker
      return { consumed: false, remainingBuffer: buffer, pendingFileMarker: true };
    }
  }

  // Look for code block end
  const endIndex = buffer.indexOf(CODE_BLOCK_MARKER);

  if (endIndex !== -1) {
    const code = buffer.substring(0, endIndex);

    if (code) {
      events.push({
        type: 'code-chunk',
        content: code,
      });
    }

    return {
      consumed: true,
      remainingBuffer: buffer.substring(endIndex + CODE_BLOCK_MARKER.length),
      codeBlockEnded: true,
      pendingFileMarker: false,
    };
  }

  // No end marker yet - check if we should flush some content
  if (buffer.length > MIN_CHUNK_SIZE || buffer.includes('\n')) {
    events.push({
      type: 'code-chunk',
      content: buffer,
    });

    return {
      consumed: true,
      remainingBuffer: '',
      codeBlockEnded: false,
      pendingFileMarker: false,
    };
  }

  return {
    consumed: false,
    remainingBuffer: buffer,
    pendingFileMarker: false,
  };
}

/**
 * Process plain text (outside any block)
 */
function processPlainText(buffer: string): PlainTextResult {
  // Check for potential partial tags that we should hold back
  const potentialTagIndex = buffer.indexOf('<');
  const potentialCodeIndex = buffer.indexOf('`');

  const hasCompletePotentialTag =
    potentialTagIndex === -1 ||
    (potentialTagIndex !== -1 && buffer.includes('>', potentialTagIndex));

  // Check for partial code block (1-2 backticks at end)
  const hasPartialCodeBlock =
    (buffer.endsWith('`') && !buffer.endsWith('```')) ||
    (buffer.endsWith('``') && !buffer.endsWith('```'));

  // If buffer contains full ``` we should have processed it above
  const hasFullCodeBlock = buffer.includes('```');

  if (hasFullCodeBlock) {
    // This shouldn't happen if logic is correct, but handle it
    return {
      consumed: false,
      content: '',
      remainingBuffer: buffer,
    };
  }

  // Check if we have enough content to flush
  const shouldFlush =
    buffer.length > MIN_CHUNK_SIZE || buffer.includes('\n');

  if (shouldFlush && hasCompletePotentialTag && !hasPartialCodeBlock) {
    return {
      consumed: true,
      content: buffer,
      remainingBuffer: '',
    };
  }

  // Handle partial tag - send safe content, keep potential tag
  if (potentialTagIndex !== -1 && potentialTagIndex > 0 && !hasCompletePotentialTag) {
    const safeContent = buffer.substring(0, potentialTagIndex);
    return {
      consumed: true,
      content: safeContent.trim() ? safeContent : '',
      remainingBuffer: buffer.substring(potentialTagIndex),
    };
  }

  // Handle partial code block
  if (potentialCodeIndex !== -1 && potentialCodeIndex > 0 && buffer.length - potentialCodeIndex < 3) {
    const safeContent = buffer.substring(0, potentialCodeIndex);
    return {
      consumed: true,
      content: safeContent.trim() ? safeContent : '',
      remainingBuffer: buffer.substring(potentialCodeIndex),
    };
  }

  return {
    consumed: false,
    content: '',
    remainingBuffer: buffer,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Flush any remaining content in the buffer as the final event
 */
export function flushParseState(state: SSEParseState): SSEEvent[] {
  const events: SSEEvent[] = [];

  if (!state.buffer.trim()) {
    return events;
  }

  if (state.inCodeBlock) {
    events.push({
      type: 'code-chunk',
      content: state.buffer,
    });
  } else if (state.inThinkingBlock && state.thinkingType) {
    events.push({
      type: 'thinking-chunk',
      thinkingType: state.thinkingType,
      content: state.buffer,
    });
    events.push({
      type: 'thinking-complete',
      thinkingType: state.thinkingType,
    });
  } else {
    events.push({
      type: 'explanation-chunk',
      content: state.buffer,
    });
  }

  return events;
}

/**
 * Format an SSE event for transmission
 */
export function formatSSEEvent(eventType: string, data: Record<string, unknown>): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}
