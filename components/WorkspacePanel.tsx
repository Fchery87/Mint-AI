"use client";

import { useEffect, useMemo, useState, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Code,
  Diff,
  Download,
  FileCode,
  FolderTree,
  MoreVertical,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WorkspaceState, PendingChange } from "@/lib/workspace";
import { getLanguageForPath, workspaceToProjectFiles } from "@/lib/workspace";

import { PreviewRouter } from "@/components/PreviewRouter";
import { ChangesetReview } from "@/components/ChangesetReview";
import { unifiedDiffForFile } from "@/lib/diff";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

// Lazy load Monaco Editor - heavy component
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading editor...</span>
        </div>
      </div>
    ),
  }
);


type Tab = "preview" | "editor" | "diff";

interface WorkspacePanelProps {
  workspace: WorkspaceState | null;
  isStreaming?: boolean;
  readOnly?: boolean;
  pendingChanges?: Record<string, PendingChange>;
  onSelectPath: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onResetWorkspace: () => void;
  onRevertFile: (path: string) => void;
  onRevertAll: () => void;
  onCreateCheckpoint: () => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onDownloadZip: () => void;
  onDownloadPatch: () => void;
  onAcceptPendingChange?: (path: string) => void;
  onRejectPendingChange?: (path: string) => void;
  onAcceptAllPendingChanges?: () => void;
  onRejectAllPendingChanges?: () => void;
  onOpenDiffModal?: (path: string) => void;
}

function WorkspacePanelComponent({
  workspace,
  isStreaming = false,
  readOnly = false,
  pendingChanges = {},
  onSelectPath,
  onUpdateFile,
  onResetWorkspace,
  onRevertFile,
  onRevertAll,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  onDownloadZip,
  onDownloadPatch,
  onAcceptPendingChange,
  onRejectPendingChange,
  onAcceptAllPendingChanges,
  onRejectAllPendingChanges,
  onOpenDiffModal,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Switch to Editor while tokens stream, then users can Preview once finished
  useEffect(() => {
    if (isStreaming) setActiveTab("editor");
  }, [isStreaming]);

  // Close Actions menu on outside click / escape
  useEffect(() => {
    if (!actionsOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActionsOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-actions-menu]")) return;
      setActionsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [actionsOpen]);

  const isDark = mounted && resolvedTheme === "dark";

  const files = workspace?.files || {};
  const baseFiles = workspace?.baseFiles;
  const activePath = workspace?.activePath || Object.keys(files)[0] || "";
  const activeContent = activePath ? files[activePath] || "" : "";
  const activeLanguage = activePath ? getLanguageForPath(activePath) : "plaintext";

  // File tree removed - we use the left sidebar FileExplorer instead

  const diffText = useMemo(() => {
    if (!workspace || !baseFiles || !activePath) return "";
    const before = baseFiles[activePath] ?? "";
    const after = files[activePath] ?? "";
    return unifiedDiffForFile(before, after, activePath);
  }, [workspace, baseFiles, files, activePath]);

  // Get preview type for the workspace
  const workspaceFiles = useMemo(() => {
    if (!workspace) return [];
    return workspaceToProjectFiles(files);
  }, [workspace, files]);

  const topBar = (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-muted/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border/40">
          <TabButton
            icon={<FileCode size={14} />}
            active={activeTab === "preview"}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </TabButton>
          <TabButton
            icon={<Code size={14} />}
            active={activeTab === "editor"}
            onClick={() => setActiveTab("editor")}
          >
            Editor
          </TabButton>
          <TabButton
            icon={<Diff size={14} />}
            active={activeTab === "diff"}
            onClick={() => setActiveTab("diff")}
          >
            Diff
          </TabButton>
        </div>

        {workspace && (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <FolderTree size={14} />
            <span>{Object.keys(files).length} files</span>
            {activePath ? (
              <span className="font-mono text-muted-foreground/70">
                · {activePath}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isStreaming && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Generating...
          </span>
        )}

        {workspace && !readOnly && (
          <div className="relative" data-actions-menu>
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/40"
              )}
              title="Workspace actions"
            >
              <MoreVertical size={14} />
              <span className="hidden sm:inline">Actions</span>
            </button>

            {actionsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border/40 bg-background shadow-lg overflow-hidden z-20">
                <div className="p-2 space-y-1">
                  <MenuItem
                    onClick={() => {
                      setActionsOpen(false);
                      onCreateCheckpoint();
                    }}
                  >
                    <Save size={14} />
                    Create checkpoint
                  </MenuItem>

                  {workspace.checkpoints.length > 0 ? (
                    <div className="px-2 py-2">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        Restore checkpoint
                      </div>
                      <select
                        className="w-full h-9 text-xs bg-background border border-border/40 rounded-lg px-2 text-muted-foreground"
                        value=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          setActionsOpen(false);
                          onRestoreCheckpoint(id);
                          e.currentTarget.value = "";
                        }}
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {workspace.checkpoints
                          .slice()
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="h-px bg-border/40 my-1" />

                  <MenuItem
                    onClick={() => {
                      setActionsOpen(false);
                      onDownloadZip();
                    }}
                  >
                    <Download size={14} />
                    Download ZIP
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      if (!workspace.baseFiles) {
                        toast.error("No base snapshot to diff against yet");
                        return;
                      }
                      setActionsOpen(false);
                      onDownloadPatch();
                    }}
                  >
                    <Diff size={14} />
                    Download patch
                  </MenuItem>

                  <div className="h-px bg-border/40 my-1" />

                  <MenuItem
                    onClick={() => {
                      setActionsOpen(false);
                      onRevertAll();
                    }}
                  >
                    <RotateCcw size={14} />
                    Revert all to base
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      setActionsOpen(false);
                      onResetWorkspace();
                    }}
                    danger
                  >
                    <Trash2 size={14} />
                    Reset workspace
                  </MenuItem>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!workspace) {
    return (
      <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
        {topBar}
        <div className="flex-1 flex items-center justify-center text-muted-foreground/40">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">No workspace yet</p>
            <p className="text-xs">Generate code in Agent mode to populate files.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      {topBar}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col bg-editor">
          {/* File header for Editor mode */}
          {activeTab === "editor" && activePath && (
            <div className="flex items-center gap-2 px-4 py-2 min-w-0 bg-card border-b border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="ml-3 text-xs text-muted-foreground/60 font-mono truncate min-w-0">
                {activePath}
              </span>
              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                <FileCode size={12} />
                {activeLanguage.toUpperCase()}
              </div>
              {!readOnly && baseFiles && baseFiles[activePath] !== activeContent && (
                <button
                  onClick={() => onRevertFile(activePath)}
                  className="ml-2 text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 border border-border/40 text-muted-foreground"
                  title="Revert this file to base"
                >
                  Revert file
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto bg-editor">
            {activeTab === "preview" ? (
              isStreaming ? (
                <div className="h-full flex items-center justify-center text-muted-foreground/60">
                  <div className="text-center space-y-2 px-6">
                    <p className="text-sm font-medium">Preview paused while streaming</p>
                    <p className="text-xs">
                      Switch to Editor to watch code stream, then preview once generation finishes.
                    </p>
                  </div>
                </div>
              ) : (
                <PreviewRouter
                  files={workspaceFiles}
                  projectType={workspace.mode}
                  projectName={workspace.projectName}
                  activePath={activePath}
                  onSelectPath={onSelectPath}
                  readOnly={readOnly}
                />
              )
            )             : activeTab === "editor" ? (
              <div className="h-full flex flex-col">
                <MonacoEditor
                  height="100%"
                  language={activeLanguage}
                  theme={isDark ? "vs-dark" : "light"}
                  value={activeContent}
                  onChange={(value) => onUpdateFile(activePath, value || "")}
                  options={{
                    readOnly: readOnly || isStreaming,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            ) : activeTab === "diff" ? (
              <div className="min-h-full">
                {diffText ? (
                  <div className="flex">
                    <div className="flex-1 overflow-x-auto py-4 px-4">
                      {mounted ? (
                        <SyntaxHighlighter
                          language="diff"
                          style={isDark ? oneDark : oneLight}
                          customStyle={{
                            margin: 0,
                            padding: 0,
                            background: "transparent",
                            fontSize: "12px",
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily:
                                "'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
                            },
                          }}
                          wrapLongLines={false}
                        >
                          {diffText}
                        </SyntaxHighlighter>
                      ) : (
                        <pre className="text-foreground font-mono text-xs whitespace-pre">
                          {diffText}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground/60">
                    <div className="text-center space-y-2 px-6">
                      <p className="text-sm font-medium">No changes</p>
                      <p className="text-xs">
                        This file matches the last generated base snapshot.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  active,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function MenuItem({
  onClick,
  children,
  danger = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted/60"
      )}
      type="button"
    >
      {children}
    </button>
  );
}

// Memoize the WorkspacePanel component
export default memo(WorkspacePanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.workspace === nextProps.workspace &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.pendingChanges === nextProps.pendingChanges
  );
});
