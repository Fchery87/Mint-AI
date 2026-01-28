/**
 * useWorkspace Hook
 *
 * Manages workspace state, file operations, checkpoints, and persistence.
 * Extracted from page.tsx to separate workspace concerns from UI.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { WorkspaceState, PendingChange } from "@/types/workspace";
import type { ProjectOutput } from "@/lib/project-types";
import {
  createCheckpoint,
  workspaceFromProjectOutput,
  workspaceFromSingleFile,
} from "@/lib/workspace";
import {
  clearWorkspace as clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/workspace-storage";
import { detectLanguage } from "@/lib/language-detection";

export interface UseWorkspaceReturn {
  workspace: WorkspaceState | null;
  draftWorkspace: WorkspaceState | null;
  pendingChanges: Record<string, PendingChange>;
  displayWorkspace: WorkspaceState | null;
  displayReadOnly: boolean;
  createFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  selectPath: (path: string) => void;
  createCheckpoint: (label: string) => void;
  restoreCheckpoint: (checkpointId: string) => void;
  revertFile: (path: string) => void;
  revertAll: () => void;
  resetWorkspace: () => Promise<void>;
  acceptPendingChange: (path: string) => void;
  rejectPendingChange: (path: string) => void;
  acceptAllPendingChanges: () => void;
  rejectAllPendingChanges: () => void;
  setPendingChanges: (changes: Record<string, PendingChange>) => void;
  updateWorkspaceFromOutput: (output: ProjectOutput, mode?: "plan" | "build") => void;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceState | null>>;
  setDraftWorkspace: React.Dispatch<React.SetStateAction<WorkspaceState | null>>;
}

export function useWorkspace(): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [draftWorkspace, setDraftWorkspace] = useState<WorkspaceState | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});

  // Load persisted workspace on first mount
  useEffect(() => {
    loadWorkspace()
      .then((ws) => {
        if (ws) setWorkspace(ws);
      })
      .catch(() => {});
  }, []);

  // Persist workspace (debounced)
  useEffect(() => {
    if (!workspace) return;
    const t = setTimeout(() => {
      saveWorkspace(workspace).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [workspace]);

  // Keep a read-only draft workspace while streaming before first commit
  const updateDraftWorkspace = useCallback((
    currentWorkspace: WorkspaceState | null,
    projectOutput: ProjectOutput | null,
    componentCode: string,
    outputFormat: string
  ) => {
    if (currentWorkspace) {
      setDraftWorkspace(null);
      return;
    }
    if (projectOutput?.type === "project") {
      setDraftWorkspace(workspaceFromProjectOutput(projectOutput));
      return;
    }
    if (componentCode) {
      setDraftWorkspace(workspaceFromSingleFile(componentCode, outputFormat));
      return;
    }
    setDraftWorkspace(null);
  }, []);

  const displayWorkspace = workspace || draftWorkspace;
  const displayReadOnly = !workspace;

  const createFile = useCallback((path: string, content: string) => {
    const language = detectLanguage(path);
    setWorkspace((prev) => {
      if (!prev) {
        return workspaceFromSingleFile(content, language, path);
      }
      return {
        ...prev,
        files: { ...prev.files, [path]: content },
        activePath: path,
        updatedAt: Date.now(),
      };
    });
    toast.success(`Created ${path}`);
  }, []);

  const updateFile = useCallback((path: string, content: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: { ...prev.files, [path]: content },
        updatedAt: Date.now(),
      };
    });
  }, []);

  const deleteFile = useCallback((path: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      const files = { ...prev.files };
      delete files[path];
      const newActivePath = prev.activePath === path
        ? (Object.keys(files)[0] || undefined)
        : prev.activePath;
      return {
        ...prev,
        files,
        activePath: newActivePath ?? prev.activePath,
        updatedAt: Date.now(),
      };
    });
    toast.success(`Deleted ${path}`);
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      const files = { ...prev.files };
      const content = files[oldPath];
      delete files[oldPath];
      files[newPath] = content;
      return {
        ...prev,
        files,
        activePath: prev.activePath === oldPath ? newPath : prev.activePath,
        updatedAt: Date.now(),
      };
    });
    toast.success(`Renamed to ${newPath}`);
  }, []);

  const selectPath = useCallback((path: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      return { ...prev, activePath: path };
    });
    setDraftWorkspace((prev) => {
      if (!prev) return prev;
      return { ...prev, activePath: path };
    });
  }, []);

  const handleCreateCheckpoint = useCallback((label: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      const cp = createCheckpoint(prev, label);
      return {
        ...prev,
        checkpoints: [cp, ...prev.checkpoints].slice(0, 25),
        updatedAt: Date.now(),
      };
    });
    toast.success("Checkpoint saved");
  }, []);

  const restoreCheckpoint = useCallback((checkpointId: string) => {
    setWorkspace((prev) => {
      if (!prev) return prev;
      const cp = prev.checkpoints.find((c) => c.id === checkpointId);
      if (!cp) return prev;
      return {
        ...prev,
        files: { ...cp.files },
        activePath: cp.activePath,
        updatedAt: Date.now(),
      };
    });
    toast.success("Checkpoint restored");
  }, []);

  const revertFile = useCallback((path: string) => {
    setWorkspace((prev) => {
      if (!prev?.baseFiles) return prev;
      return {
        ...prev,
        files: { ...prev.files, [path]: prev.baseFiles[path] ?? "" },
        updatedAt: Date.now(),
      };
    });
    toast.success(`Reverted ${path}`);
  }, []);

  const revertAll = useCallback(() => {
    setWorkspace((prev) => {
      if (!prev?.baseFiles) return prev;
      return {
        ...prev,
        files: { ...prev.baseFiles },
        updatedAt: Date.now(),
      };
    });
    toast.success("Reverted all files");
  }, []);

  const resetWorkspace = useCallback(async () => {
    await clearWorkspaceStorage();
    setWorkspace(null);
    setDraftWorkspace(null);
    setPendingChanges({});
    toast.success("Workspace reset");
  }, []);

  const acceptPendingChange = useCallback((path: string) => {
    const change = pendingChanges[path];
    if (!change) return;

    setWorkspace((prev) => {
      if (!prev) {
        return workspaceFromSingleFile(change.content, change.language, path);
      }
      return {
        ...prev,
        files: { ...prev.files, [path]: change.content },
        updatedAt: Date.now(),
      };
    });

    setPendingChanges((prev) => {
      const updated = { ...prev };
      delete updated[path];
      return updated;
    });
    toast.success(`Accepted changes to ${path}`);
  }, [pendingChanges]);

  const rejectPendingChange = useCallback((path: string) => {
    setPendingChanges((prev) => {
      const updated = { ...prev };
      delete updated[path];
      return updated;
    });
    toast.success(`Rejected changes to ${path}`);
  }, []);

  const acceptAllPendingChanges = useCallback(() => {
    if (Object.keys(pendingChanges).length === 0) return;

    setWorkspace((prev) => {
      const newFiles: Record<string, string> = {};
      for (const [path, change] of Object.entries(pendingChanges)) {
        newFiles[path] = change.content;
      }

      if (!prev) {
        const firstPath = Object.keys(newFiles)[0];
        return {
          version: 1 as const,
          mode: Object.keys(newFiles).length > 1 ? "project" as const : "single" as const,
          projectName: "project",
          activePath: firstPath,
          files: newFiles,
          baseFiles: { ...newFiles },
          checkpoints: [],
          updatedAt: Date.now(),
        };
      }

      return {
        ...prev,
        files: { ...prev.files, ...newFiles },
        updatedAt: Date.now(),
      };
    });

    setPendingChanges({});
    toast.success("Accepted all pending changes");
  }, [pendingChanges]);

  const rejectAllPendingChanges = useCallback(() => {
    setPendingChanges({});
    toast.success("Rejected all pending changes");
  }, []);

  const updateWorkspaceFromOutput = useCallback((output: ProjectOutput, mode?: "plan" | "build") => {
    if (mode === "build") {
      setWorkspace((prev) => {
        const next = workspaceFromProjectOutput(output);

        if (prev) {
          return {
            ...prev,
            files: { ...prev.files, ...next.files },
            baseFiles: prev.baseFiles || next.baseFiles,
            projectName: next.projectName || prev.projectName,
            checkpoints: prev.checkpoints,
            updatedAt: Date.now(),
          };
        }

        return next;
      });
    }
  }, []);

  return {
    workspace,
    draftWorkspace,
    pendingChanges,
    displayWorkspace,
    displayReadOnly,
    createFile,
    updateFile,
    deleteFile,
    renameFile,
    selectPath,
    createCheckpoint: handleCreateCheckpoint,
    restoreCheckpoint,
    revertFile,
    revertAll,
    resetWorkspace,
    acceptPendingChange,
    rejectPendingChange,
    acceptAllPendingChanges,
    rejectAllPendingChanges,
    setPendingChanges,
    updateWorkspaceFromOutput,
    setWorkspace,
    setDraftWorkspace,
  };
}