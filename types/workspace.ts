/**
 * Mint AI Workspace Types
 *
 * Defines types for workspace state, files, checkpoints, and pending changes.
 */

/**
 * Workspace mode - single file or multi-file project
 */
export type WorkspaceMode = 'single' | 'project';

/**
 * Record of file paths to their content
 */
export type WorkspaceFiles = Record<string, string>;

/**
 * A workspace checkpoint for versioning/rollback
 */
export interface WorkspaceCheckpoint {
  /** Unique checkpoint ID */
  id: string;
  /** Human-readable label for the checkpoint */
  label: string;
  /** Timestamp when checkpoint was created */
  createdAt: number;
  /** Snapshot of files at this checkpoint */
  files: WorkspaceFiles;
  /** Active file path at this checkpoint */
  activePath: string;
}

/**
 * The complete workspace state
 */
export interface WorkspaceState {
  /** Version for migration/compatibility */
  version: 1;
  /** Current workspace mode */
  mode: WorkspaceMode;
  /** Project name */
  projectName: string;
  /** Currently active/open file path */
  activePath: string;
  /** All files in the workspace */
  files: WorkspaceFiles;
  /** Base files snapshot for revert operations */
  baseFiles: WorkspaceFiles | null;
  /** List of saved checkpoints */
  checkpoints: WorkspaceCheckpoint[];
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Status of a pending change
 */
export type PendingChangeStatus = 'new' | 'modified';

/**
 * A pending change waiting for user approval
 */
export interface PendingChange {
  /** File path */
  path: string;
  /** New content */
  content: string;
  /** Language of the file */
  language: string;
  /** Original content (if modifying existing file) */
  originalContent?: string;
  /** Whether this is a new file or modification */
  status: PendingChangeStatus;
}
