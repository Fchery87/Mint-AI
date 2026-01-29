/**
 * Read-Only Tools
 * 
 * Tools that can be used in both Plan and Build modes.
 * These tools only read from the workspace and never modify files.
 */

import type { Tool, ToolResult } from './types';

/**
 * Read file content
 */
export const readFileTool: Tool = {
  name: 'readFile',
  description: 'Read the content of a file at the given path',
  type: 'read-only',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
    },
    required: ['path'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { path } = args;
      // Implementation will use workspace access
      return {
        success: true,
        data: { path, content: '' }, // Placeholder
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  },
};

/**
 * List files in directory
 */
export const listFilesTool: Tool = {
  name: 'listFiles',
  description: 'List files in a directory',
  type: 'read-only',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path' },
      recursive: { type: 'boolean', description: 'List recursively' },
    },
    required: ['path'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { path, recursive = false } = args;
      return {
        success: true,
        data: { path, files: [], recursive },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  },
};

/**
 * Search codebase
 */
export const searchCodebaseTool: Tool = {
  name: 'searchCodebase',
  description: 'Search the codebase for patterns or symbols',
  type: 'read-only',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      filePattern: { type: 'string', description: 'File pattern (e.g., *.ts)' },
    },
    required: ['query'],
  },
  execute: async (args): Promise<ToolResult> => {
    try {
      const { query, filePattern } = args;
      return {
        success: true,
        data: { query, filePattern, results: [] },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
};

/**
 * Get project structure
 */
export const getProjectStructureTool: Tool = {
  name: 'getProjectStructure',
  description: 'Get the overall project structure and key files',
  type: 'read-only',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (): Promise<ToolResult> => {
    try {
      return {
        success: true,
        data: { structure: {} },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get structure',
      };
    }
  },
};

/**
 * All read-only tools
 */
export const readOnlyTools: Record<string, Tool> = {
  readFile: readFileTool,
  listFiles: listFilesTool,
  searchCodebase: searchCodebaseTool,
  getProjectStructure: getProjectStructureTool,
};
