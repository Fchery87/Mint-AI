'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Check,
  Play,
  Maximize2,
  Minimize2,
  Copy as CopyIcon
} from 'lucide-react';
import { useTerminal, TerminalLine } from './useTerminal';
import { useTerminalContext, TerminalConfig } from './TerminalProvider';
import { TerminalTabs } from './TerminalTabs';
import { cn } from '@/lib/utils';

interface TerminalPanelProps {
  onCommand?: (command: string, sessionId: string) => Promise<void>;
}

interface TerminalState {
  isProcessing: boolean;
  isFullscreen: boolean;
}

// Command history entry with session tracking
interface TrackedCommand {
  command: string;
  timestamp: number;
  sessionId: string;
}

export function TerminalPanel({ onCommand }: TerminalPanelProps) {
  const { 
    lines, 
    addCommand, 
    addOutput, 
    addError, 
    addSuccess, 
    addInfo, 
    clear, 
    linesEndRef,
  } = useTerminal();
  
  const { 
    sessions, 
    activeSessionId, 
    config, 
    createSession,
    updateConfig 
  } = useTerminalContext();

  const [input, setInput] = useState('');
  const [state, setState] = useState<TerminalState>({ isProcessing: false, isFullscreen: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState<TerminalConfig>(config);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track command history across sessions
  const [commandHistory, setCommandHistory] = useState<TrackedCommand[]>([]);
  const [sessionHistoryIndex, setSessionHistoryIndex] = useState<Map<string, number>>(new Map());

  // Focus input on mount and when clicked
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Get history for current session
  const getSessionHistory = useCallback((sessionId: string): string[] => {
    return commandHistory
      .filter(cmd => cmd.sessionId === sessionId)
      .map(cmd => cmd.command);
  }, [commandHistory]);

  // Process a command
  const processCommand = useCallback(async (cmd: string) => {
    if (!activeSessionId) return;
    
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    addCommand(trimmedCmd);
    setInput('');
    setState(prev => ({ ...prev, isProcessing: true }));

    // Track command in history
    setCommandHistory(prev => [
      ...prev, 
      { command: trimmedCmd, timestamp: Date.now(), sessionId: activeSessionId }
    ]);
    
    // Update session history index
    setSessionHistoryIndex(prev => {
      const newMap = new Map(prev);
      const sessionHistory = getSessionHistory(activeSessionId);
      newMap.set(activeSessionId, sessionHistory.length);
      return newMap;
    });

    try {
      // Call external command handler if provided
      if (onCommand) {
        await onCommand(trimmedCmd, activeSessionId);
      } else {
        // Built-in commands
        await executeBuiltInCommand(trimmedCmd, { addOutput, addError, addSuccess, addInfo, clear });
      }
    } catch (err) {
      addError(err instanceof Error ? err.message : 'Command failed');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [activeSessionId, addCommand, addOutput, addError, addSuccess, addInfo, clear, onCommand, getSessionHistory]);

  // Built-in command execution
  const executeBuiltInCommand = async (
    cmd: string,
    handlers: { addOutput: (s: string) => void; addError: (s: string) => void; addSuccess: (s: string) => void; addInfo: (s: string) => void; clear: () => void }
  ) => {
    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Simulate processing delay for realism
    await new Promise(resolve => setTimeout(resolve, 50));

    switch (command) {
      case 'clear':
        handlers.clear();
        break;
      case 'echo':
        handlers.addOutput(args.join(' '));
        break;
      case 'pwd':
        handlers.addOutput('/home/mint-ai');
        break;
      case 'date':
        handlers.addOutput(new Date().toString());
        break;
      case 'whoami':
        handlers.addOutput('mint-ai-user');
        break;
      case 'help':
        handlers.addInfo('Available commands: clear, echo, pwd, date, whoami, help, ls, cat, uname');
        handlers.addOutput('Use ↑/↓ to navigate history, Ctrl+C to clear input');
        break;
      case 'ls':
        handlers.addOutput('components/  hooks/  app/  public/  package.json  README.md');
        break;
      case 'cat':
        if (args.length === 0) {
          handlers.addError('Usage: cat <filename>');
        } else {
          handlers.addOutput(`[File: ${args[0]}]`);
          handlers.addOutput('(File content would be displayed here)');
        }
        break;
      case 'uname':
        if (args.includes('-a')) {
          handlers.addOutput('mint-ai 1.0.0 Linux x86_64 GNU/Linux');
        } else {
          handlers.addOutput('mint-ai');
        }
        break;
      case 'hostname':
        handlers.addOutput('mint-ai');
        break;
      case 'env':
        handlers.addOutput('NODE_ENV=development');
        handlers.addOutput('PATH=/usr/local/bin:/usr/bin');
        break;
      case 'exit':
        handlers.addInfo('Type Cmd+T to create a new terminal, or close this tab');
        break;
      default:
        handlers.addError(`Command not found: ${command}`);
        handlers.addInfo('Type "help" for available commands');
    }
  };

  // Handle keyboard input with session-aware history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!activeSessionId) return;
      
      const sessionHistory = getSessionHistory(activeSessionId);
      const currentIndex = sessionHistoryIndex.get(activeSessionId) ?? sessionHistory.length;
      
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, newIndex));
        setInput(sessionHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!activeSessionId) return;
      
      const sessionHistory = getSessionHistory(activeSessionId);
      const currentIndex = sessionHistoryIndex.get(activeSessionId) ?? sessionHistory.length;
      
      if (currentIndex < sessionHistory.length - 1) {
        const newIndex = currentIndex + 1;
        setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, newIndex));
        setInput(sessionHistory[newIndex]);
      } else {
        // Clear input when at end of history
        setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, sessionHistory.length));
        setInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setInput('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  }, [input, activeSessionId, sessionHistoryIndex, getSessionHistory, processCommand, clear]);

  // Copy line content
  const copyLine = useCallback((line: TerminalLine) => {
    navigator.clipboard.writeText(line.content);
    setCopiedId(line.id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  // Get styling for line type
  const getLineStyle = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'command':
        return 'text-blue-400 font-medium';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-yellow-400';
      case 'input':
        return 'text-gray-300';
      default:
        return 'text-gray-100';
    }
  };

  // Get prompt prefix
  const getPromptPrefix = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'command':
        return '❯';
      case 'error':
        return '✖';
      case 'success':
        return '✓';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  // Handle config changes
  const handleConfigChange = (key: keyof TerminalConfig, value: string | number) => {
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
    const handleKeyDown = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      if ((keyboardEvent.metaKey || keyboardEvent.ctrlKey) && keyboardEvent.key === 't') {
        e.preventDefault();
        createSession();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createSession]);

  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-[#0d1117]',
        state.isFullscreen && 'fixed inset-0 z-50'
      )}
      onClick={focusInput}
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
          {activeSessionId && (
            <span className="text-xs text-gray-500">
              /home/mint-ai
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* History Navigation */}
          <button
            onClick={() => {
              if (!activeSessionId) return;
              const sessionHistory = getSessionHistory(activeSessionId);
              const currentIndex = sessionHistoryIndex.get(activeSessionId) ?? sessionHistory.length;
              
              if (currentIndex > 0) {
                const newIndex = currentIndex - 1;
                setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, newIndex));
                setInput(sessionHistory[newIndex]);
              }
            }}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
            title="Previous command (↑)"
          >
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => {
              if (!activeSessionId) return;
              const sessionHistory = getSessionHistory(activeSessionId);
              const currentIndex = sessionHistoryIndex.get(activeSessionId) ?? sessionHistory.length;
              
              if (currentIndex < sessionHistory.length - 1) {
                const newIndex = currentIndex + 1;
                setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, newIndex));
                setInput(sessionHistory[newIndex]);
              } else {
                setInput('');
                setSessionHistoryIndex(prev => new Map(prev).set(activeSessionId, sessionHistory.length));
              }
            }}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
            title="Next command (↓)"
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {/* Clear */}
          <button
            onClick={clear}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
            title="Clear (Ctrl+L)"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          {/* Fullscreen */}
          <button
            onClick={() => setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
            title={state.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {state.isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        className="flex-1 overflow-y-auto p-3 font-mono text-sm scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent"
        style={{ 
          fontSize: config.fontSize,
          fontFamily: config.fontFamily
        }}
      >
        {lines.length === 0 ? (
          <div className="text-gray-500 text-sm">
            <p className="mb-1">Welcome to Mint AI Terminal</p>
            <p className="opacity-60">Type &quot;help&quot; for available commands</p>
            <p className="opacity-40 text-xs mt-2">Cmd+T to open new terminal</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line) => (
              <div 
                key={line.id} 
                className={cn(
                  'flex items-start gap-2 group hover:bg-[#161b22] -mx-2 px-2 py-0.5 rounded cursor-pointer',
                  getLineStyle(line.type)
                )}
                onClick={() => copyLine(line)}
              >
                {/* Prompt/Type Icon */}
                <span className="opacity-50 text-xs mt-0.5">{getPromptPrefix(line.type)}</span>
                
                {/* Content */}
                <span className="flex-1 whitespace-pre-wrap break-all">
                  {line.content}
                </span>
                
                {/* Copy Button */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedId === line.id ? (
                    <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  ) : (
                    <CopyIcon className="w-3 h-3 text-gray-400 mt-0.5" />
                  )}
                </span>
              </div>
            ))}
            
            {/* Processing indicator */}
            {state.isProcessing && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="animate-spin">
                  <Play className="w-3 h-3" />
                </span>
                <span>Processing...</span>
              </div>
            )}
            
            {/* Input Line */}
            <div className="flex items-center gap-2 text-gray-100 mt-1">
              <span className="text-blue-400">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600"
                autoFocus
              />
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={linesEndRef} />
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-t border-[#30363d] text-xs text-gray-500">
        <span>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <span>↑↓ Navigate</span>
          <span>Ctrl+C Clear</span>
          <span>Cmd+T New</span>
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
                <option value="dark">Dark</option>
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
}

export default TerminalPanel;
