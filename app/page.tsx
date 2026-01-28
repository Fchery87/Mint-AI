"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { XTermPanel } from "@/components/terminal/XTermPanel";
import { TerminalProvider } from "@/components/terminal/TerminalProvider";
import WorkspacePanel from "@/components/WorkspacePanel";
import { ClaudeLayout } from "@/components/ClaudeLayout";
import FileExplorer from "@/components/FileExplorer";
import { Terminal } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { Header } from "@/components/HeaderPlanBuild";
import { unifiedDiffForFiles } from "@/lib/diff";
import { downloadProjectAsZip, downloadTextFile } from "@/lib/download";
import { usePlanBuildContext } from "@/lib/contexts/PlanBuildContext";
import { PlanReviewModal } from "@/components/PlanReviewModal";
import { useChat } from "@/hooks/useChat";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTerminal } from "@/hooks/useTerminal";
import { useState } from "react";

export default function Home() {
  // Plan/Build context
  const planBuildContext = usePlanBuildContext();
  const {
    mode,
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

  // Claude Layout state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Plan approval handlers
  const handleApprovePlan = useCallback(() => {
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
    setShowPlanReviewModal(true);
  }, []);

  // Wrapper for sendMessage that integrates with workspace and plan
  const handleSendMessage = useCallback(async (message: string) => {
    await sendMessage(message, {
      mode,
      webSearch,
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        title: currentPlan.title,
        currentStepIndex: currentPlan.currentStepIndex,
        steps: currentPlan.steps,
      } : null,
      onPlanParsed: (parsedPlan) => {
        setPlan(parsedPlan as Parameters<typeof setPlan>[0]);
      },
      onWorkspaceUpdate: (output) => {
        updateWorkspaceFromOutput(output, mode);
      },
      onCheckpoint: () => {
        // Create checkpoint before generation in build mode
        if (workspace) {
          const label = `Before generation (${new Date().toLocaleString()})`;
          createCheckpoint(label);
        }
      },
      onTerminalLine: (content, type) => {
        addTerminalLine(content, type);
      },
    });
  }, [sendMessage, mode, webSearch, currentPlan, setPlan, updateWorkspaceFromOutput, workspace, createCheckpoint, addTerminalLine]);

  // Pending changes handlers
  const handleOpenDiffModal = useCallback((path: string) => {
    selectPath(path);
  }, [selectPath]);

  // Enhanced message action handlers
  const handleRunCode = useCallback((_code: string, language: string) => {
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

  // Terminal panel content
  const terminalPanel = (
    <TerminalProvider>
      <XTermPanel
        onCommand={async (command) => {
          await executeCommand(command);
        }}
      />
    </TerminalProvider>
  );

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

      {/* Claude Layout - 4 Panel: Files | Chat | Editor | Terminal */}
      <div className="flex-1 overflow-hidden">
        <ClaudeLayout
          leftCollapsed={leftPanelCollapsed}
          onLeftCollapse={setLeftPanelCollapsed}
          rightCollapsed={bottomPanelCollapsed}
          onRightCollapse={setBottomPanelCollapsed}
          defaultLeftWidth={260}
          defaultRightWidth={350}
          minLeftWidth={200}
          minRightWidth={280}
          leftPanel={
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
          centerLeftPanel={
            <div className="h-full flex flex-col bg-card/30">
              <ChatPanel
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                messagesEndRef={messagesEndRef}
                status={inputStatus}
                activeSkill={activeSkill}
                planStatus={currentPlan?.status}
                canStartBuild={canStartBuild}
                hasUnansweredQuestions={hasUnansweredQuestions}
                onApprovePlan={handleApprovePlan}
                onReviewPlan={handleReviewPlan}
                onRunCode={handleRunCode}
                onDiffCode={handleDiffCode}
                onApplyCode={handleApplyCode}
                onApplyArtifact={handleApplyArtifact}
                onCopyCode={handleCopyCode}
              />
            </div>
          }
          centerRightPanel={
            <div className="h-full flex flex-col">
              <div className="flex-1 rounded-xl border border-border/40 bg-background shadow-sm overflow-hidden relative">
                {!displayWorkspace && !isLoading && messages.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Terminal size={32} />
                      </div>
                      <p className="text-lg font-medium">Ready to build</p>
                      <p className="text-sm">Describe what you want to create</p>
                    </div>
                  </div>
                ) : null}
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
              </div>
            </div>
          }
          rightPanel={terminalPanel}
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
