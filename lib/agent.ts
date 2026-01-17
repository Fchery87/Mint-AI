import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

interface FileDoc {
  _id: Doc<'files'>['_id'];
  _creationTime: number;
  updatedAt: number;
  workspaceId: Doc<'files'>['workspaceId'];
  path: string;
  content: string;
  language: string;
}

/**
 * Agent Tool Definitions
 */
export interface ToolAction {
  name: string;
  arguments: any;
}

/**
 * Checks if running in a server-side environment (required for Convex)
 */
function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * Executes a tool action against the Convex backend
 */
export async function executeTool(
  workspaceId: string,
  tool: ToolAction
): Promise<string> {
  if (!isServerSide()) {
    return 'Error: Convex operations can only be performed on the server side';
  }

  const wsId = workspaceId as Doc<'workspaces'>['_id'];

  switch (tool.name) {
    case 'list_files': {
      const files = await fetchQuery(api.workspaces.listFiles, {
        workspaceId: wsId,
      });
      return (
        files.map((f: FileDoc) => `- ${f.path} (${f.language})`).join('\n') ||
        'No files in workspace.'
      );
    }

    case 'read_file': {
      const path = tool.arguments.path;
      const files = await fetchQuery(api.workspaces.listFiles, {
        workspaceId: wsId,
      });
      const file = files.find((f: FileDoc) => f.path === path);
      return file ? file.content : `Error: File not found at ${path}`;
    }

    case 'write_file': {
      const { path, content, language } = tool.arguments;
      await fetchMutation(api.workspaces.upsertFile, {
        workspaceId: wsId,
        path,
        content,
        language: language || 'text',
      });
      return `Successfully wrote to ${path}`;
    }

    case 'run_command': {
      // In a real browser environment, this would execute in Sandpack/Pyodide
      // For now, we return a stub indicating the command was received.
      return `Command received: "${tool.arguments.command}". Note: Preview execution happens in the UI.`;
    }

    default:
      return `Error: Unknown tool "${tool.name}"`;
  }
}

/**
 * Parses tool calls from the LLM response
 * Expected format: <tool_call name="tool_name">{"arg": "val"}</tool_call>
 */
export function parseToolCalls(text: string): ToolAction[] {
  const pattern = /<tool_call name="([^"]+)">([\s\S]*?)<\/tool_call>/g;
  const matches = Array.from(text.matchAll(pattern));

  return matches.map((match) => {
    try {
      return {
        name: match[1],
        arguments: JSON.parse(match[2].trim()),
      };
    } catch (e) {
      return {
        name: match[1],
        arguments: { raw: match[2].trim() },
      };
    }
  });
}
