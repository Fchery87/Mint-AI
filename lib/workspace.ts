import {
  getLanguageFromPath,
  type ProjectFile,
  type ProjectOutput,
} from './project-types';
import { getDefaultFilename } from './preview-support';

export type WorkspaceFiles = Record<string, string>;

export type WorkspaceMode = 'single' | 'project';

export interface WorkspaceCheckpoint {
  id: string;
  label: string;
  createdAt: number;
  files: WorkspaceFiles;
  activePath: string;
}

export interface WorkspaceState {
  version: 1;
  mode: WorkspaceMode;
  projectName: string;
  activePath: string;
  files: WorkspaceFiles;
  baseFiles: WorkspaceFiles | null;
  checkpoints: WorkspaceCheckpoint[];
  updatedAt: number;
}

export interface PendingChange {
  path: string;
  content: string;
  language: string;
  originalContent?: string;
  status: 'new' | 'modified';
}

export function createPendingChange(
  path: string,
  content: string,
  language: string,
  workspace: WorkspaceState | null
): PendingChange {
  const originalContent = workspace?.files[path];
  return {
    path,
    content,
    language,
    originalContent,
    status: originalContent ? 'modified' : 'new',
  };
}

export function workspaceFromProjectOutput(
  output: ProjectOutput
): WorkspaceState {
  const isProject = output.type === 'project';
  const files: WorkspaceFiles = {};

  if (isProject) {
    for (const file of output.files) files[file.path] = file.content;
  } else {
    const single = output.files[0];
    files[single?.path || 'output.txt'] = single?.content || '';
  }

  const paths = Object.keys(files);
  const activePath = paths[0] || 'output.txt';

  return {
    version: 1,
    mode: isProject ? 'project' : 'single',
    projectName: output.name || (isProject ? 'project' : 'component'),
    activePath,
    files,
    baseFiles: { ...files },
    checkpoints: [],
    updatedAt: Date.now(),
  };
}

export function workspaceFromSingleFile(
  content: string,
  language: string,
  filename?: string
): WorkspaceState {
  const path = filename || getDefaultFilename(language);
  const files: WorkspaceFiles = { [path]: content || '' };

  return {
    version: 1,
    mode: 'single',
    projectName: 'component',
    activePath: path,
    files,
    baseFiles: { ...files },
    checkpoints: [],
    updatedAt: Date.now(),
  };
}

export function workspaceToProjectFiles(files: WorkspaceFiles): ProjectFile[] {
  return Object.entries(files).map(([path, content]) => ({
    path,
    content,
    language: getLanguageFromPath(path),
  }));
}

export function cloneFiles(files: WorkspaceFiles): WorkspaceFiles {
  return { ...files };
}

export function generateCheckpointId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createCheckpoint(
  workspace: WorkspaceState,
  label: string
): WorkspaceCheckpoint {
  return {
    id: generateCheckpointId(),
    label: label.trim() || 'Checkpoint',
    createdAt: Date.now(),
    files: cloneFiles(workspace.files),
    activePath: workspace.activePath,
  };
}

export function getLanguageForPath(path: string): string {
  return getLanguageFromPath(path);
}
