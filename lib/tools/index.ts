/**
 * Tool Registry
 * 
 * Central registry for all tools with mode-based filtering.
 */

import { readOnlyTools } from './read-only';
import { readWriteTools } from './read-write';
import type { ToolRegistry } from './types';

/**
 * All available tools
 */
export const allTools: ToolRegistry = {
  ...readOnlyTools,
  ...readWriteTools,
};

/**
 * Get tools available for a specific mode
 */
export function getToolsForMode(mode: 'plan' | 'build'): ToolRegistry {
  if (mode === 'plan') {
    return readOnlyTools;
  }
  return allTools;
}

/**
 * Export individual tool categories
 */
export { readOnlyTools, readWriteTools };
export * from './types';
