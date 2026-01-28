/**
 * WebSocket PTY Client Hook
 * 
 * Provides real-time communication with the PTY server
 * for executing shell commands in the terminal.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PtyClientConfig {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface PtyClientState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface PtyMessage {
  type: 'created' | 'output' | 'exit' | 'list' | 'error' | 'pong' | 'cwd';
  sessionId?: string;
  data?: string;
  code?: number;
  sessions?: { id: string; cwd: string; createdAt: string }[];
  message?: string;
  timestamp?: number;
  cwd?: string;
}

type MessageHandler = (message: PtyMessage) => void;

const DEFAULT_CONFIG: PtyClientConfig = {
  url: 'ws://localhost:3001',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
};

export function usePtyClient(config: PtyClientConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  const [state, setState] = useState<PtyClientState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const wsUrl = mergedConfig.url || DEFAULT_CONFIG.url!;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 PTY WebSocket connected');
        setState({ connected: true, connecting: false, error: null });
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: PtyMessage = JSON.parse(event.data);
          console.log(`📨 PTY message: ${message.type}`);

          // Handle pong
          if (message.type === 'pong' && message.timestamp) {
            const latency = Date.now() - message.timestamp;
            console.log(`🏓 Pong latency: ${latency}ms`);
            return;
          }

          // Notify handlers
          handlersRef.current.forEach((handler) => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing PTY message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 PTY WebSocket closed: ${event.code} - ${event.reason}`);
        setState(prev => ({ ...prev, connected: false, connecting: false }));
        
        // Attempt reconnection (only if component is still mounted)
        if (isMountedRef.current && reconnectCountRef.current < (mergedConfig.reconnectAttempts || 5)) {
          const delay = (mergedConfig.reconnectDelay || 1000) * Math.pow(2, reconnectCountRef.current);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to connect to PTY server after maximum attempts' 
          }));
        }
      };

      ws.onerror = (error) => {
        console.error('⚠️ PTY WebSocket error:', {
          type: 'WebSocket connection failed',
          url: mergedConfig.url,
          readyState: ws?.readyState,
          error: error instanceof Event ? error.type : error,
        });
        setState(prev => ({ 
          ...prev, 
          connecting: false,
          error: `Failed to connect to PTY server at ${mergedConfig.url}. Make sure to run 'bun run dev:pty' in a separate terminal.` 
        }));
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect' 
      }));
    }
  }, [mergedConfig.url, mergedConfig.reconnectAttempts, mergedConfig.reconnectDelay]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectCountRef.current = 0;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState({ connected: false, connecting: false, error: null });
  }, []);

  // Send message to server
  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, []);

  // Register message handler
  const on = useCallback((event: string, handler: MessageHandler) => {
    const id = `${event}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    handlersRef.current.set(id, handler);
    return () => handlersRef.current.delete(id);
  }, []);

  // Create a new PTY session
  const createSession = useCallback((sessionId?: string, cwd?: string) => {
    send({ type: 'create', sessionId, cwd });
  }, [send]);

  // Write data to a session
  const writeToSession = useCallback((sessionId: string, data: string) => {
    send({ type: 'write', sessionId, data });
  }, [send]);

  // Resize a session
  const resizeSession = useCallback((sessionId: string, cols: number, rows: number) => {
    send({ type: 'resize', sessionId, cols, rows });
  }, [send]);

  // Kill a session
  const killSession = useCallback((sessionId: string) => {
    send({ type: 'kill', sessionId });
  }, [send]);

  // Close a session
  const closeSession = useCallback((sessionId: string) => {
    send({ type: 'close', sessionId });
  }, [send]);

  // List all sessions
  const listSessions = useCallback(() => {
    send({ type: 'list' });
  }, [send]);

  // Ping server
  const ping = useCallback(() => {
    send({ type: 'ping', timestamp: Date.now() });
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    on,
    createSession,
    writeToSession,
    resizeSession,
    killSession,
    closeSession,
    listSessions,
    ping,
  };
}

// Helper hook for managing a single PTY session
export function usePtySession(initialSessionId?: string, cwd?: string) {
  const client = usePtyClient();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [output, setOutput] = useState<string>('');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [cwdState, setCwdState] = useState<string>(cwd || process.cwd());

  // Register message handlers
  useEffect(() => {
    if (!client.connected) return;

    // Handle session created
    const unsubCreated = client.on('created', (msg) => {
      if (msg.sessionId) {
        setSessionId(msg.sessionId);
        if (msg.cwd) {
          setCwdState(msg.cwd);
        }
      }
    });

    // Handle output
    const unsubOutput = client.on('output', (msg) => {
      if (msg.data) {
        setOutput(prev => prev + msg.data!);
      }
    });

    // Handle exit
    const unsubExit = client.on('exit', (msg) => {
      if (msg.code !== undefined) {
        setExitCode(msg.code);
      }
    });

    // Handle errors
    const unsubError = client.on('error', (msg) => {
      console.error('Session error:', msg.message);
    });

    return () => {
      unsubCreated();
      unsubOutput();
      unsubExit();
      unsubError();
    };
  }, [client, client.connected]);

  // Create session on connect if not exists
  useEffect(() => {
    if (client.connected && !sessionId) {
      client.createSession(undefined, cwd);
    }
  }, [client.connected, sessionId, cwd, client]);

  // Write command
  const write = useCallback((data: string) => {
    if (sessionId) {
      client.writeToSession(sessionId, data);
    }
  }, [sessionId, client]);

  // Resize terminal
  const resize = useCallback((cols: number, rows: number) => {
    if (sessionId) {
      client.resizeSession(sessionId, cols, rows);
    }
  }, [sessionId, client]);

  // Kill session
  const kill = useCallback(() => {
    if (sessionId) {
      client.killSession(sessionId);
      setSessionId(null);
      setExitCode(null);
    }
  }, [sessionId, client]);

  return {
    connected: client.connected,
    connecting: client.connecting,
    error: client.error,
    sessionId,
    output,
    exitCode,
    cwd: cwdState,
    connect: client.connect,
    disconnect: client.disconnect,
    write,
    resize,
    kill,
    clearOutput: () => setOutput(''),
  };
}
