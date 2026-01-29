'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePtyClient, PtyMessage } from './usePtyClient';

export interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  ptyId: string | null;
  createdAt: number;
}

export interface TerminalConfig {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light';
  scrollback: number;
}

export interface TerminalState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

interface TerminalContextValue {
  // Session management
  sessions: TerminalSession[];
  activeSessionId: string | null;
  createSession: (name?: string) => string;
  closeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  getSession: (id: string) => TerminalSession | undefined;
  
  // PTY connection state
  ptyState: TerminalState;
  ptyClient: ReturnType<typeof import('./usePtyClient').usePtyClient>;
  connect: () => void;
  disconnect: () => void;
  
  // Command execution
  executeCommand: (sessionId: string, command: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  killSession: (sessionId: string) => void;
  
  // Configuration
  config: TerminalConfig;
  updateConfig: (config: Partial<TerminalConfig>) => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

const DEFAULT_CONFIG: TerminalConfig = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  theme: 'dark',
  scrollback: 1000,
};

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: 'default', name: 'Terminal', cwd: '/home/mint-ai', ptyId: null, createdAt: Date.now() },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>('default');
  const [config, setConfig] = useState<TerminalConfig>(DEFAULT_CONFIG);
  
  // PTY client for real shell execution
  const ptyClient = usePtyClient();
  
  // Track session to PTY ID mapping
  const sessionToPtyMap = useRef<Map<string, string>>(new Map());

  // Extract stable state references
  const { connected, connecting, error, connect, disconnect } = ptyClient;

  const createSession = useCallback((name?: string) => {
    const id = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionName = name || `Terminal ${sessions.length + 1}`;
    const newSession: TerminalSession = {
      id,
      name: sessionName,
      cwd: '/home/mint-ai',
      ptyId: null,
      createdAt: Date.now(),
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    
    // Create PTY session if connected
    if (connected) {
      ptyClient.createSession(id, newSession.cwd);
    }
    
    return id;
  }, [sessions.length, connected, ptyClient.createSession]);

  const closeSession = useCallback((id: string) => {
    if (sessions.length <= 1) {
      // Don't close the last session, just reset it
      return;
    }
    
    // Kill PTY session if exists
    const ptyId = sessionToPtyMap.current.get(id);
    if (ptyId && connected) {
      ptyClient.killSession(ptyId);
      sessionToPtyMap.current.delete(id);
    }
    
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(sessions[0]?.id || null);
    }
  }, [sessions, activeSessionId, connected, ptyClient.killSession]);

  const renameSession = useCallback((id: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TerminalConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  );

  // Execute command in PTY session
  const executeCommand = useCallback((sessionId: string, command: string) => {
    const ptyId = sessionToPtyMap.current.get(sessionId);
    console.log(`📝 executeCommand called: sessionId=${sessionId}, ptyId=${ptyId}, connected=${connected}, command="${command}"`);
    console.log(`   Session map:`, Array.from(sessionToPtyMap.current.entries()));
    if (ptyId && connected) {
      ptyClient.writeToSession(ptyId, command + '\r');
      console.log(`   ✅ Sent to PTY`);
    } else {
      console.warn(`❌ Cannot execute: ptyId=${ptyId}, connected=${connected}`);
      if (!connected) {
        console.warn(`   Reason: PTY not connected`);
      } else if (!ptyId) {
        console.warn(`   Reason: No PTY ID mapped for session ${sessionId}`);
      }
    }
  }, [connected, ptyClient.writeToSession]);

  // Resize terminal
  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number) => {
    const ptyId = sessionToPtyMap.current.get(sessionId);
    if (ptyId && connected) {
      ptyClient.resizeSession(ptyId, cols, rows);
    }
  }, [connected, ptyClient.resizeSession]);

  // Kill session and PTY
  const killSession = useCallback((sessionId: string) => {
    const ptyId = sessionToPtyMap.current.get(sessionId);
    if (ptyId && connected) {
      ptyClient.killSession(ptyId);
      sessionToPtyMap.current.delete(sessionId);
    }
    
    // Update session to remove PTY reference
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ptyId: null } : s))
    );
  }, [connected, ptyClient.killSession]);

  // Handle PTY session created - stable effect
  useEffect(() => {
    const unsubCreated = ptyClient.on('created', (msg: PtyMessage) => {
      console.log(`📨 Received 'created' message:`, msg);
      if (msg.sessionId) {
        sessionToPtyMap.current.set(msg.sessionId, msg.sessionId);
        console.log(`   ✅ Mapped session ${msg.sessionId} in sessionToPtyMap`);
        
        // Update session with PTY ID
        setSessions((prev) =>
          prev.map((s) =>
            s.id === msg.sessionId
              ? { ...s, ptyId: msg.sessionId!, cwd: msg.cwd || s.cwd }
              : s
          )
        );
      }
    });

    // Handle cwd updates from PTY
    const unsubCwd = ptyClient.on('cwd', (msg: PtyMessage) => {
      if (msg.sessionId && msg.cwd) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === msg.sessionId
              ? { ...s, cwd: msg.cwd || s.cwd }
              : s
          )
        );
      }
    });

    return () => {
      console.log('🧹 Cleaning up PTY message handlers');
      unsubCreated();
      unsubCwd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - handlers are stable via ref

  // Auto-create PTY sessions for existing sessions when connected
  useEffect(() => {
    if (!connected) return;

    // Create PTY sessions for any sessions that don't have one yet
    const createdIds: string[] = [];
    sessions.forEach((session) => {
      if (!session.ptyId && !sessionToPtyMap.current.has(session.id) && !createdIds.includes(session.id)) {
        console.log(`Creating PTY session for ${session.id}`);
        createdIds.push(session.id);
        ptyClient.createSession(session.id, session.cwd);
      }
    });
  }, [connected]); // Only depend on connected state

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    sessions,
    activeSessionId,
    config,
    createSession,
    closeSession,
    setActiveSession: setActiveSessionId,
    renameSession,
    updateConfig,
    getSession,
    ptyState: {
      connected,
      connecting,
      error,
    },
    ptyClient,
    connect,
    disconnect,
    executeCommand,
    resizeTerminal,
    killSession,
  }), [
    sessions,
    activeSessionId,
    config,
    createSession,
    closeSession,
    renameSession,
    updateConfig,
    getSession,
    connected,
    connecting,
    error,
    ptyClient,
    connect,
    disconnect,
    executeCommand,
    resizeTerminal,
    killSession,
  ]);

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminalContext() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalContext must be used within TerminalProvider');
  }
  return context;
}

export default TerminalProvider;
