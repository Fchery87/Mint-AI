'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CyberBadge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ClaudeLayoutProps {
  // Left panel (Chat)
  leftPanel: React.ReactNode;
  leftCollapsed?: boolean;
  onLeftCollapse?: (collapsed: boolean) => void;
  
  // Center panel (Code Editor)
  centerPanel: React.ReactNode;
  minCenterWidth?: number;
  
  // Right panel (File Explorer)
  rightPanel: React.ReactNode;
  rightCollapsed?: boolean;
  onRightCollapse?: (collapsed: boolean) => void;
  
  // Bottom panel (Terminal)
  bottomPanel: React.ReactNode;
  bottomCollapsed?: boolean;
  onBottomCollapse?: (collapsed: boolean) => void;
  
  // Layout options
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  defaultBottomHeight?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  minBottomHeight?: number;
  className?: string;
  
  // Action bar
  actionBar?: React.ReactNode;
  onCommandPalette?: () => void;
  onFileSearch?: () => void;
}

export function ClaudeLayout({
  leftPanel,
  leftCollapsed = false,
  onLeftCollapse,
  centerPanel,
  minCenterWidth = 400,
  rightPanel,
  rightCollapsed = false,
  onRightCollapse,
  bottomPanel,
  bottomCollapsed = false,
  onBottomCollapse,
  defaultLeftWidth = 320,
  defaultRightWidth = 280,
  defaultBottomHeight = 200,
  minLeftWidth = 240,
  minRightWidth = 200,
  minBottomHeight = 120,
  className,
  actionBar,
  onCommandPalette,
  onFileSearch,
}: ClaudeLayoutProps) {
  // Panel dimensions
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [bottomHeight, setBottomHeight] = useState(defaultBottomHeight);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizerRef = useRef<HTMLDivElement>(null);
  const rightResizerRef = useRef<HTMLDivElement>(null);
  const bottomResizerRef = useRef<HTMLDivElement>(null);



  // Handle left panel resize
  useEffect(() => {
    if (!isResizingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= minLeftWidth && newWidth <= 400) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, minLeftWidth]);

  // Handle bottom panel resize
  useEffect(() => {
    if (!isResizingBottom) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      if (newHeight >= minBottomHeight && newHeight <= 600) {
        setBottomHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingBottom(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingBottom, minBottomHeight]);

  // Handle right panel resize
  useEffect(() => {
    if (!isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      if (newWidth >= minRightWidth && newWidth <= 600) {
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight, minRightWidth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1 to toggle left panel (Chat)
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        onLeftCollapse?.(!leftCollapsed);
      }
      // Cmd/Ctrl + 2 to toggle right panel (Files)
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        onRightCollapse?.(!rightCollapsed);
      }
      // Cmd/Ctrl + ` to toggle bottom panel (Terminal)
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        onBottomCollapse?.(!bottomCollapsed);
      }
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
      }
      // Cmd/Ctrl + P for file search
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        onFileSearch?.();
      }
      // F11 or Cmd/Ctrl + Shift + F for fullscreen
      if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f')) {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftCollapsed, rightCollapsed, bottomCollapsed, isFullscreen, onLeftCollapse, onRightCollapse, onBottomCollapse, onCommandPalette, onFileSearch]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex flex-col h-full overflow-hidden bg-void-black cyber-grid opacity-90',
        isFullscreen && 'fixed inset-0 z-50',
        className,
        'border-2 border-border'
      )}
    >
      {/* Main Content Area - Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Chat */}
      <AnimatePresence mode="wait">
        {!leftCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: leftWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors duration-slow"
            style={{ minWidth: minLeftWidth }}
          >
            <div className="h-full flex flex-col">
              {/* Left Panel Header - Chat */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-primary shadow-neon-sm animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
                    Chat
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onLeftCollapse?.(true)}
                    className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-primary hover:bg-primary/10 hover:shadow-neon-sm transition-all duration-fast group"
                    title="Collapse Chat (Cmd+1)"
                  >
                    <PanelLeftClose size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Left Panel Content */}
              <div className="flex-1 overflow-hidden">
                {leftPanel}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Resizer */}
      {!leftCollapsed && (
        <div
          ref={leftResizerRef}
          onMouseDown={() => {
            setIsResizingLeft(true);
          }}
          className={cn(
            'w-1.5 cursor-col-resize bg-border/40 hover:bg-primary/40 hover:shadow-neon-sm active:bg-primary/60 active:shadow-neon transition-all duration-fast flex-shrink-0',
            isResizingLeft && 'bg-primary/60 shadow-neon-sm',
            'group'
          )}
          title="Drag to resize"
        />
      )}

      {/* Left Collapsed Toggle */}
      {leftCollapsed && (
        <button
          onClick={() => onLeftCollapse?.(false)}
          className="w-10 flex-shrink-0 bg-muted/10 hover:bg-primary/20 hover:border-primary hover:shadow-neon-sm transition-all duration-fast flex items-center justify-center border-r border-border/60 cyber-chamfer-sm"
          title="Expand Chat (Cmd+1)"
        >
          <PanelLeftOpen size={14} className="text-muted-foreground hover:text-primary transition-colors" />
        </button>
      )}

      {/* Center Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Action Bar */}
        {actionBar && (
          <div className="flex-shrink-0 border-b border-border/60 bg-muted/20 backdrop-blur-sm">
            {actionBar}
          </div>
        )}

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: minCenterWidth }}>
          {centerPanel}
        </div>
      </div>

      {/* Right Collapsed Toggle */}
      {rightCollapsed && (
        <button
          onClick={() => onRightCollapse?.(false)}
          className="w-10 flex-shrink-0 bg-muted/10 hover:bg-secondary/20 hover:border-secondary hover:shadow-neon-secondary-sm transition-all duration-fast flex items-center justify-center border-l border-border/60 cyber-chamfer-sm"
          title="Expand Files (Cmd+2)"
        >
          <PanelRightOpen size={14} className="text-muted-foreground hover:text-secondary transition-colors" />
        </button>
      )}

      {/* Right Resizer */}
      {!rightCollapsed && (
        <div
          ref={rightResizerRef}
          onMouseDown={() => {
            setIsResizingRight(true);
          }}
          className={cn(
            'w-1.5 cursor-col-resize bg-border/40 hover:bg-tertiary/40 hover:shadow-neon-tertiary-sm active:bg-tertiary/60 active:shadow-neon-tertiary transition-all duration-fast flex-shrink-0',
            isResizingRight && 'bg-tertiary/60 shadow-neon-tertiary-sm',
            'group'
          )}
          title="Drag to resize"
        />
      )}

      {/* Right Panel - File Explorer */}
      <AnimatePresence mode="wait">
        {!rightCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-l border-border/60 bg-card/40 backdrop-blur-sm hover:border-secondary/40 transition-colors duration-slow"
            style={{ minWidth: minRightWidth }}
          >
            <div className="h-full flex flex-col">
              {/* Right Panel Header - Files */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-secondary shadow-neon-secondary-sm animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">
                    Files
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onRightCollapse?.(true)}
                    className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-secondary hover:bg-secondary/10 hover:shadow-neon-secondary-sm transition-all duration-fast group"
                    title="Collapse Files (Cmd+2)"
                  >
                    <PanelRightClose size={12} className="text-muted-foreground group-hover:text-secondary transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Right Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanel}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* End of Main Content Area */}

      {/* Bottom Panel - Terminal */}
      <AnimatePresence mode="wait">
        {!bottomCollapsed && (
          <>
            {/* Bottom Resizer */}
            <div
              ref={bottomResizerRef}
              onMouseDown={() => setIsResizingBottom(true)}
              className={cn(
                'h-1.5 cursor-row-resize bg-border/40 hover:bg-tertiary/40 hover:shadow-neon-tertiary-sm active:bg-tertiary/60 active:shadow-neon-tertiary transition-all duration-fast flex-shrink-0',
                isResizingBottom && 'bg-tertiary/60 shadow-neon-tertiary-sm'
              )}
              title="Drag to resize"
            />

            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: bottomHeight, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-t border-border/60 bg-card/40 backdrop-blur-sm hover:border-tertiary/40 transition-colors duration-slow"
              style={{ minHeight: minBottomHeight }}
            >
              <div className="h-full flex flex-col">
                {/* Bottom Panel Header - Terminal */}
                <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-tertiary shadow-neon-tertiary-sm animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-tertiary">
                      Terminal
                    </span>
                    <CyberBadge variant="tertiary" shape="sharp" className="gap-1.5">
                      <span className="text-[10px] font-mono">bash</span>
                    </CyberBadge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-tertiary hover:bg-tertiary/10 hover:shadow-neon-tertiary-sm transition-all duration-fast group"
                      title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
                    >
                      {isFullscreen ? <Minimize2 size={12} className="text-muted-foreground group-hover:text-tertiary transition-colors" /> : <Maximize2 size={12} className="text-muted-foreground group-hover:text-tertiary transition-colors" />}
                    </button>
                    <button
                      onClick={() => onBottomCollapse?.(true)}
                      className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-tertiary hover:bg-tertiary/10 hover:shadow-neon-tertiary-sm transition-all duration-fast group"
                      title="Collapse Terminal (Cmd+`)"
                    >
                      <ChevronDown size={12} className="text-muted-foreground group-hover:text-tertiary transition-colors" />
                    </button>
                  </div>
                </div>
                
                {/* Bottom Panel Content */}
                <div className="flex-1 overflow-hidden">
                  {bottomPanel}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Collapsed Toggle */}
      {bottomCollapsed && (
        <button
          onClick={() => onBottomCollapse?.(false)}
          className="h-8 flex-shrink-0 bg-muted/10 hover:bg-tertiary/20 hover:border-tertiary hover:shadow-neon-tertiary-sm transition-all duration-fast flex items-center justify-center border-t border-border/60 cyber-chamfer-sm"
          title="Expand Terminal (Cmd+`)"
        >
          <ChevronUp size={14} className="text-muted-foreground hover:text-tertiary transition-colors" />
        </button>
      )}
    </div>
  );
}

export default ClaudeLayout;
