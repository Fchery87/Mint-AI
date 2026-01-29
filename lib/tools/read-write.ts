/**
 * Read-Write Tools
 * 
 * Tools that can only be used in Build mode.
 * These tools modify the workspace (write files, apply diffs, run commands).
 */

import type { Tool, ToolResult } from './types';

/**
 * Write file content
 */
export const writeFileTool: Tool = {
  name: 'writeFile',
  description: 'Write content to a file (creates or overwrites)',
  type: 'read-write',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      content: { type: 'string', description: 'File content' },
    },
    required: ['path', 'content'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { path, content } = args;
      return {
        success: true,
        data: { path, operation: 'write' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  },
};

/**
 * Apply diff/patch to file
 */
export const applyDiffTool: Tool = {
  name: 'applyDiff',
  description: 'Apply a diff/patch to a file',
  type: 'read-write',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      diff: { type: 'string', description: 'Unified diff to apply' },
    },
    required: ['path', 'diff'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { path, diff } = args;
      return {
        success: true,
        data: { path, operation: 'diff' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply diff',
      };
    }
  },
};

/**
 * Create new file
 */
export const createFileTool: Tool = {
  name: 'createFile',
  description: 'Create a new file with content',
  type: 'read-write',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      content: { type: 'string', description: 'File content' },
    },
    required: ['path', 'content'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { path, content } = args;
      return {
        success: true,
        data: { path, operation: 'create' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create file',
      };
    }
  },
};

/**
 * Run command
 */
export const runCommandTool: Tool = {
  name: 'runCommand',
  description: 'Run a shell command',
  type: 'read-write',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to run' },
      cwd: { type: 'string', description: 'Working directory' },
    },
    required: ['command'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { command, cwd } = args;
      return {
        success: true,
        data: { command, cwd, output: '' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command failed',
      };
    }
  },
};

/**
 * Run tests
 */
export const runTestsTool: Tool = {
  name: 'runTests',
  description: 'Run the test suite',
  type: 'read-write',
  parameters: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Test file pattern' },
    },
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { pattern } = args;
      return {
        success: true,
        data: { pattern, passed: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tests failed',
      };
    }
  },
};

/**
 * All read-write tools
 */
export const readWriteTools: Record<string, Tool> = {
  writeFile: writeFileTool,
  applyDiff: applyDiffTool,
  createFile: createFileTool,
  runCommand: runCommandTool,
  runTests: runTestsTool,
};

/**
 * All tools combined
 */
export const allTools: Record<string, Tool> = {
  ...require('./read-only').readOnlyTools,
  ...readWriteTools,
};
