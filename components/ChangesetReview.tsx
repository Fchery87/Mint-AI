'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, FilePlus, FileEdit, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingChange } from '@/lib/workspace';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ChangesetReviewProps {
  pendingChanges: Record<string, PendingChange>;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onAcceptFile: (path: string) => void;
  onRejectFile: (path: string) => void;
  onOpenDiffModal: (path: string) => void;
  className?: string;
}

interface FileGroupProps {
  directory: string;
  files: PendingChange[];
  onAcceptFile: (path: string) => void;
  onRejectFile: (path: string) => void;
  onOpenDiffModal: (path: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// File Group (collapsed by directory)
// ─────────────────────────────────────────────────────────────────────────────

function FileGroup({ directory, files, onAcceptFile, onRejectFile, onOpenDiffModal }: FileGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground font-mono">
          {directory || '/'}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/20">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 transition-colors group"
                >
                  {file.status === 'new' ? (
                    <FilePlus className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <FileEdit className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <button
                    onClick={() => onOpenDiffModal(file.path)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="text-sm font-medium truncate hover:text-primary transition-colors">
                      {file.path.split('/').pop()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {file.status === 'new' ? 'New file' : 'Modified'} • {file.language}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptFile(file.path);
                      }}
                      className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Accept this file"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectFile(file.path);
                      }}
                      className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Reject this file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ChangesetReview Component
// ─────────────────────────────────────────────────────────────────────────────

export function ChangesetReview({
  pendingChanges,
  onAcceptAll,
  onRejectAll,
  onAcceptFile,
  onRejectFile,
  onOpenDiffModal,
  className,
}: ChangesetReviewProps) {
  const fileList = Object.values(pendingChanges);

  // Group files by directory
  const groupedFiles = useMemo(() => {
    const groups: Record<string, PendingChange[]> = {};
    for (const file of fileList) {
      const parts = file.path.split('/');
      const dir = parts.slice(0, -1).join('/') || '/';
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }
    return groups;
  }, [fileList]);

  const newFilesCount = fileList.filter((f) => f.status === 'new').length;
  const modifiedFilesCount = fileList.filter((f) => f.status === 'modified').length;

  if (fileList.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-card/50 rounded-xl border border-border/40 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Pending Changes</h3>
            <p className="text-xs text-muted-foreground">
              {newFilesCount > 0 && <span className="text-green-500">{newFilesCount} new</span>}
              {newFilesCount > 0 && modifiedFilesCount > 0 && ' • '}
              {modifiedFilesCount > 0 && <span className="text-blue-500">{modifiedFilesCount} modified</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAcceptAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Accept All
          </button>
          <button
            onClick={onRejectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject All
          </button>
        </div>
      </div>

      {/* File Groups */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {Object.entries(groupedFiles).map(([dir, files]) => (
          <FileGroup
            key={dir}
            directory={dir}
            files={files}
            onAcceptFile={onAcceptFile}
            onRejectFile={onRejectFile}
            onOpenDiffModal={onOpenDiffModal}
          />
        ))}
      </div>
    </div>
  );
}

export default ChangesetReview;
