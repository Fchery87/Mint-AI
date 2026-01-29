import { useCallback, useMemo } from 'react';
import type { ContextSnapshot, EditorContext, WorkspaceContext } from '@/types/context-snapshot';
import type { WorkspaceState } from '@/hooks/useWorkspace';

interface UseContextSnapshotOptions {
  workspace: WorkspaceState | null;
  mode: 'plan' | 'build';
  planId?: string;
  currentStepIndex?: number;
}

export function useContextSnapshot({
  workspace,
  mode,
  planId,
  currentStepIndex,
}: UseContextSnapshotOptions) {
  const buildContextSnapshot = useCallback((): ContextSnapshot => {
    const editor: EditorContext = {
      activeFilePath: workspace?.activePath || null,
      activeFileContent: workspace?.activePath 
        ? workspace.files[workspace.activePath] 
        : undefined,
      selection: undefined, // TODO: Add selection tracking
    };

    const workspaceContext: WorkspaceContext = {
      workspaceId: workspace?.projectName || 'default',
      openFiles: Object.keys(workspace?.files || {}),
      projectName: workspace?.projectName,
      rootPath: workspace?.projectName,
    };

    return {
      editor,
      workspace: workspaceContext,
      mode,
      planId,
      currentStepIndex,
      timestamp: Date.now(),
    };
  }, [workspace, mode, planId, currentStepIndex]);

  return useMemo(() => ({
    buildContextSnapshot,
  }), [buildContextSnapshot]);
}
