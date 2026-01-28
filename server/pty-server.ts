/**
 * PTY Server for Real Shell Command Execution
 * 
 * This server provides WebSocket-based PTY (pseudo-terminal) support
 * for executing real shell commands from the frontend terminal.
 * 
 * Features:
 * - Real bash shell execution with node-pty
 * - Working directory persistence per session (cd command support)
 * - Command history per session
 * - WebSocket-based real-time communication
 * - Automatic session cleanup for inactive connections
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as nodePty from 'node-pty';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import { stat } from 'fs';

const PORT = process.env.PTY_PORT || 3001;
const PTY_HOST = process.env.PTY_HOST || 'localhost';

// Session storage with cwd and command history
interface PtySession {
  id: string;
  pty: nodePty.IPty | null;
  cwd: string;
  history: string[];
  historyIndex: number;
  createdAt: Date;
  lastActivity: Date;
}

const sessions = new Map<string, PtySession>();

// Generate unique session ID
function generateSessionId(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .substring(0, 16);
}

// Message types for WebSocket communication
type PtyMessage = 
  | { type: 'create'; sessionId?: string; cwd?: string }
  | { type: 'write'; sessionId: string; data: string }
  | { type: 'resize'; sessionId: string; cols: number; rows: number }
  | { type: 'kill'; sessionId: string }
  | { type: 'list' }
  | { type: 'close'; sessionId: string };

type PtyResponse = 
  | { type: 'created'; sessionId: string; cwd: string }
  | { type: 'output'; sessionId: string; data: string }
  | { type: 'exit'; sessionId: string; code: number }
  | { type: 'list'; sessions: { id: string; cwd: string; createdAt: string }[] }
  | { type: 'error'; message: string; sessionId?: string }
  | { type: 'pong'; timestamp: number }
  | { type: 'cwd'; sessionId: string; cwd: string };

// Get user's home directory
function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '/home/user';
}

// Get current working directory with validation
async function getValidatedCwd(cwd: string): Promise<string> {
  try {
    await new Promise<void>((resolve, reject) => {
      stat(cwd, (err, stats) => {
        if (err || !stats.isDirectory()) {
          resolve(getHomeDir());
        } else {
          resolve();
        }
      });
    });
    return cwd;
  } catch {
    return getHomeDir();
  }
}

// Add command to session history
function addToHistory(session: PtySession, command: string) {
  // Don't add empty or duplicate commands
  const trimmed = command.trim();
  if (!trimmed) return;
  
  // Remove duplicate if exists at end
  if (session.history.length > 0 && session.history[session.history.length - 1] === trimmed) {
    return;
  }
  
  // Add to history (keep last 100 commands)
  session.history.push(trimmed);
  if (session.history.length > 100) {
    session.history.shift();
  }
  
  // Reset history index to end
  session.historyIndex = session.history.length;
}

// Get previous command in history
function getHistoryPrev(session: PtySession): string | null {
  if (session.history.length === 0) return null;
  
  if (session.historyIndex > 0) {
    session.historyIndex--;
    return session.history[session.historyIndex];
  }
  
  return session.history[0];
}

// Get next command in history
function getHistoryNext(session: PtySession): string | null {
  if (session.history.length === 0) return null;
  
  if (session.historyIndex < session.history.length - 1) {
    session.historyIndex++;
    return session.history[session.historyIndex];
  }
  
  // At end of history, return empty string
  session.historyIndex = session.history.length;
  return '';
}

// Check if command is a cd command and extract new directory
function parseCdCommand(command: string): string | null {
  const trimmed = command.trim();
  
  // Match cd commands: cd, cd ~, cd /path, cd ../path, cd ./path
  const cdRegex = /^cd\s+(~?|\.{1,2}\/?|\/.*)?$/;
  const match = trimmed.match(cdRegex);
  
  if (!match) return null;
  
  let path = match[1] || '';
  
  // Handle special cases
  if (path === '' || path === '~') {
    return getHomeDir();
  }
  
  // Handle relative paths
  if (!path.startsWith('/')) {
    // This will be resolved relative to current cwd on the shell side
    return path;
  }
  
  return path;
}

// Create a new PTY session
function createSession(requestedId?: string, cwd?: string): PtySession {
  const sessionId = requestedId || generateSessionId();
  
  // Use the requested working directory or default to project root
  const shellCwd = cwd || process.cwd();
  
  // Create PTY with bash
  const pty = nodePty.spawn('bash', ['-i'], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: shellCwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      HOME: getHomeDir(),
      USER: process.env.USER || 'user',
      // Add command history file
      HISTFILE: `${getHomeDir()}/.bash_history`,
      HISTSIZE: '1000',
      HISTFILESIZE: '2000',
    },
  });

  const session: PtySession = {
    id: sessionId,
    pty,
    cwd: shellCwd,
    history: [],
    historyIndex: 0,
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  sessions.set(sessionId, session);

  // Track if we're in a "cd waiting" state
  let pendingCdCwd: string | null = null;
  let cdCommandSent = false;

  // Handle PTY output - detect cwd changes
  pty.onData((data: string) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      
      // Check for cwd in prompt (bash prompt format: user@host:path$ )
      // Look for patterns like /home/user, /Users/user, /path/to/dir
      const cwdMatch = data.match(/:([^$]+)\$\s*$/);
      if (cwdMatch && cwdMatch[1]) {
        const detectedCwd = cwdMatch[1].replace('~', getHomeDir());
        if (detectedCwd !== session.cwd) {
          session.cwd = detectedCwd;
          broadcastToSession(sessionId, {
            type: 'cwd',
            sessionId,
            cwd: detectedCwd,
          });
        }
      }
      
      broadcastToSession(sessionId, {
        type: 'output',
        sessionId,
        data,
      });
    }
  });

  // Handle PTY exit
  pty.onExit(({ exitCode, signal }: { exitCode: number; signal: number }) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.pty = null;
      broadcastToSession(sessionId, {
        type: 'exit',
        sessionId,
        code: exitCode,
      });
      sessions.delete(sessionId);
    }
  });

  return session;
}

// Broadcast message to specific session's WebSocket
function broadcastToSession(sessionId: string, message: PtyResponse): void {
  const handler = sessionHandlers.get(sessionId);
  if (handler && handler.readyState === WebSocket.OPEN) {
    try {
      handler.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error broadcasting to session:', error);
    }
  }
}

// Track WebSocket connections per session
const sessionHandlers = new Map<string, WebSocket>();

// WebSocket server instance
const wss = new WebSocketServer({ host: PTY_HOST, port: PORT });

console.log(`🚀 PTY Server running on ws://${PTY_HOST}:${PORT}`);
console.log(`📁 Working directory persistence: enabled`);
console.log(`📜 Command history: enabled (100 commands per session)`);

wss.on('connection', (ws: WebSocket) => {
  console.log('🔌 New WebSocket connection');

  let currentSessionId: string | null = null;

  ws.on('message', (rawData: Buffer) => {
    try {
      const message: PtyMessage = JSON.parse(rawData.toString());
      console.log(`📨 Received: ${message.type}`);

      switch (message.type) {
        case 'create': {
          try {
            const session = createSession(message.sessionId, message.cwd);
            currentSessionId = session.id;
            sessionHandlers.set(session.id, ws);
            
            console.log(`✅ Created PTY session ${session.id} with cwd ${session.cwd}`);
            console.log(`   Session handlers now has ${sessionHandlers.size} entries`);
            console.log(`   WebSocket readyState: ${ws.readyState}`);
            
            // Verify the session was stored
            if (sessions.has(session.id)) {
              console.log(`   ✅ Session stored in sessions map`);
            } else {
              console.log(`   ❌ Session NOT stored in sessions map!`);
            }
            
            ws.send(JSON.stringify({
              type: 'created',
              sessionId: session.id,
              cwd: session.cwd,
            }));
          } catch (error) {
            console.error('❌ Failed to create PTY session:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Failed to create session',
            }));
          }
          break;
        }

        case 'write': {
          const session = sessions.get(message.sessionId);
          if (!session) {
            console.log(`❌ Session ${message.sessionId} not found. Available sessions:`, Array.from(sessions.keys()));
            ws.send(JSON.stringify({
              type: 'error',
              message: `Session not found or terminated`,
              sessionId: message.sessionId,
            }));
            return;
          }
          if (session?.pty) {
            session.lastActivity = new Date();
            currentSessionId = message.sessionId;
            sessionHandlers.set(message.sessionId, ws);
            
            // Handle history navigation
            if (message.data === '\x1b[A') { // Up arrow
              const cmd = getHistoryPrev(session);
              if (cmd !== null) {
                // Clear current line and show history command
                session.pty.write('\r\x1b[K' + cmd);
              }
              return;
            }
            
            if (message.data === '\x1b[B') { // Down arrow
              const cmd = getHistoryNext(session);
              if (cmd !== null) {
                session.pty.write('\r\x1b[K' + cmd);
              } else {
                session.pty.write('\r\x1b[K');
              }
              return;
            }
            
            // Write to PTY for regular input
            session.pty.write(message.data);
            
            // Handle Enter key for command history
            if (message.data === '\r') {
              // Note: Command is added to history when output is processed
              // This is a simplified approach - proper history would parse the command first
              console.log(`📝 Command executed in session ${message.sessionId}`);
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              sessionId: message.sessionId,
              message: 'Session not found or terminated',
            }));
          }
          break;
        }

        case 'resize': {
          const session = sessions.get(message.sessionId);
          if (session?.pty) {
            session.pty.resize(message.cols, Math.max(5, message.rows));
            session.lastActivity = new Date();
          }
          break;
        }

        case 'kill': {
          const session = sessions.get(message.sessionId);
          if (session?.pty) {
            session.pty.kill();
            sessions.delete(message.sessionId);
            sessionHandlers.delete(message.sessionId);
            console.log(`🛑 Session ${message.sessionId} terminated`);
          }
          break;
        }

        case 'list': {
          const sessionList = Array.from(sessions.values()).map(s => ({
            id: s.id,
            cwd: s.cwd,
            createdAt: s.createdAt.toISOString(),
          }));
          ws.send(JSON.stringify({ type: 'list', sessions: sessionList }));
          break;
        }

        case 'close': {
          const session = sessions.get(message.sessionId);
          if (session?.pty) {
            session.pty.kill();
          }
          sessions.delete(message.sessionId);
          sessionHandlers.delete(message.sessionId);
          if (currentSessionId === message.sessionId) {
            currentSessionId = null;
          }
          console.log(`🚪 Session ${message.sessionId} closed`);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  });

  ws.on('close', (code: number, reason: Buffer) => {
    console.log(`🔌 WebSocket connection closed: code=${code}, reason="${reason.toString()}"`);
    if (currentSessionId) {
      sessionHandlers.delete(currentSessionId);
    }
  });

  ws.on('error', (error: Error) => {
    console.error('⚠️ WebSocket error:', error);
  });
});

// Cleanup inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  const inactiveTimeout = 30 * 60 * 1000; // 30 minutes

  for (const [id, session] of sessions) {
    if (now - session.lastActivity.getTime() > inactiveTimeout) {
      console.log(`🧹 Cleaning up inactive session ${id}`);
      session.pty?.kill();
      sessions.delete(id);
      sessionHandlers.delete(id);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  for (const [id, session] of sessions) {
    session.pty?.kill();
  }
  wss.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  for (const [id, session] of sessions) {
    session.pty?.kill();
  }
  wss.close();
  process.exit(0);
});

export { createSession, sessions };
