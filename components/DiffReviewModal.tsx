"use client";

import { useEffect, useState } from "react";
import { X, Check, AlertCircle, FileCode, FilePlus, FileEdit } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { PendingChange } from "@/lib/workspace";
import { DiffEditor } from "@monaco-editor/react";

interface DiffReviewModalProps {
  isOpen: boolean;
  pendingChanges: Record<string, PendingChange>;
  onAcceptFiles: (filePaths: string[]) => void;
  onRejectFiles: (filePaths: string[]) => void;
  onClose: () => void;
}

export function DiffReviewModal({
  isOpen,
  pendingChanges,
  onAcceptFiles,
  onRejectFiles,
  onClose,
}: DiffReviewModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Set initial active file when modal opens
  useEffect(() => {
    if (isOpen && Object.keys(pendingChanges).length > 0 && !activeFilePath) {
      setActiveFilePath(Object.keys(pendingChanges)[0]);
    }
  }, [isOpen, pendingChanges, activeFilePath]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles(new Set());
      setActiveFilePath("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = mounted && resolvedTheme === "dark";
  const fileList = Object.values(pendingChanges);
  const activeFile = activeFilePath ? pendingChanges[activeFilePath] : null;

  const toggleFileSelection = (path: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedFiles(newSet);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(Object.keys(pendingChanges)));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleAcceptSelected = () => {
    if (selectedFiles.size === 0) return;
    onAcceptFiles(Array.from(selectedFiles));
    
    // Remove accepted files from pending
    const remaining = Object.keys(pendingChanges).filter(
      (path) => !selectedFiles.has(path)
    );
    
    // If no files remain, close modal
    if (remaining.length === 0) {
      onClose();
    } else {
      // Switch to first remaining file
      setActiveFilePath(remaining[0]);
      setSelectedFiles(new Set());
    }
  };

  const handleRejectSelected = () => {
    if (selectedFiles.size === 0) return;
    onRejectFiles(Array.from(selectedFiles));
    
    // Remove rejected files from pending
    const remaining = Object.keys(pendingChanges).filter(
      (path) => !selectedFiles.has(path)
    );
    
    // If no files remain, close modal
    if (remaining.length === 0) {
      onClose();
    } else {
      // Switch to first remaining file
      setActiveFilePath(remaining[0]);
      setSelectedFiles(new Set());
    }
  };

  const handleAcceptAll = () => {
    onAcceptFiles(Object.keys(pendingChanges));
    onClose();
  };

  const handleRejectAll = () => {
    onRejectFiles(Object.keys(pendingChanges));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileCode className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Review AI Changes</h2>
            <p className="text-xs text-muted-foreground">
              {fileList.length} file{fileList.length !== 1 ? "s" : ""} pending approval
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Close without saving"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File List Sidebar */}
        <div className="w-80 border-r border-border/40 bg-card/30 flex flex-col">
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                FILES ({fileList.length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fileList.map((file) => (
              <button
                key={file.path}
                onClick={() => setActiveFilePath(file.path)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                  activeFilePath === file.path
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => toggleFileSelection(file.path)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded"
                />
                {file.status === "new" ? (
                  <FilePlus size={14} className="text-green-500" />
                ) : (
                  <FileEdit size={14} className="text-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{file.path}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {file.status === "new" ? "New file" : "Modified"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diff Editor */}
        <div className="flex-1 flex flex-col bg-background">
          {activeFile ? (
            <>
              <div className="px-4 py-2 border-b border-border/40 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">
                      {activeFile.path}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeFile.status === "new"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {activeFile.status === "new" ? "New" : "Modified"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase">
                    {activeFile.language}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {mounted ? (
                  <DiffEditor
                    height="100%"
                    language={activeFile.language}
                    original={activeFile.originalContent || ""}
                    modified={activeFile.content}
                    theme={isDark ? "vs-dark" : "light"}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full text-muted-foreground/60 text-xs">
                        Loading diff editor...
                      </div>
                    }
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/60">
              <div className="text-center space-y-2">
                <AlertCircle size={32} className="mx-auto" />
                <p className="text-sm">No file selected</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-card/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptSelected}
            disabled={selectedFiles.size === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              selectedFiles.size === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Check size={16} />
            Accept Selected ({selectedFiles.size})
          </button>
          <button
            onClick={handleRejectSelected}
            disabled={selectedFiles.size === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              selectedFiles.size === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            )}
          >
            <X size={16} />
            Reject Selected ({selectedFiles.size})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>
    </div>
  );
}
