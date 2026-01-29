import { useRef, useState, memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, Sparkles, ClipboardList, Hammer, Plus, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SkillChainItem } from "@/components/SkillComposer";
import MessageItem, { type ChatMessage, type ThinkingItem } from "@/components/MessageItem";
import { SkillBadge } from "@/components/SkillBadge";
import {
  PromptInputProvider,
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachmentCard,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSpeechButton,
  PromptInputMessage,
} from "@/components/prompt-input";
import { SkillType } from "@/types/skill";
import { PlanStatus } from "@/types/plan-build";
import { cn } from "@/lib/utils";

const SkillComposer = dynamic(
  () => import("@/components/SkillComposer").then((mod) => mod.SkillComposer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    ),
  }
);

export type { ChatMessage, ThinkingItem };

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  status?: "ready" | "submitting" | "streaming" | "error";
  activeSkill?: {
    type: SkillType;
    stage: string;
    confidence?: number;
  } | null;
  mode?: "plan" | "build";
  onModeChange?: (mode: "plan" | "build") => void;
  planStatus?: PlanStatus;
  canStartBuild?: boolean;
  hasUnansweredQuestions?: boolean;
  onApprovePlan?: () => void;
  onReviewPlan?: () => void;
  onRunCode?: (code: string, language: string) => void;
  onDiffCode?: (before: string, after: string) => void;
  onApplyCode?: (code: string, filename?: string) => void;
  onApplyArtifact?: (files: Array<{ path: string; code: string }>) => void;
  onCopyCode?: (code: string) => void;
}

function ChatPanelComponent({
  messages,
  isLoading,
  onSendMessage,
  messagesEndRef,
  activeSkill,
  mode = "build",
  onModeChange,
  planStatus,
  canStartBuild,
  hasUnansweredQuestions,
  onApprovePlan,
  onReviewPlan,
  onRunCode,
  onDiffCode,
  onApplyCode,
  onApplyArtifact,
  onCopyCode,
}: ChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSkillComposer, setShowSkillComposer] = useState(false);

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    if (message.text.trim() && !isLoading) {
      onSendMessage(message.text);
    }
  }, [isLoading, onSendMessage]);

  const messageList = useMemo(() => messages.map((msg, idx) => (
    <MessageItem
      key={idx}
      message={msg}
      isLatest={idx === messages.length - 1}
      isStreaming={isLoading}
      activeSkill={activeSkill}
      planStatus={planStatus}
      canStartBuild={canStartBuild}
      hasUnansweredQuestions={hasUnansweredQuestions}
      onApprovePlan={onApprovePlan}
      onReviewPlan={onReviewPlan}
      onRunCode={onRunCode}
      onDiffCode={onDiffCode}
      onApplyCode={onApplyCode}
      onApplyArtifact={onApplyArtifact}
      onCopyCode={onCopyCode}
    />
  )), [messages, isLoading, activeSkill, planStatus, canStartBuild, hasUnansweredQuestions, onApprovePlan, onReviewPlan, onRunCode, onDiffCode, onApplyCode, onApplyArtifact, onCopyCode]);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">AI Chat</span>
          {activeSkill && (
            <SkillBadge skill={activeSkill} size="sm" showStage={false} />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
            <Plus size={16} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-2 border-b border-border">
        <button
          onClick={() => onModeChange?.("plan")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === "plan"
              ? "bg-accent text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <ClipboardList size={14} />
          Plan
        </button>
        <button
          onClick={() => onModeChange?.("build")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === "build"
              ? "bg-accent text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Hammer size={14} />
          Build
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles size={24} className="text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">How can I help?</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Ask me to write code, explain concepts, or help you build something.
              </p>
            </div>
            <div className="grid gap-2 w-full max-w-xs">
              {[
                "Create a React component",
                "Explain this code",
                "Build a REST API",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="w-full px-4 py-2.5 text-sm text-left text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messageList}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-sidebar">
        <PromptInputProvider onSubmit={handleSubmit}>
          <PromptInput
            globalDrop
            multiple
            className="bg-card border border-border rounded-xl focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all"
          >
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachmentCard data={attachment} />}
            </PromptInputAttachments>
            <PromptInputBody>
              <PromptInputTextarea
                ref={textareaRef}
                placeholder="Type something..."
                className="placeholder:text-muted-foreground/60 min-h-[44px] max-h-32"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputSpeechButton textareaRef={textareaRef} />
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>AI may produce inaccurate information</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.activeSkill === nextProps.activeSkill &&
    prevProps.mode === nextProps.mode &&
    prevProps.planStatus === nextProps.planStatus &&
    prevProps.canStartBuild === nextProps.canStartBuild &&
    prevProps.hasUnansweredQuestions === nextProps.hasUnansweredQuestions
  );
});
