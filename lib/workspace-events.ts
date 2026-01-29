/**
 * Workspace Events
 * 
 * Event types for synchronizing workspace state between
 * the editor, chat panel, and backend.
 */

/**
 * Base workspace event
 */
export interface WorkspaceEvent {
  /** Event type */
  type: string;
  /** Timestamp */
  timestamp: number;
  /** Workspace ID */
  workspaceId: string;
}

/**
 * File created event
 */
export interface FileCreatedEvent extends WorkspaceEvent {
  type: 'file:created';
  path: string;
  content: string;
}

/**
 * File updated event
 */
export interface FileUpdatedEvent extends WorkspaceEvent {
  type: 'file:updated';
  path: string;
  content: string;
  previousContent: string;
}

/**
 * File deleted event
 */
export interface FileDeletedEvent extends WorkspaceEvent {
  type: 'file:deleted';
  path: string;
}

/**
 * File renamed event
 */
export interface FileRenamedEvent extends WorkspaceEvent {
  type: 'file:renamed';
  oldPath: string;
  newPath: string;
}

/**
 * Active file changed event
 */
export interface ActiveFileChangedEvent extends WorkspaceEvent {
  type: 'file:active';
  path: string | null;
}

/**
 * Selection changed event
 */
export interface SelectionChangedEvent extends WorkspaceEvent {
  type: 'selection:changed';
  path: string;
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * All workspace event types
 */
export type WorkspaceEvents =
  | FileCreatedEvent
  | FileUpdatedEvent
  | FileDeletedEvent
  | FileRenamedEvent
  | ActiveFileChangedEvent
  | SelectionChangedEvent;

/**
 * Event listener type
 */
export type WorkspaceEventListener = (event: WorkspaceEvents) => void;

/**
 * Workspace event emitter interface
 */
export interface WorkspaceEventEmitter {
  /** Subscribe to events */
  on(listener: WorkspaceEventListener): () => void;
  /** Emit an event */
  emit(event: WorkspaceEvents): void;
}

/**
 * Create a workspace event emitter
 */
export function createWorkspaceEventEmitter(): WorkspaceEventEmitter {
  const listeners = new Set<WorkspaceEventListener>();

  return {
    on(listener: WorkspaceEventListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event: WorkspaceEvents) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in workspace event listener:', error);
        }
      });
    },
  };
}
