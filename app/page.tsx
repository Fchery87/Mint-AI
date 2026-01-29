"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { Terminal, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { XTermPanel } from "@/components/terminal/XTermPanel";
import { TerminalProvider } from "@/components/terminal/TerminalProvider";
import WorkspacePanel from "@/components/WorkspacePanel";
import { ClaudeLayout } from "@/components/ClaudeLayout";
import FileExplorer from "@/components/FileExplorer";
import ChatPanel from "@/components/ChatPanel";
import { BuildExecutionPanel } from "@/components/BuildExecutionPanel";
import { Header } from "@/components/HeaderPlanBuild";
import { unifiedDiffForFiles } from "@/lib/diff";
import { downloadProjectAsZip, downloadTextFile } from "@/lib/download";
import { usePlanBuildContext } from "@/lib/contexts/PlanBuildContext";
import { PlanReviewModal } from "@/components/PlanReviewModal";
import { useChat } from "@/hooks/useChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTerminal } from "@/hooks/useTerminal";
import { useContextSnapshot } from "@/hooks/useContextSnapshot";
import { cn } from "@/lib/utils";

export default function Home() {
  // Plan/Build context
  const planBuildContext = usePlanBuildContext();
  const {
    mode,
    switchMode,
    currentPlan,
    setPlan,
    approvePlan,
    startBuild,
    pauseBuild,
    resumeBuild,
    statusLabel,
    canStartBuild,
    isBuilding,
    isPaused,
    hasUnansweredQuestions,
  } = planBuildContext;

  // Custom hooks for state management
  const {
    messages,
    isLoading,
    chatId,
    inputStatus,
    sessionCost,
    activeSkill,
    sendMessage,
    setChatId,
  } = useChat();

  const {
    workspace,
    draftWorkspace,
    pendingChanges,
    displayWorkspace,
    displayReadOnly,
    createFile,
    updateFile,
    deleteFile,
    renameFile,
    selectPath,
    createCheckpoint,
    restoreCheckpoint,
    revertFile,
    revertAll,
    resetWorkspace,
    acceptPendingChange,
    rejectPendingChange,
    acceptAllPendingChanges,
    rejectAllPendingChanges,
    setPendingChanges,
    updateWorkspaceFromOutput,
    setWorkspace,
    setDraftWorkspace,
  } = useWorkspace();

  const {
    addLine: addTerminalLine,
    clearTerminal,
    executeCommand,
  } = useTerminal();

  // Local UI state
  const [webSearch, setWebSearch] = useState(false);
  const [showPlanReviewModal, setShowPlanReviewModal] = useState(false);
  const [outputFormat, setOutputFormat] = useState("React");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // IDE Layout state
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  
  // Terminal state - docked in center panel
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'output'>('terminal');
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle terminal resize
  useEffect(() => {
    if (!isResizingTerminal) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 100 && newHeight <= 400) {
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingTerminal(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTerminal]);

  // Plan approval handlers
  const handleApprovePlan = useCallback(() => {
    Sentry.addBreadcrumb({
      category: 'action',
      message: 'User approved plan and started build',
      level: 'info',
      data: { 
        planId: currentPlan?.id,
        planTitle: currentPlan?.title,
        stepCount: currentPlan?.steps.length 
      }
    });
    approvePlan();
    startBuild();

    if (currentPlan) {
      const buildMessage = `Execute the approved plan: "${currentPlan.title}"

The plan contains ${currentPlan.steps.length} steps. Begin implementing step 1: ${currentPlan.steps[0]?.title || 'First step'}`;

      setTimeout(() => {
        handleSendMessage(buildMessage);
      }, 100);
    }
  }, [approvePlan, startBuild, currentPlan]);

  const handleReviewPlan = useCallback(() => {
    Sentry.addBreadcrumb({
      category: 'action',
      message: 'User opened plan review modal',
      level: 'info',
      data: { planId: currentPlan?.id }
    });
    setShowPlanReviewModal(true);
  }, [currentPlan?.id]);

  // Context snapshot hook
  const { buildContextSnapshot } = useContextSnapshot({
    workspace,
    mode,
    planId: currentPlan?.id,
    currentStepIndex: currentPlan?.currentStepIndex,
  });

  // Wrapper for sendMessage that integrates with workspace and plan
  const handleSendMessage = useCallback(async (message: string) => {
    const contextSnapshot = buildContextSnapshot();
    
    await sendMessage(message, {
      mode,
      webSearch,
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        title: currentPlan.title,
        currentStepIndex: currentPlan.currentStepIndex,
        steps: currentPlan.steps,
      } : null,
      contextSnapshot,
      onPlanParsed: (parsedPlan) => {
        setPlan(parsedPlan as Parameters<typeof setPlan>[0]);
      },
      onWorkspaceUpdate: (output) => {
        // Update workspace in both Plan and Build modes
        updateWorkspaceFromOutput(output, mode);
      },
      onPendingChange: (path, before, after) => {
        // Populate pending changes for review flow
        setPendingChanges((prev) => ({
          ...prev,
          [path]: {
            path,
            content: after,
            language: path.split('.').pop() || 'text',
            originalContent: before || undefined,
            status: before ? 'modified' : 'new',
          },
        }));
      },
      onCheckpoint: () => {
        if (workspace) {
          const label = `Before generation (${new Date().toLocaleString()})`;
          createCheckpoint(label);
        }
      },
      onTerminalLine: (content, type) => {
        addTerminalLine(content, type);
      },
    });
  }, [sendMessage, mode, webSearch, currentPlan, setPlan, updateWorkspaceFromOutput, setPendingChanges, workspace, createCheckpoint, addTerminalLine, buildContextSnapshot]);

  // Pending changes handlers
  const handleOpenDiffModal = useCallback((path: string) => {
    selectPath(path);
  }, [selectPath]);

  // Enhanced message action handlers
  const handleRunCode = useCallback((_code: string, language: string) => {
    Sentry.addBreadcrumb({
      category: 'action',
      message: 'User ran code',
      level: 'info',
      data: { language }
    });
    addTerminalLine(`Running ${language} code...`, "info");
    toast.info(`Running ${language} code...`);
  }, [addTerminalLine]);

  const handleDiffCode = useCallback(() => {
    toast.info("Diff viewer coming soon!");
  }, []);

  const handleApplyCode = useCallback((code: string, filename?: string) => {
    const filePath = filename || workspace?.activePath || "untitled.tsx";
    updateFile(filePath, code);
    toast.success(`Applied code to ${filePath}`);
  }, [updateFile, workspace?.activePath]);

  const handleApplyArtifact = useCallback((files: Array<{ path: string; code: string }>) => {
    if (files.length === 0) {
      toast.error("No files to apply");
      return;
    }

    files.forEach(({ path, code }) => {
      updateFile(path, code);
    });

    toast.success(`Applied ${files.length} file${files.length > 1 ? "s" : ""} to workspace`);
  }, [updateFile]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  }, []);

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header
        sessionCost={sessionCost}
        mode={mode}
        planStatus={currentPlan?.status || null}
        buildStatus={currentPlan?.buildStatus || null}
        progress={currentPlan?.progress || 0}
        statusLabel={statusLabel}
        isBuilding={isBuilding}
        isPaused={isPaused}
        onPauseBuild={pauseBuild}
        onResumeBuild={resumeBuild}
        webSearch={webSearch}
        setWebSearch={setWebSearch}
        outputFormat={outputFormat}
      />

      {/* IDE Layout - Left Sidebar / Center (with docked Terminal) / Right Sidebar */}
      <div className="flex-1 overflow-hidden">
        <ClaudeLayout
          // Left Sidebar - File Explorer
          leftSidebar={
            <FileExplorer
              files={workspace?.files || {}}
              activePath={workspace?.activePath || null}
              onSelectPath={selectPath}
              onCreateFile={createFile}
              onDeleteFile={deleteFile}
              onRenameFile={renameFile}
              onCreateFolder={(_path: string) => {
                toast.info("Folder creation will be available after file creation");
              }}
              projectId="mint-ai"
            />
          }
          leftCollapsed={leftSidebarCollapsed}
          onLeftCollapse={setLeftSidebarCollapsed}
          defaultLeftWidth={260}
          minLeftWidth={200}
          
          // Center Panel - Code Editor with docked Terminal
          centerPanel={
            <div className="h-full flex flex-col bg-editor">
              {/* Code Editor Area */}
              <div className={cn(
                "flex-1 overflow-hidden",
                !terminalExpanded && "flex-1"
              )}>
                {!displayWorkspace && !isLoading && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground/40">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto">
                        <Terminal size={32} className="text-accent" />
                      </div>
                      <p className="text-lg font-medium text-foreground">Ready to build</p>
                      <p className="text-sm text-muted-foreground">Describe what you want to create</p>
                    </div>
                  </div>
                ) : (
                  <WorkspacePanel
                    workspace={displayWorkspace}
                    readOnly={displayReadOnly}
                    isStreaming={isLoading}
                    onSelectPath={selectPath}
                    onUpdateFile={updateFile}
                    onResetWorkspace={resetWorkspace}
                    onRevertFile={revertFile}
                    onRevertAll={revertAll}
                    onCreateCheckpoint={() => {
                      const label = window.prompt("Checkpoint name", `Checkpoint (${new Date().toLocaleString()})`);
                      if (label) createCheckpoint(label);
                    }}
                    onRestoreCheckpoint={restoreCheckpoint}
                    onDownloadZip={async () => {
                      if (!displayWorkspace) return;
                      const filesList = Object.entries(displayWorkspace.files).map(([path, content]) => ({
                        path,
                        content,
                      }));
                      try {
                        await downloadProjectAsZip(filesList, displayWorkspace.projectName || "workspace");
                        toast.success("Downloaded ZIP");
                      } catch (e) {
                        console.error(e);
                        toast.error("Failed to download ZIP");
                      }
                    }}
                    onDownloadPatch={() => {
                      if (!workspace?.baseFiles) {
                        toast.error("No base snapshot to diff against yet");
                        return;
                      }
                      const patch = unifiedDiffForFiles(workspace.baseFiles, workspace.files);
                      if (!patch.trim()) {
                        toast.message("No changes to export");
                        return;
                      }
                      const name = `${workspace.projectName || "workspace"}.patch`;
                      downloadTextFile(patch, name, "text/x-diff;charset=utf-8");
                      toast.success(`Downloaded ${name}`);
                    }}
                    pendingChanges={pendingChanges}
                    onAcceptPendingChange={acceptPendingChange}
                    onRejectPendingChange={rejectPendingChange}
                    onAcceptAllPendingChanges={acceptAllPendingChanges}
                    onRejectAllPendingChanges={rejectAllPendingChanges}
                    onOpenDiffModal={handleOpenDiffModal}
                  />
                )}
              </div>

              {/* Terminal Section - Docked to center panel */}
              <div className="border-t border-border">
                {/* Terminal Tabs */}
                <div className="flex items-center justify-between bg-card border-b border-border">
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveBottomTab('output')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-r border-border transition-colors",
                        activeBottomTab === 'output' 
                          ? "bg-background text-foreground border-t-2 border-t-accent" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Output
                    </button>
                    <button
                      onClick={() => setActiveBottomTab('terminal')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-r border-border transition-colors",
                        activeBottomTab === 'terminal' 
                          ? "bg-background text-foreground border-t-2 border-t-accent" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Terminal size={12} />
                      Terminal
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border-r border-border transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 pr-2">
                    <button 
                      onClick={() => setTerminalExpanded(!terminalExpanded)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                      {terminalExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                    <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Terminal Content */}
                {terminalExpanded && (
                  <>
                    {/* Resize Handle */}
                    <div
                      onMouseDown={() => setIsResizingTerminal(true)}
                      className={cn(
                        "h-1 cursor-row-resize bg-transparent hover:bg-accent/50 transition-colors",
                        isResizingTerminal && "bg-accent"
                      )}
                    />
                    <div 
                      className="bg-background"
                      style={{ height: terminalHeight }}
                    >
                      <TerminalProvider>
                        <XTermPanel
                          onCommand={async (command) => {
                            await executeCommand(command);
                          }}
                        />
                      </TerminalProvider>
                    </div>
                  </>
                )}
              </div>
            </div>
          }
          minCenterWidth={400}
          
          // Right Sidebar - AI Chat
          rightSidebar={
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              messagesEndRef={messagesEndRef}
              status={inputStatus}
              activeSkill={activeSkill}
              mode={mode}
              onModeChange={switchMode}
              planStatus={currentPlan?.status}
              canStartBuild={canStartBuild}
              hasUnansweredQuestions={hasUnansweredQuestions}
              clarifyingQuestions={currentPlan?.clarifyingQuestions}
              onAnswerQuestion={planBuildContext.answerQuestion}
              onApprovePlan={handleApprovePlan}
              onReviewPlan={handleReviewPlan}
              onRunCode={handleRunCode}
              onDiffCode={handleDiffCode}
              onApplyCode={handleApplyCode}
              onApplyArtifact={handleApplyArtifact}
              onCopyCode={handleCopyCode}
            />
          }
          rightCollapsed={rightSidebarCollapsed}
          onRightCollapse={setRightSidebarCollapsed}
          defaultRightWidth={380}
          minRightWidth={300}
        />
      </div>

      {/* Plan Review Modal */}
      <PlanReviewModal
        isOpen={showPlanReviewModal}
        plan={currentPlan}
        onClose={() => setShowPlanReviewModal(false)}
        onApprove={handleApprovePlan}
        onSave={(updatedPlan) => {
          setPlan(updatedPlan);
          setShowPlanReviewModal(false);
        }}
      />
    </main>
  );
}
