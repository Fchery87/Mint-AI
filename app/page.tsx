"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import WorkspacePanel from "@/components/WorkspacePanel";
import { ResizablePanels } from "@/components/ResizablePanels";
import type { ChatRequest } from "./api/chat/route";
import { Header } from "@/components/Header";
import { parseProjectOutput, type ProjectOutput } from "@/lib/project-types";
import { detectLanguage } from "@/lib/language-detection";
import { checkCodeQuality, formatQualityReport } from "@/lib/code-quality-check";
import type { WorkspaceState } from "@/lib/workspace";
import {
  createCheckpoint,
  workspaceFromProjectOutput,
  workspaceFromSingleFile,
} from "@/lib/workspace";
import {
  clearWorkspace as clearWorkspaceStorage,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/workspace-storage";
import { unifiedDiffForFiles } from "@/lib/diff";
import { downloadProjectAsZip, downloadTextFile } from "@/lib/download";
import { SkillType } from "@/types/skill";

interface ThinkingItem {
  content: string;
  thinkingType: string;
  isComplete: boolean;
}

interface ChatMessage {
  role: string;
  content: string;
  thinking?: ThinkingItem[];
  skill?: {
    type: SkillType;
    stage: string;
  };
}

type OutputFormat = string; // Any language/framework

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const [componentCode, setComponentCode] = useState("");
  const [projectOutput, setProjectOutput] = useState<ProjectOutput | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("React");
  const [inputStatus, setInputStatus] = useState<"ready" | "submitting" | "streaming" | "error">("ready");
  const [sessionCost, setSessionCost] = useState<{ cost: string; tokens: string } | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [draftWorkspace, setDraftWorkspace] = useState<WorkspaceState | null>(null);
  const [agentMode, setAgentMode] = useState<"agent" | "ask">("agent");
  const [webSearch, setWebSearch] = useState(false);
  const [activeSkill, setActiveSkill] = useState<{ type: SkillType; stage: string; confidence?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load persisted workspace on first mount
  useEffect(() => {
    loadWorkspace()
      .then((ws) => {
        if (ws) setWorkspace(ws);
      })
      .catch(() => {});
  }, []);

  // Persist workspace (debounced)
  useEffect(() => {
    if (!workspace) return;
    const t = setTimeout(() => {
      saveWorkspace(workspace).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [workspace]);

  // Keep a read-only draft workspace while streaming before first commit
  useEffect(() => {
    if (workspace) {
      setDraftWorkspace(null);
      return;
    }
    if (projectOutput?.type === "project") {
      setDraftWorkspace(workspaceFromProjectOutput(projectOutput));
      return;
    }
    if (componentCode) {
      setDraftWorkspace(workspaceFromSingleFile(componentCode, outputFormat));
      return;
    }
    setDraftWorkspace(null);
  }, [workspace, projectOutput, componentCode, outputFormat]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Detect the intended language/framework from the message
    const detectedLanguage = detectLanguage(message);
    setOutputFormat(detectedLanguage);

    // Clear previous skill state
    setActiveSkill(null);

    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInputStatus("submitting");

    // Add placeholder for assistant message (will be updated as stream arrives)
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", reasoning: "" }]);

    // Safety: checkpoint current workspace before generation overwrite (Agent mode)
    if (agentMode === "agent" && workspace) {
      setWorkspace((prev) => {
        if (!prev) return prev;
        const label = `Before generation (${new Date().toLocaleString()})`;
        const cp = createCheckpoint(prev, label);
        return {
          ...prev,
          checkpoints: [cp, ...prev.checkpoints].slice(0, 25),
          updatedAt: Date.now(),
        };
      });
    }

    try {
      const chatRequest: ChatRequest = {
        message,
        chatId,
        outputFormat: detectedLanguage, // Use detected language directly, not state
        mode: agentMode,
        webSearch,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate component");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedExplanation = "";
      let streamedCode = "";
      let accumulatedCode = ""; // Track full code for incremental parsing

      if (!reader) {
        throw new Error("No response body");
      }

      // Buffer for accumulating partial SSE messages
      let sseBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;
        
        // Split on double newlines (SSE message separator)
        const messages = sseBuffer.split('\n\n');
        // Keep the last potentially incomplete message in buffer
        sseBuffer = messages.pop() || '';

        // Track thinking content by type (reset per chunk batch for accumulation)

        for (const message of messages) {
          if (!message.trim()) continue;
          
          const lines = message.split('\n');
          let eventType = '';
          let eventData = '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }
          
          if (!eventData) continue;
          
          try {
            const data = JSON.parse(eventData);

            switch (eventType) {
              case 'skill-activated':
                // Update active skill indicator
                setActiveSkill(data.skill);
                setInputStatus("streaming");
                break;
                
              case 'thinking-chunk': {
                // Update thinking content for specific thinking type
                const thinkingType = data.thinkingType;
                setInputStatus("streaming");
                setMessages((prev) => {
                  const updated = [...prev];
                  const existingThinking = updated[assistantIndex].thinking || [];
                  const existingIndex = existingThinking.findIndex(t => t.thinkingType === thinkingType);
                  
                  const newThinkingItem = {
                    content: data.content,
                    thinkingType,
                    isComplete: false,
                  };
                  
                  if (existingIndex >= 0) {
                    existingThinking[existingIndex] = newThinkingItem;
                  } else {
                    existingThinking.push(newThinkingItem);
                  }
                  
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    thinking: [...existingThinking],
                  };
                  return updated;
                });
                break;
              }
              
              case 'thinking-complete': {
                // Mark thinking as complete
                const thinkingType = data.thinkingType;
                setMessages((prev) => {
                  const updated = [...prev];
                  const existingThinking = updated[assistantIndex].thinking || [];
                  const existingIndex = existingThinking.findIndex(t => t.thinkingType === thinkingType);
                  
                  if (existingIndex >= 0) {
                    existingThinking[existingIndex] = {
                      ...existingThinking[existingIndex],
                      isComplete: true,
                    };
                  }
                  
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    thinking: [...existingThinking],
                  };
                  return updated;
                });
                break;
              }
              
              case 'explanation-chunk':
                // Update chat message with explanation
                streamedExplanation += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    content: streamedExplanation,
                  };
                  return updated;
                });
                break;
                
              case 'code-chunk':
                // Update code preview
                streamedCode += data.content;
                accumulatedCode += data.content;
                
                // Only update component code periodically to avoid render storms
                // Update when we have newlines (natural break points)
                if (data.content.includes('\n') || streamedCode.endsWith('\n')) {
                  setComponentCode(streamedCode);
                }

                // Only try to parse project output when we have complete file blocks
                // (i.e., when accumulatedCode contains closing backticks for files)
                const hasCompleteFiles = 
                  accumulatedCode.includes('```file:') && 
                  (accumulatedCode.match(/```/g) || []).length >= 2;
                
                if (hasCompleteFiles) {
                  const parsed = parseProjectOutput(accumulatedCode);
                  if (parsed.type === "project" && parsed.files.length > 0) {
                    setProjectOutput(parsed);
                  }
                }
                break;
                
              case 'done': {
                // Final response with extracted code
                if (!chatId) {
                  setChatId(data.chatId);
                }
                const hasCode = typeof data.code === "string" && data.code.trim().length > 0;
                if (hasCode) {
                  setComponentCode(data.code);

                  // Parse the response to detect project mode
                  const parsedOutput = parseProjectOutput(data.code);
                  setProjectOutput(parsedOutput);

                  // Commit to workspace in Agent mode
                  if (agentMode === "agent") {
                    setWorkspace((prev) => {
                      const next = workspaceFromProjectOutput(parsedOutput);
                      if (prev?.checkpoints?.length) {
                        next.checkpoints = prev.checkpoints;
                      }
                      return next;
                    });
                  }
                }

                // Update message with skill info
                if (data.skill) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      skill: data.skill,
                    };
                    return updated;
                  });
                }

                // Run quality check (development mode only)
                if (process.env.NODE_ENV === 'development') {
                  const qualityResult = checkCodeQuality(data.code || "", detectedLanguage);
                  console.log('=== Code Quality Check ===');
                  console.log(formatQualityReport(qualityResult));

                  if (!qualityResult.passed) {
                    console.warn('⚠️ Code quality issues detected. See report above.');
                  }
                }

                // Update session cost if available
                if (data.usage) {
                  setSessionCost({
                    cost: data.usage.cost,
                    tokens: data.usage.tokens,
                  });
                }

                if (agentMode === "ask" || !hasCode) {
                  toast.success("Answer ready!");
                } else {
                  const parsedFinal = parseProjectOutput(data.code);
                  toast.success(parsedFinal.type === "project" ? "Project generated!" : "Component generated!");
                }
                break;
              }
              
              case 'error':
                throw new Error(data.error);
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn("Failed to parse SSE data:", e, eventData);
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate component";
      toast.error(errorMessage);
      console.error("Error:", error);
      setInputStatus("error");

      // Remove the placeholder message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setTimeout(() => setInputStatus("ready"), 500);
    }
  };

  const displayWorkspace = workspace || draftWorkspace;
  const displayReadOnly = !workspace;

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header
        sessionCost={sessionCost}
        agentMode={agentMode}
        setAgentMode={setAgentMode}
        webSearch={webSearch}
        setWebSearch={setWebSearch}
        outputFormat={outputFormat}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          defaultLeftWidth={400}
          minLeftWidth={300}
          maxLeftWidth={800}
          storageKey="mint-ai-chat-width"
          leftPanel={
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="h-full flex flex-col bg-card/30"
            >
              <ChatPanel
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                messagesEndRef={messagesEndRef}
                status={inputStatus}
                activeSkill={activeSkill}
              />
            </motion.div>
          }
          rightPanel={
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="h-full flex flex-col bg-muted/30 p-4"
            >
              <div className="flex-1 rounded-xl border border-border/40 bg-background shadow-sm overflow-hidden relative">
                {!displayWorkspace && !isLoading && messages.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Terminal size={32} />
                      </div>
                      <p className="text-lg font-medium">Ready to build</p>
                    </div>
                  </div>
                ) : null}
                <WorkspacePanel
                  workspace={displayWorkspace}
                  readOnly={displayReadOnly}
                  isStreaming={isLoading}
                  onSelectPath={(path) => {
                    if (workspace) {
                      setWorkspace((prev) => (prev ? { ...prev, activePath: path } : prev));
                    } else {
                      setDraftWorkspace((prev) => (prev ? { ...prev, activePath: path } : prev));
                    }
                  }}
                  onUpdateFile={(path, content) => {
                    setWorkspace((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        files: { ...prev.files, [path]: content },
                        updatedAt: Date.now(),
                      };
                    });
                  }}
                  onResetWorkspace={async () => {
                    await clearWorkspaceStorage();
                    setWorkspace(null);
                    setDraftWorkspace(null);
                    setComponentCode("");
                    setProjectOutput(null);
                    toast.success("Workspace reset");
                  }}
                  onRevertFile={(path) => {
                    setWorkspace((prev) => {
                      if (!prev?.baseFiles) return prev;
                      return {
                        ...prev,
                        files: { ...prev.files, [path]: prev.baseFiles[path] ?? "" },
                        updatedAt: Date.now(),
                      };
                    });
                    toast.success(`Reverted ${path}`);
                  }}
                  onRevertAll={() => {
                    setWorkspace((prev) => {
                      if (!prev?.baseFiles) return prev;
                      return {
                        ...prev,
                        files: { ...prev.baseFiles },
                        updatedAt: Date.now(),
                      };
                    });
                    toast.success("Reverted all files");
                  }}
                  onCreateCheckpoint={() => {
                    setWorkspace((prev) => {
                      if (!prev) return prev;
                      const label =
                        window.prompt("Checkpoint name", `Checkpoint (${new Date().toLocaleString()})`) ||
                        `Checkpoint (${new Date().toLocaleString()})`;
                      const cp = createCheckpoint(prev, label);
                      return {
                        ...prev,
                        checkpoints: [cp, ...prev.checkpoints].slice(0, 25),
                        updatedAt: Date.now(),
                      };
                    });
                    toast.success("Checkpoint saved");
                  }}
                  onRestoreCheckpoint={(checkpointId) => {
                    setWorkspace((prev) => {
                      if (!prev) return prev;
                      const cp = prev.checkpoints.find((c) => c.id === checkpointId);
                      if (!cp) return prev;
                      return {
                        ...prev,
                        files: { ...cp.files },
                        activePath: cp.activePath,
                        updatedAt: Date.now(),
                      };
                    });
                    toast.success("Checkpoint restored");
                  }}
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
                />
              </div>
            </motion.div>
          }
        />
      </div>
    </main>
  );
}
