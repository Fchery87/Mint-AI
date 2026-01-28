'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CyberBadge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ClaudeLayoutProps {
  // Left panel (File Explorer)
  leftPanel: React.ReactNode;
  leftCollapsed?: boolean;
  onLeftCollapse?: (collapsed: boolean) => void;
  
  // Center-Left panel (Chat/Terminal)
  centerLeftPanel: React.ReactNode;
  
  // Center-Right panel (Code Editor)
  centerRightPanel: React.ReactNode;
  
  // Right panel (Terminal/Output)
  rightPanel: React.ReactNode;
  rightCollapsed?: boolean;
  onRightCollapse?: (collapsed: boolean) => void;
  
  // Layout options
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  minCenterLeftWidth?: number;
  minCenterRightWidth?: number;
  minRightWidth?: number;
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
  centerLeftPanel,
  centerRightPanel,
  rightPanel,
  rightCollapsed = false,
  onRightCollapse,
  defaultLeftWidth = 260,
  defaultRightWidth = 350,
  minLeftWidth = 200,
  minCenterLeftWidth = 300,
  minCenterRightWidth = 300,
  minRightWidth = 280,
  className,
  actionBar,
  onCommandPalette,
  onFileSearch,
}: ClaudeLayoutProps) {
  // Panel widths (center is flexible, splits remaining space)
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [centerLeftWidth, setCenterLeftWidth] = useState(0); // Dynamic
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingCenter, setIsResizingCenter] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizerRef = useRef<HTMLDivElement>(null);
  const centerResizerRef = useRef<HTMLDivElement>(null);
  const rightResizerRef = useRef<HTMLDivElement>(null);

  // Calculate center panel widths on mount and resize
  useEffect(() => {
    const updateCenterWidths = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const leftOpen = !leftCollapsed ? leftWidth : 0;
        const rightOpen = !rightCollapsed ? rightWidth : 0;
        const availableWidth = containerWidth - leftOpen - rightOpen;
        const centerSplit = availableWidth / 2;
        setCenterLeftWidth(centerSplit);
      }
    };

    updateCenterWidths();
    window.addEventListener('resize', updateCenterWidths);
    return () => window.removeEventListener('resize', updateCenterWidths);
  }, [leftCollapsed, leftWidth, rightCollapsed, rightWidth]);

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

  // Handle center panel split resize
  useEffect(() => {
    if (!isResizingCenter) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const leftOffset = leftCollapsed ? 0 : leftWidth;
      const relativeX = e.clientX - containerRect.left - leftOffset;
      const minWidth = minCenterLeftWidth;
      const maxWidth = (containerRect.width - leftOffset - rightWidth) - minCenterRightWidth;
      
      if (relativeX >= minWidth && relativeX <= maxWidth) {
        setCenterLeftWidth(relativeX);
      }
    };

    const handleMouseUp = () => {
      setIsResizingCenter(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingCenter, leftCollapsed, leftWidth, rightWidth, minCenterLeftWidth, minCenterRightWidth]);

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
      // Cmd/Ctrl + [ to toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        onLeftCollapse?.(!leftCollapsed);
      }
      // Cmd/Ctrl + ] to toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        onRightCollapse?.(!rightCollapsed);
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
  }, [leftCollapsed, rightCollapsed, isFullscreen, onLeftCollapse, onRightCollapse, onCommandPalette, onFileSearch]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex h-full overflow-hidden bg-void-black cyber-grid opacity-90',
        isFullscreen && 'fixed inset-0 z-50',
        className,
        'border-2 border-border'
      )}
    >
      {/* Left Panel - File Explorer */}
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
              {/* Left Panel Header - Cyberpunk */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-primary shadow-neon-sm animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
                    Files
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onLeftCollapse?.(true)}
                    className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-primary hover:bg-primary/10 hover:shadow-neon-sm transition-all duration-fast group"
                    title="Collapse (Cmd+[)"
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
          title="Expand Files (Cmd+[)"
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

        {/* Center Panels Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center-Left Panel - Chat/Terminal */}
          <div 
            className="flex-shrink-0 flex flex-col"
            style={{ width: centerLeftWidth }}
          >
            {centerLeftPanel}
          </div>

          {/* Center Resizer */}
          <div
            ref={centerResizerRef}
            onMouseDown={() => {
              setIsResizingCenter(true);
            }}
            className={cn(
              'w-1.5 cursor-col-resize bg-border/40 hover:bg-secondary/40 hover:shadow-neon-secondary-sm active:bg-secondary/60 active:shadow-neon-secondary transition-all duration-fast flex-shrink-0',
              isResizingCenter && 'bg-secondary/60 shadow-neon-secondary-sm',
              'group'
            )}
            title="Drag to resize panels"
          />

          {/* Center-Right Panel - Code Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {centerRightPanel}
          </div>
        </div>
      </div>

      {/* Right Collapsed Toggle */}
      {rightCollapsed && (
        <button
          onClick={() => onRightCollapse?.(false)}
          className="w-10 flex-shrink-0 bg-muted/10 hover:bg-tertiary/20 hover:border-tertiary hover:shadow-neon-tertiary-sm transition-all duration-fast flex items-center justify-center border-l border-border/60 cyber-chamfer-sm"
          title="Expand Terminal (Cmd+])"
        >
          <PanelRightOpen size={14} className="text-muted-foreground hover:text-tertiary transition-colors" />
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

      {/* Right Panel - Terminal/Output */}
      <AnimatePresence mode="wait">
        {!rightCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-l border-border/60 bg-card/40 backdrop-blur-sm hover:border-tertiary/40 transition-colors duration-slow"
            style={{ minWidth: minRightWidth }}
          >
            <div className="h-full flex flex-col">
              {/* Right Panel Header - Cyberpunk */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
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
                    onClick={() => onRightCollapse?.(true)}
                    className="p-1.5 cyber-chamfer-sm border border-border/40 hover:border-tertiary hover:bg-tertiary/10 hover:shadow-neon-tertiary-sm transition-all duration-fast group"
                    title="Collapse (Cmd+])"
                  >
                    <PanelRightClose size={12} className="text-muted-foreground group-hover:text-tertiary transition-colors" />
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
    </div>
  );
}

export default ClaudeLayout;
