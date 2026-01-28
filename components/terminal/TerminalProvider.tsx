'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

  const createSession = useCallback((name?: string) => {
    const id = name || `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    if (ptyClient.connected) {
      ptyClient.createSession(id, newSession.cwd);
    }
    
    return id;
  }, [sessions.length, ptyClient]);

  const closeSession = useCallback((id: string) => {
    if (sessions.length <= 1) {
      // Don't close the last session, just reset it
      return;
    }
    
    // Kill PTY session if exists
    const ptyId = sessionToPtyMap.current.get(id);
    if (ptyId && ptyClient.connected) {
      ptyClient.killSession(ptyId);
      sessionToPtyMap.current.delete(id);
    }
    
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(sessions[0]?.id || null);
    }
  }, [sessions, activeSessionId, ptyClient]);

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
    console.log(`📝 executeCommand called: sessionId=${sessionId}, ptyId=${ptyId}, connected=${ptyClient.connected}, command="${command}"`);
    console.log(`   Session map:`, Array.from(sessionToPtyMap.current.entries()));
    if (ptyId && ptyClient.connected) {
      ptyClient.writeToSession(ptyId, command + '\r');
      console.log(`   ✅ Sent to PTY`);
    } else {
      console.warn(`❌ Cannot execute: ptyId=${ptyId}, connected=${ptyClient.connected}`);
      if (!ptyClient.connected) {
        console.warn(`   Reason: PTY not connected`);
      } else if (!ptyId) {
        console.warn(`   Reason: No PTY ID mapped for session ${sessionId}`);
      }
    }
  }, [ptyClient]);

  // Resize terminal
  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number) => {
    const ptyId = sessionToPtyMap.current.get(sessionId);
    if (ptyId && ptyClient.connected) {
      ptyClient.resizeSession(ptyId, cols, rows);
    }
  }, [ptyClient]);

  // Kill session and PTY
  const killSession = useCallback((sessionId: string) => {
    const ptyId = sessionToPtyMap.current.get(sessionId);
    if (ptyId && ptyClient.connected) {
      ptyClient.killSession(ptyId);
      sessionToPtyMap.current.delete(sessionId);
    }
    
    // Update session to remove PTY reference
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ptyId: null } : s))
    );
  }, [ptyClient]);

  // Handle PTY session created
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
  }, [ptyClient]); // Remove ptyClient.connected from deps to keep handlers stable

  // Auto-create PTY sessions for existing sessions when connected
  useEffect(() => {
    if (!ptyClient.connected) return;

    // Create PTY sessions for any sessions that don't have one yet
    const createdIds: string[] = [];
    sessions.forEach((session) => {
      if (!session.ptyId && !sessionToPtyMap.current.has(session.id) && !createdIds.includes(session.id)) {
        console.log(`Creating PTY session for ${session.id}`);
        createdIds.push(session.id);
        ptyClient.createSession(session.id, session.cwd);
      }
    });
  }, [ptyClient.connected]);

  return (
    <TerminalContext.Provider
      value={{
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
          connected: ptyClient.connected,
          connecting: ptyClient.connecting,
          error: ptyClient.error,
        },
        ptyClient,
        connect: ptyClient.connect,
        disconnect: ptyClient.disconnect,
        executeCommand,
        resizeTerminal,
        killSession,
      }}
    >
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
