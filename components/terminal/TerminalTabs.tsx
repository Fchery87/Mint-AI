'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Plus, 
  X, 
  ChevronDown,
  Settings,
  Pencil,
  Check,
  GripVertical
} from 'lucide-react';
import { useTerminalContext } from './TerminalProvider';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface TerminalTabsProps {
  onAddSession: () => void;
  onConfigClick?: () => void;
}

export function TerminalTabs({ onAddSession, onConfigClick }: TerminalTabsProps) {
  const { sessions, activeSessionId, setActiveSession, closeSession, renameSession } = useTerminalContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const handleRename = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setEditName(session.name);
      setEditingId(sessionId);
    }
  };

  const handleRenameSubmit = () => {
    if (editingId && editName.trim()) {
      renameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className={cn(
      "flex items-center border-b",
      isLight ? 'bg-[#fafafa] border-gray-200' : 'bg-[#0f172a] border-gray-700'
    )}>
      {/* Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-track-transparent">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 min-w-0 border-r cursor-pointer transition-colors',
              isLight 
                ? 'border-gray-200' 
                : 'border-gray-700',
              activeSessionId === session.id
                ? isLight 
                  ? 'bg-white border-t-2 border-t-accent'
                  : 'bg-[#1e293b] border-t-2 border-t-accent'
                : isLight
                  ? 'hover:bg-white/50 border-t-2 border-t-transparent'
                  : 'hover:bg-[#1e293b]/50 border-t-2 border-t-transparent'
            )}
            onClick={() => setActiveSession(session.id)}
          >
            {/* Drag Handle (hidden unless needed) */}
            <GripVertical className={cn(
              "w-3.5 h-3.5 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0",
              isLight ? 'text-gray-400' : 'text-gray-500'
            )} />
            
            {/* Terminal Icon */}
            <Terminal className={cn(
              'w-3.5 h-3.5 flex-shrink-0',
              activeSessionId === session.id 
                ? 'text-accent' 
                : isLight ? 'text-gray-400' : 'text-gray-500'
            )} />
            
            {/* Tab Name */}
            {editingId === session.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                className={cn(
                  "text-sm px-1 py-0.5 rounded border outline-none w-24",
                  isLight 
                    ? 'bg-white text-gray-800 border-accent' 
                    : 'bg-[#0f172a] text-gray-200 border-accent'
                )}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={cn(
                'text-sm truncate max-w-32',
                activeSessionId === session.id 
                  ? isLight ? 'text-gray-800' : 'text-gray-200'
                  : isLight ? 'text-gray-500 group-hover:text-gray-700' : 'text-gray-500 group-hover:text-gray-300'
              )}>
                {session.name}
              </span>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Rename */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(session.id);
                }}
                className={cn(
                  "p-0.5 rounded transition-colors",
                  isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
                )}
                title="Rename"
              >
                <Pencil className={cn(
                  "w-3 h-3",
                  isLight ? 'text-gray-400' : 'text-gray-500'
                )} />
              </button>
              
              {/* Close */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
                }}
                className={cn(
                  'p-0.5 rounded transition-colors',
                  isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700',
                  sessions.length <= 1 && 'opacity-50 cursor-not-allowed'
                )}
                disabled={sessions.length <= 1}
                title="Close"
              >
                <X className={cn(
                  "w-3 h-3",
                  isLight ? 'text-gray-400' : 'text-gray-500'
                )} />
              </button>
            </div>
          </div>
        ))}
        
        {/* Add Tab Button */}
        <button
          onClick={onAddSession}
          className={cn(
            "flex items-center gap-1 px-2 py-2 transition-colors border-r",
            isLight 
              ? 'hover:bg-white/50 border-gray-200' 
              : 'hover:bg-[#1e293b]/50 border-gray-700'
          )}
          title="New Terminal (Cmd+T)"
        >
          <Plus className={cn(
            "w-4 h-4",
            isLight ? 'text-gray-400' : 'text-gray-500'
          )} />
        </button>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-1 px-2">
        {/* Config Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "p-1.5 rounded transition-colors",
              isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
            )}
            title="Terminal Settings"
          >
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              isLight ? 'text-gray-400' : 'text-gray-500',
              dropdownOpen && 'rotate-180'
            )} />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className={cn(
                "absolute right-0 top-full mt-1 z-20 rounded-lg shadow-xl py-1 min-w-48 border",
                isLight 
                  ? 'bg-white border-gray-200' 
                  : 'bg-[#1e293b] border-gray-700'
              )}>
                <button
                  onClick={() => {
                    onConfigClick?.();
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    isLight 
                      ? 'text-gray-700 hover:bg-gray-50' 
                      : 'text-gray-300 hover:bg-gray-700'
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Configure Terminal...
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TerminalTabs;
