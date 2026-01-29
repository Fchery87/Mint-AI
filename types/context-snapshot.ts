/**
 * Context snapshot sent with every chat request
 * Captures current IDE/editor state
 */

export interface EditorContext {
  /** Currently active file path */
  activeFilePath: string | null;
  /** Content of active file (optional, for small files) */
  activeFileContent?: string;
  /** Cursor/selection position */
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface WorkspaceContext {
  /** Unique workspace identifier */
  workspaceId: string;
  /** List of open file paths */
  openFiles: string[];
  /** Project name */
  projectName?: string;
  /** Root directory path */
  rootPath?: string;
}

export interface ContextSnapshot {
  /** Editor context - current file, cursor, selection */
  editor: EditorContext;
  /** Workspace context - open files, project info */
  workspace: WorkspaceContext;
  /** Current mode: plan or build */
  mode: 'plan' | 'build';
  /** Reference to approved plan when in build mode */
  planId?: string;
  /** Current step index when executing a plan */
  currentStepIndex?: number;
  /** Timestamp of snapshot */
  timestamp: number;
}
