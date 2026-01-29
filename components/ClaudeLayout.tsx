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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClaudeLayoutProps {
  // Left sidebar (File Explorer)
  leftSidebar: React.ReactNode;
  leftCollapsed?: boolean;
  onLeftCollapse?: (collapsed: boolean) => void;
  
  // Center panel (Code Editor + Terminal stacked)
  centerPanel: React.ReactNode;
  minCenterWidth?: number;
  
  // Right sidebar (AI Chat)
  rightSidebar: React.ReactNode;
  rightCollapsed?: boolean;
  onRightCollapse?: (collapsed: boolean) => void;
  
  // Layout options
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
}

export function ClaudeLayout({
  leftSidebar,
  leftCollapsed = false,
  onLeftCollapse,
  centerPanel,
  minCenterWidth = 400,
  rightSidebar,
  rightCollapsed = false,
  onRightCollapse,
  defaultLeftWidth = 260,
  defaultRightWidth = 380,
  minLeftWidth = 200,
  minRightWidth = 300,
  className,
}: ClaudeLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onLeftCollapse?.(!leftCollapsed);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        onRightCollapse?.(!rightCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftCollapsed, rightCollapsed, onLeftCollapse, onRightCollapse]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex flex-col h-full overflow-hidden bg-background',
        className
      )}
    >
      {/* Main Content Area - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - File Explorer */}
        <AnimatePresence mode="wait">
          {!leftCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: leftWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-r border-border bg-sidebar"
              style={{ minWidth: minLeftWidth }}
            >
              <div className="h-full flex flex-col overflow-hidden">
                {leftSidebar}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Resizer */}
        {!leftCollapsed && (
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            className={cn(
              'w-1 cursor-col-resize bg-transparent hover:bg-accent/50 transition-colors flex-shrink-0',
              isResizingLeft && 'bg-accent'
            )}
          />
        )}

        {/* Left Collapsed Toggle */}
        {leftCollapsed && (
          <button
            onClick={() => onLeftCollapse?.(false)}
            className="w-8 flex-shrink-0 bg-sidebar border-r border-border flex items-center justify-center hover:bg-sidebar-active transition-colors"
            title="Show Sidebar (Ctrl+B)"
          >
            <PanelLeftOpen size={14} className="text-muted-foreground" />
          </button>
        )}

        {/* Center Panel - Code Editor + Terminal (stacked) */}
        <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: minCenterWidth }}>
          {centerPanel}
        </div>

        {/* Right Collapsed Toggle */}
        {rightCollapsed && (
          <button
            onClick={() => onRightCollapse?.(false)}
            className="w-8 flex-shrink-0 bg-sidebar border-l border-border flex items-center justify-center hover:bg-sidebar-active transition-colors"
            title="Show AI Chat (Ctrl+Shift+A)"
          >
            <PanelRightOpen size={14} className="text-muted-foreground" />
          </button>
        )}

        {/* Right Resizer */}
        {!rightCollapsed && (
          <div
            onMouseDown={() => setIsResizingRight(true)}
            className={cn(
              'w-1 cursor-col-resize bg-transparent hover:bg-accent/50 transition-colors flex-shrink-0',
              isResizingRight && 'bg-accent'
            )}
          />
        )}

        {/* Right Sidebar - AI Chat */}
        <AnimatePresence mode="wait">
          {!rightCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: rightWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-l border-border bg-sidebar"
              style={{ minWidth: minRightWidth }}
            >
              <div className="h-full flex flex-col overflow-hidden">
                {rightSidebar}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ClaudeLayout;
