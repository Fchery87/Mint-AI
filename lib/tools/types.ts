/**
 * Tool Layer Types
 * 
 * Defines the core abstractions for the tool system that separates
 * read-only tools (Plan mode) from read-write tools (Build mode).
 */

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Tool definition
 */
export interface Tool {
  /** Tool name */
  name: string;
  /** Tool description for the model */
  description: string;
  /** Tool type - determines mode availability */
  type: 'read-only' | 'read-write';
  /** JSON schema for tool parameters */
  parameters: Record<string, unknown>;
  /** Execute the tool */
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

/**
 * Tool call from the model
 */
export interface ToolCall {
  /** Tool name */
  tool: string;
  /** Tool arguments */
  args: Record<string, unknown>;
  /** Unique call ID */
  callId: string;
}

/**
 * Tool registry - maps tool names to tool implementations
 */
export type ToolRegistry = Record<string, Tool>;

/**
 * Available tools based on mode
 */
export function getAvailableTools(
  allTools: ToolRegistry,
  mode: 'plan' | 'build'
): ToolRegistry {
  if (mode === 'plan') {
    // In plan mode, only read-only tools are available
    return Object.entries(allTools).reduce((acc, [name, tool]) => {
      if (tool.type === 'read-only') {
        acc[name] = tool;
      }
      return acc;
    }, {} as ToolRegistry);
  }
  // In build mode, all tools are available
  return allTools;
}

/**
 * Check if a tool is allowed in the given mode
 */
export function isToolAllowed(tool: Tool, mode: 'plan' | 'build'): boolean {
  if (mode === 'plan') {
    return tool.type === 'read-only';
  }
  return true;
}
