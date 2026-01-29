'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Terminal, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminalContext } from './TerminalProvider';
import { PtyMessage } from './usePtyClient';
import { TerminalTabs } from './TerminalTabs';
import { cn } from '@/lib/utils';
import '@xterm/xterm/css/xterm.css';

interface XTermPanelProps {
  onCommand?: (command: string, sessionId: string) => Promise<void>;
}

interface TerminalState {
  isProcessing: boolean;
  isFullscreen: boolean;
}

interface XTermPanelRef {
  focus: () => void;
}

export const XTermPanel = React.forwardRef<XTermPanelRef, XTermPanelProps>(function XTermPanel({ onCommand }, ref) {
  const { 
    sessions, 
    activeSessionId, 
    config, 
    createSession,
    resizeTerminal,
    executeCommand,
    updateConfig,
    connect,
    setActiveSession,
    ptyClient,
    ptyState,
  } = useTerminalContext();

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitialMount = useRef(true);
  
  const [state, setState] = useState<TerminalState>({ isProcessing: false, isFullscreen: false });
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [isReady, setIsReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Forward ref methods
  useEffect(() => {
    if (ref) {
      (ref as React.MutableRefObject<XTermPanelRef>).current = {
        focus: () => xtermRef.current?.focus(),
      };
    }
  }, [ref]);

  // Get active session
  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId),
    [sessions, activeSessionId]
  );

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create xterm instance with configuration from context
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        black: '#484f58',
        red: '#f85149',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#a371f7',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#7ee787',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4db',
        brightWhite: '#ffffff',
      },
      scrollback: config.scrollback,
      convertEol: true,
      allowProposedApi: true,
    });

    // Add addons
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      console.log('Web link clicked:', uri);
    });
    term.loadAddon(webLinksAddon);

    // Open terminal in container
    term.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    setIsReady(true);

    // Handle resize
    const handleResize = () => {
      try {
        if (fitAddonRef.current && xtermRef.current) {
          fitAddonRef.current.fit();
          // Notify PTY server of resize
          if (activeSessionId) {
            const cols = xtermRef.current.cols;
            const rows = xtermRef.current.rows;
            resizeTerminal(activeSessionId, cols, rows);
          }
        }
      } catch (err) {
        console.warn('Resize error:', err);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Initial fit after small delay
    const fitTimeout = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
      } catch (err) {
        console.warn('Initial fit error:', err);
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(fitTimeout);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Update terminal config when it changes
  useEffect(() => {
    if (!xtermRef.current) return;
    
    try {
      xtermRef.current.options.fontSize = config.fontSize;
      xtermRef.current.options.fontFamily = config.fontFamily;
      xtermRef.current.options.scrollback = config.scrollback;
      
      if (localConfig.theme === 'light') {
        xtermRef.current.options.theme = {
          background: '#ffffff',
          foreground: '#1a1a1a',
          cursor: '#0066cc',
        };
      } else {
        xtermRef.current.options.theme = {
          background: '#0d1117',
          foreground: '#e6edf3',
          cursor: '#58a6ff',
          cursorAccent: '#0d1117',
        };
      }
      
      fitAddonRef.current?.fit();
    } catch (err) {
      console.warn('Config update error:', err);
    }
  }, [config, localConfig.theme]);

  // Handle PTY output
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    const unsubOutput = ptyClient.on('output', (msg: PtyMessage) => {
      if (msg.data && xtermRef.current) {
        try {
          xtermRef.current.write(msg.data);
        } catch (err) {
          console.error('Failed to write to terminal:', err);
        }
      }
    });

    const unsubExit = ptyClient.on('exit', (msg: PtyMessage) => {
      if (msg.sessionId && xtermRef.current) {
        try {
          xtermRef.current.writeln(`\r\n\x1b[31m[Process exited with code ${msg.code ?? 0}]\x1b[0m`);
          xtermRef.current.write('\x1b[1;32m❯\x1b[0m ');
        } catch (err) {
          console.error('Failed to write exit message:', err);
        }
      }
    });

    const unsubError = ptyClient.on('error', (msg: PtyMessage) => {
      if (msg.message && xtermRef.current) {
        try {
          xtermRef.current.writeln(`\r\n\x1b[31mError: ${msg.message}\x1b[0m`);
          xtermRef.current.write('\x1b[1;32m❯\x1b[0m ');
          setConnectionError(msg.message);
        } catch (err) {
          console.error('Failed to write error message:', err);
        }
      }
    });

    return () => {
      unsubOutput();
      unsubExit();
      unsubError();
    };
  }, [ptyClient]);

  // Auto-connect to PTY server (only once on initial mount)
  useEffect(() => {
    // Only connect on initial mount, not during Fast Refresh
    if (isInitialMount.current && !ptyClient.connected && !ptyClient.connecting) {
      connect();
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on initial mount only

  // Handle PTY connection state changes
  useEffect(() => {
    const term = xtermRef.current;
    if (term) {
      try {
        if (ptyClient.connected) {
          term.writeln('\r\n\x1b[32m✓ Connected to PTY server\x1b[0m');
          term.write('\x1b[1;32m❯\x1b[0m ');
          setConnectionError(null);
        } else if (!ptyClient.connecting) {
          term.writeln('\r\n\x1b[33m⚠ PTY server disconnected. Attempting to reconnect...\x1b[0m');
        }
      } catch (err) {
        console.error('Failed to write connection status:', err);
      }
    }
  }, [ptyClient.connected, ptyClient.connecting]);
  // Handle command input
  const handleCommand = useCallback(async (command: string) => {
    if (!xtermRef.current || !activeSessionId) return;
    
    const term = xtermRef.current;
    
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      if (onCommand) {
        await onCommand(command, activeSessionId);
      } else if (ptyClient.connected) {
        // Send command to PTY server
        executeCommand(activeSessionId, command);
      } else {
        // Fallback to built-in commands when not connected
        await executeBuiltInCommand(command, term);
      }
    } catch (err) {
      term.writeln(`\x1b[31mError: ${err instanceof Error ? err.message : 'Command failed'}\x1b[0m`);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [activeSessionId, onCommand, ptyClient.connected, executeCommand]);

  // Built-in command execution (fallback when not connected to PTY)
  const executeBuiltInCommand = async (
    cmd: string,
    term: XTerm
  ): Promise<void> => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    await new Promise(resolve => setTimeout(resolve, 50));

    switch (command) {
      case 'clear':
        term.clear();
        break;
      case 'echo':
        term.writeln(args.join(' '));
        break;
      case 'pwd':
        term.writeln('/home/mint-ai');
        break;
      case 'date':
        term.writeln(new Date().toString());
        break;
      case 'whoami':
        term.writeln('mint-ai-user');
        break;
      case 'help':
        term.writeln('\x1b[1;33mAvailable commands:\x1b[0m');
        term.writeln('  clear     - Clear terminal screen');
        term.writeln('  echo      - Display text');
        term.writeln('  pwd       - Print working directory');
        term.writeln('  date      - Display current date');
        term.writeln('  whoami    - Display current user');
        term.writeln('  ls        - List directory contents');
        term.writeln('  cat       - Display file contents');
        term.writeln('  uname     - Display system info');
        term.writeln('  hostname  - Display hostname');
        term.writeln('  env       - Display environment');
        term.writeln('  help      - Show this help message');
        term.writeln('\x1b[90mKeyboard shortcuts:\x1b[0m');
        term.writeln('  ↑/↓       - Command history');
        term.writeln('  Ctrl+L    - Clear screen');
        term.writeln('  Ctrl+C    - Cancel command');
        break;
      case 'ls':
        term.writeln('\x1b[1;34mcomponents/\x1b[0m  \x1b[1;34mhooks/\x1b[0m  \x1b[1;34mapp/\x1b[0m  \x1b[1;34mpublic/\x1b[0m  \x1b[32mpackage.json\x1b[0m  \x1b[32mREADME.md\x1b[0m');
        break;
      case 'cat':
        if (args.length === 0) {
          term.writeln('\x1b[31mUsage: cat <filename>\x1b[0m');
        } else {
          term.writeln(`\x1b[1;32m[File: ${args[0]}]\x1b[0m`);
          term.writeln('(File content would be displayed here)');
        }
        break;
      case 'uname':
        if (args.includes('-a')) {
          term.writeln('mint-ai 1.0.0 Linux x86_64 GNU/Linux');
        } else {
          term.writeln('mint-ai');
        }
        break;
      case 'hostname':
        term.writeln('mint-ai');
        break;
      case 'env':
        term.writeln('\x1b[32mNODE_ENV=development\x1b[0m');
        term.writeln('\x1b[32mPATH=/usr/local/bin:/usr/bin\x1b[0m');
        term.writeln('\x1b[32mHOME=/home/mint-ai\x1b[0m');
        break;
      case 'exit':
        term.writeln('\x1b[33mType Cmd+T to create a new terminal, or close this tab\x1b[0m');
        break;
      case '':
        break;
      default:
        term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
        term.writeln('\x1b[33mType "help" for available commands\x1b[0m');
    }
  };

  // Handle keyboard input in xterm
  useEffect(() => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    let lineBuffer = '';
    
    // When connected to PTY, the server handles history navigation
    // We just pass raw input through and let the server manage everything
    const handleData = (data: string) => {
      // When connected to PTY, pass all input directly through
      if (ptyClient.connected && activeSessionId) {
        // Handle Ctrl+C and Ctrl+L for local response
        if (data === '\x03') { // Ctrl+C
          term.writeln('^C');
          return;
        }
        
        if (data === '\x0c') { // Ctrl+L
          term.clear();
          term.write('\x1b[1;32m❯\x1b[0m ');
          return;
        }
        
        // Pass all other input directly to PTY (including arrow keys for history)
        executeCommand(activeSessionId, data);
        return;
      }
      
      // Fallback mode: built-in commands when not connected to PTY
      // Handle special key sequences
      if (data === '\x03') { // Ctrl+C
        term.writeln('^C');
        lineBuffer = '';
        term.write('\r\n\x1b[1;32m❯\x1b[0m ');
        return;
      }
      
      if (data === '\x0c') { // Ctrl+L
        term.clear();
        term.write('\x1b[1;32m❯\x1b[0m ');
        return;
      }

      // Handle Enter key
      if (data === '\r') {
        term.write('\r\n');
        if (lineBuffer.trim()) {
          handleCommand(lineBuffer);
        } else {
          term.write('\x1b[1;32m❯\x1b[0m ');
        }
        lineBuffer = '';
        return;
      }

      // Handle backspace
      if (data === '\x7f' || data === '\b') {
        if (lineBuffer.length > 0) {
          lineBuffer = lineBuffer.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Handle regular characters (only printable ASCII)
      if (typeof data === 'string' && data.length === 1 && data >= ' ' && data <= '~') {
        lineBuffer += data;
        term.write(data);
      }
    };

    // onData returns an IDisposable in xterm.js v5
    const dispose = term.onData(handleData);

    return () => {
      dispose.dispose();
    };
  }, [activeSessionId, ptyClient.connected, executeCommand]);

  // Handle config changes
  const handleConfigChange = (key: string, value: string | number) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = () => {
    updateConfig(localConfig);
    setShowConfig(false);
  };

  const handleAddSession = () => {
    createSession();
  };

  // Keyboard shortcut for new terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleAddSession();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddSession]);

  // Focus terminal on click
  const focusTerminal = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  }, []);

  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-[#0d1117]',
        state.isFullscreen && 'fixed inset-0 z-50'
      )}
      onClick={focusTerminal}
    >
      {/* Terminal Tabs */}
      <TerminalTabs 
        onAddSession={handleAddSession}
        onConfigClick={() => setShowConfig(true)}
      />

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Terminal</span>
          {activeSession && (
            <span className="text-xs text-gray-500">
              {activeSession.cwd}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          {ptyClient.connected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : ptyClient.connecting ? (
            <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          
          {/* Processing indicator */}
          {state.isProcessing && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="animate-spin">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </span>
              Processing
            </span>
          )}
          
          {/* Fullscreen */}
          <button
            onClick={() => setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
            title={state.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {state.isFullscreen ? (
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border-b border-red-800 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>{connectionError}</span>
          <button 
            onClick={() => { setConnectionError(null); connect(); }}
            className="ml-auto hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* XTerm Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Disconnected State Overlay */}
        {!ptyClient.connected && !ptyClient.connecting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d1117]/95">
            <WifiOff className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Terminal Server Disconnected
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-4">
              The PTY server is not running. You can still use the terminal with built-in commands, 
              or start the server with <code className="bg-[#30363d] px-1.5 py-0.5 rounded">bun run dev:pty</code>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => connect()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Retry Connection
              </button>
              <button
                onClick={() => {
                  if (xtermRef.current) {
                    xtermRef.current.writeln('\r\n\x1b[33mℹ Operating in fallback mode. Type "help" for available commands.\x1b[0m');
                    xtermRef.current.write('\x1b[1;32m❯\x1b[0m ');
                  }
                }}
                className="px-4 py-2 bg-[#30363d] text-gray-300 text-sm rounded hover:bg-[#484f58] transition-colors"
              >
                Use Fallback Mode
              </button>
            </div>
            <div className="mt-6 text-xs text-gray-600">
              <p>Built-in commands available: help, clear, echo, pwd, date, whoami, ls, cat, uname, hostname, env</p>
            </div>
          </div>
        )}
        
        {/* Connecting State */}
        {ptyClient.connecting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d1117]/90">
            <div className="animate-spin mb-4">
              <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Connecting to terminal server...</p>
          </div>
        )}
        
        <div 
          ref={terminalRef}
          className="h-full p-2"
          style={{ 
            fontSize: config.fontSize,
            fontFamily: config.fontFamily
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-t border-[#30363d] text-xs text-gray-500">
        <span>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          {isReady && ' • xterm.js ready'}
          {ptyClient.connected && ' • PTY connected'}
        </span>
        <div className="flex items-center gap-3">
          <span>Cmd+T New</span>
          <span>Ctrl+C Cancel</span>
          <span>Ctrl+L Clear</span>
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setShowConfig(false)} 
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl p-4 w-80">
            <h3 className="text-sm font-medium text-gray-200 mb-4">Terminal Settings</h3>
            
            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Font Size</label>
              <input
                type="number"
                value={localConfig.fontSize}
                onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-gray-200"
                min="10"
                max="24"
              />
            </div>
            
            {/* Theme */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Theme</label>
              <select
                value={localConfig.theme}
                onChange={(e) => handleConfigChange('theme', e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-gray-200"
              >
                <option value="dark">Dark (GitHub Dark)</option>
                <option value="light">Light</option>
              </select>
            </div>
            
            {/* Scrollback */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Scrollback Lines</label>
              <input
                type="number"
                value={localConfig.scrollback}
                onChange={(e) => handleConfigChange('scrollback', parseInt(e.target.value))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-gray-200"
                min="100"
                max="10000"
                step="100"
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfig(false)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConfig}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
