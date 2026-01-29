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

interface TerminalTabsProps {
  onAddSession: () => void;
  onConfigClick?: () => void;
}

export function TerminalTabs({ onAddSession, onConfigClick }: TerminalTabsProps) {
  const { sessions, activeSessionId, setActiveSession, closeSession, renameSession } = useTerminalContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <div className="flex items-center border-b bg-muted/50 border-border">
      {/* Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-track-transparent">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 min-w-0 border-r cursor-pointer transition-colors border-border',
              activeSessionId === session.id
                ? 'bg-background border-t-2 border-t-accent'
                : 'hover:bg-background/50 border-t-2 border-t-transparent'
            )}
            onClick={() => setActiveSession(session.id)}
          >
            {/* Drag Handle (hidden unless needed) */}
            <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0 text-muted-foreground" />
            
            {/* Terminal Icon */}
            <Terminal className={cn(
              'w-3.5 h-3.5 flex-shrink-0',
              activeSessionId === session.id 
                ? 'text-accent' 
                : 'text-muted-foreground'
            )} />
            
            {/* Tab Name */}
            {editingId === session.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                className="text-sm px-1 py-0.5 rounded border outline-none w-24 bg-background text-foreground border-accent"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={cn(
                'text-sm truncate max-w-32',
                activeSessionId === session.id 
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
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
                className="p-0.5 rounded transition-colors hover:bg-muted"
                title="Rename"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
              
              {/* Close */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
                }}
                className={cn(
                  'p-0.5 rounded transition-colors hover:bg-muted',
                  sessions.length <= 1 && 'opacity-50 cursor-not-allowed'
                )}
                disabled={sessions.length <= 1}
                title="Close"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Add Tab Button */}
        <button
          onClick={onAddSession}
          className="flex items-center gap-1 px-2 py-2 transition-colors border-r hover:bg-background/50 border-border"
          title="New Terminal (Cmd+T)"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-1 px-2">
        {/* Config Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1.5 rounded transition-colors hover:bg-muted"
            title="Terminal Settings"
          >
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform text-muted-foreground',
              dropdownOpen && 'rotate-180'
            )} />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-xl py-1 min-w-48 border bg-popover border-border">
                <button
                  onClick={() => {
                    onConfigClick?.();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-foreground hover:bg-muted"
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
