"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
  storageKey?: string;
}

export const ResizablePanels = ({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 400,
  minLeftWidth = 300,
  maxLeftWidth = 800,
  className,
  storageKey = "resizable-panels-width",
}: ResizablePanelsProps) => {
  // Load saved width from localStorage or use default
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from localStorage after hydration to avoid mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        // Ensure saved value is within bounds
        if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
          setLeftWidth(parsed);
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Constrain width between min and max
      const constrainedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save width to localStorage when dragging ends
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, leftWidth.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, leftWidth, storageKey]);

  return (
    <div ref={containerRef} className={cn("flex h-full overflow-hidden", className)}>
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}px` }}
        className="flex-shrink-0 overflow-hidden"
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "group relative flex w-1 cursor-col-resize items-center justify-center bg-border/40 transition-colors hover:bg-border",
          isDragging && "bg-primary"
        )}
      >
        {/* Visible drag handle */}
        <div
          className={cn(
            "absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100",
            isDragging && "opacity-100"
          )}
        >
          <div className="flex h-12 w-4 items-center justify-center rounded-md bg-muted shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
};
