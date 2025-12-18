"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import ProjectPreviewPanel from "@/components/ProjectPreviewPanel";
import { ResizablePanels } from "@/components/ResizablePanels";
import type { ChatRequest } from "./api/chat/route";
import { Terminal } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { parseProjectOutput, type ProjectOutput } from "@/lib/project-types";
import { detectLanguage } from "@/lib/language-detection";
import { checkCodeQuality, formatQualityReport } from "@/lib/code-quality-check";

interface ChatMessage {
  role: string;
  content: string;
  reasoning?: string;
  isReasoningComplete?: boolean;
}

type OutputFormat = string; // Any language/framework

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const [componentCode, setComponentCode] = useState("");
  const [projectOutput, setProjectOutput] = useState<ProjectOutput | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("React"); // Track current language (for future UI display)
  const [inputStatus, setInputStatus] = useState<"ready" | "submitting" | "streaming" | "error">("ready");
  const [sessionCost, setSessionCost] = useState<{ cost: string; tokens: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Detect the intended language/framework from the message
    const detectedLanguage = detectLanguage(message);
    setOutputFormat(detectedLanguage);

    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInputStatus("submitting");

    // Add placeholder for assistant message (will be updated as stream arrives)
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", reasoning: "" }]);

    try {
      const chatRequest: ChatRequest = {
        message,
        chatId,
        outputFormat: detectedLanguage, // Use detected language directly, not state
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
      let streamedReasoning = "";
      let accumulatedCode = ""; // Track full code for incremental parsing

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "reasoning-chunk") {
                // Update reasoning content
                streamedReasoning += data.content;
                setInputStatus("streaming");
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    reasoning: streamedReasoning,
                    isReasoningComplete: false,
                  };
                  return updated;
                });
              } else if (data.type === "reasoning-complete") {
                // Mark reasoning as complete
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    isReasoningComplete: true,
                  };
                  return updated;
                });
              } else if (data.type === "explanation-chunk") {
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
              } else if (data.type === "code-chunk") {
                // Update code preview
                streamedCode += data.content;
                accumulatedCode += data.content;
                setComponentCode(streamedCode);

                // Try to parse incrementally for project mode
                const parsed = parseProjectOutput(accumulatedCode);
                if (parsed.type === "project" && parsed.files.length > 0) {
                  setProjectOutput(parsed);
                }
              } else if (data.type === "done") {
                // Final response with extracted code
                if (!chatId) {
                  setChatId(data.chatId);
                }
                setComponentCode(data.code);
                
                // Parse the response to detect project mode
                const parsed = parseProjectOutput(data.code);
                setProjectOutput(parsed);

                // Run quality check (development mode only)
                if (process.env.NODE_ENV === 'development') {
                  const qualityResult = checkCodeQuality(data.code, detectedLanguage);
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

                toast.success(parsed.type === "project" ? "Project generated!" : "Component generated!");
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn("Failed to parse SSE data:", e);
            }
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

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          {sessionCost && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-mint-500/10 border border-mint-500/20 rounded-full text-xs font-medium text-mint-600 dark:text-mint-400">
              <Terminal size={12} />
              <span>{sessionCost.tokens} · {sessionCost.cost}</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {outputFormat}
          </div>
          <ModeToggle />
        </div>
      </motion.header>

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
                {!componentCode && !isLoading && messages.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 pointer-events-none">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Terminal size={32} />
                      </div>
                      <p className="text-lg font-medium">Ready to build</p>
                    </div>
                  </div>
                ) : null}
                {projectOutput?.type === "project" ? (
                  <ProjectPreviewPanel
                    files={projectOutput.files}
                    projectName={projectOutput.name}
                    isStreaming={isLoading}
                  />
                ) : (
                  <PreviewPanel componentCode={componentCode} isStreaming={isLoading} />
                )}
              </div>
            </motion.div>
          }
        />
      </div>
    </main>
  );
}
