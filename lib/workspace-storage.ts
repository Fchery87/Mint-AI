import type { WorkspaceState } from './workspace';

const DB_NAME = 'mint-ai';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const WORKSPACE_KEY = 'workspace-v1';
const LS_KEY = 'mint-ai:workspace-v1';

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function safeParseWorkspace(value: unknown): WorkspaceState | null {
  if (!value || typeof value !== 'object') return null;
  const ws = value as WorkspaceState;
  if (ws.version !== 1) return null;
  if (!ws.files || typeof ws.files !== 'object') return null;
  if (!ws.activePath || typeof ws.activePath !== 'string') return null;
  return ws;
}

export async function loadWorkspace(): Promise<WorkspaceState | null> {
  if (typeof window === 'undefined') return null;

  // Prefer IndexedDB
  if (hasIndexedDb()) {
    try {
      const stored = await idbGet<WorkspaceState>(WORKSPACE_KEY);
      const parsed = safeParseWorkspace(stored);
      if (parsed) return parsed;
    } catch {
      // fall through to localStorage
    }
  }

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return safeParseWorkspace(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  if (typeof window === 'undefined') return;

  const updated: WorkspaceState = { ...workspace, updatedAt: Date.now() };

  if (hasIndexedDb()) {
    try {
      await idbSet(WORKSPACE_KEY, updated);
      return;
    } catch {
      // fall through to localStorage
    }
  }

  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export async function clearWorkspace(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (hasIndexedDb()) {
    try {
      await idbDelete(WORKSPACE_KEY);
    } catch {
      // ignore
    }
  }

  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

