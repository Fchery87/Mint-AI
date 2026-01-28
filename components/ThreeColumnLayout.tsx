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
import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  // Left panel (Files)
  leftPanel: React.ReactNode;
  leftCollapsed?: boolean;
  onLeftCollapse?: (collapsed: boolean) => void;
  
  // Center panel (Chat)
  centerPanel: React.ReactNode;
  
  // Right panel (Preview/Artifacts)
  rightPanel: React.ReactNode;
  rightCollapsed?: boolean;
  onRightCollapse?: (collapsed: boolean) => void;
  
  // Layout options
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
}

export function ThreeColumnLayout({
  leftPanel,
  leftCollapsed = false,
  onLeftCollapse,
  centerPanel,
  rightPanel,
  rightCollapsed = false,
  onRightCollapse,
  defaultLeftWidth = 280,
  defaultRightWidth = 400,
  minLeftWidth = 220,
  minRightWidth = 320,
  className,
}: ThreeColumnLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizerRef = useRef<HTMLDivElement>(null);
  const rightResizerRef = useRef<HTMLDivElement>(null);

  // Handle left panel resize
  useEffect(() => {
    if (!isResizingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= minLeftWidth && newWidth <= 600) {
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
      if (newWidth >= minRightWidth && newWidth <= 800) {
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
      // F11 or Cmd/Ctrl + Shift + F for fullscreen
      if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f')) {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftCollapsed, rightCollapsed, isFullscreen, onLeftCollapse, onRightCollapse]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex h-full overflow-hidden bg-background',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Left Panel - Files/Context */}
      <AnimatePresence mode="wait">
        {!leftCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: leftWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-sm"
            style={{ minWidth: minLeftWidth }}
          >
            <div className="h-full flex flex-col">
              {/* Left Panel Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Files
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onLeftCollapse?.(true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Collapse (Cmd+[)"
                  >
                    <PanelLeftClose size={14} />
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
          onMouseDown={() => setIsResizingLeft(true)}
          className={cn(
            'w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors flex-shrink-0',
            isResizingLeft && 'bg-primary/40'
          )}
        />
      )}

      {/* Left Collapsed Toggle */}
      {leftCollapsed && (
        <button
          onClick={() => onLeftCollapse?.(false)}
          className="w-8 flex-shrink-0 hover:bg-muted/50 transition-colors flex items-center justify-center border-r border-border/40"
          title="Expand Files (Cmd+[)"
        >
          <PanelLeftOpen size={14} className="text-muted-foreground" />
        </button>
      )}

      {/* Center Panel - Chat */}
      <div className="flex-1 min-w-0 flex flex-col">
        {centerPanel}
      </div>

      {/* Right Collapsed Toggle */}
      {rightCollapsed && (
        <button
          onClick={() => onRightCollapse?.(false)}
          className="w-8 flex-shrink-0 hover:bg-muted/50 transition-colors flex items-center justify-center border-l border-border/40"
          title="Expand Preview (Cmd+])"
        >
          <PanelRightOpen size={14} className="text-muted-foreground" />
        </button>
      )}

      {/* Right Resizer */}
      {!rightCollapsed && (
        <div
          ref={rightResizerRef}
          onMouseDown={() => setIsResizingRight(true)}
          className={cn(
            'w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors flex-shrink-0',
            isResizingRight && 'bg-primary/40'
          )}
        />
      )}

      {/* Right Panel - Preview/Artifacts */}
      <AnimatePresence mode="wait">
        {!rightCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 border-l border-border/40 bg-card/30 backdrop-blur-sm"
            style={{ minWidth: minRightWidth }}
          >
            <div className="h-full flex flex-col">
              {/* Right Panel Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
                  >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    onClick={() => onRightCollapse?.(true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Collapse (Cmd+])"
                  >
                    <PanelRightClose size={14} />
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

export default ThreeColumnLayout;
