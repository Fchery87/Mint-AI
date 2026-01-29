import { useRef, useState, memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, Sparkles, ClipboardList, Hammer, Plus, MoreHorizontal, HelpCircle, Send, Check, Eye } from "lucide-react";
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

interface ClarifyingQuestion {
  id: string;
  question: string;
  required: boolean;
  options?: string[];
  answer?: string;
}

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
  clarifyingQuestions?: ClarifyingQuestion[];
  onAnswerQuestion?: (questionId: string, answer: string) => void;
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
  clarifyingQuestions = [],
  onAnswerQuestion,
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
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    if (message.text.trim() && !isLoading) {
      onSendMessage(message.text);
    }
  }, [isLoading, onSendMessage]);

  // Mode-specific suggestions
  const planModeSuggestions = [
    "Design a new feature for my app",
    "Analyze this codebase structure",
    "Create an implementation plan",
  ];

  const buildModeSuggestions = [
    "Create a React component",
    "Build a REST API endpoint",
    "Add authentication to my app",
  ];

  const suggestions = mode === "plan" ? planModeSuggestions : buildModeSuggestions;

  // Mode-specific placeholder
  const placeholderText = mode === "plan"
    ? "Describe what you want to build. I'll create a detailed plan..."
    : "Ask me to implement the next step or make changes...";

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
      <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50">
        <button
          onClick={() => onModeChange?.("plan")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            mode === "plan"
              ? "bg-accent text-accent-foreground shadow-sm"
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
              ? "bg-teal-500 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Switch to Build mode - generate code directly"
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
              {suggestions.map((suggestion) => (
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

      {/* Clarifying Questions - Only show in Plan mode with unanswered questions */}
      {mode === "plan" && clarifyingQuestions.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-amber-500" />
            <span className="text-sm font-medium">Questions for You</span>
            {hasUnansweredQuestions && (
              <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                Action needed
              </span>
            )}
          </div>
          <div className="space-y-2">
            {clarifyingQuestions.filter(q => !q.answer).map((question) => (
              <div key={question.id} className="p-2 rounded bg-card border border-border">
                <p className="text-sm mb-2">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {question.options ? (
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          onAnswerQuestion?.(question.id, option);
                        }}
                        className="px-3 py-1 text-xs bg-background border border-border rounded hover:bg-muted transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={questionAnswers[question.id] || ""}
                      onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const answer = questionAnswers[question.id];
                          if (answer?.trim()) {
                            onAnswerQuestion?.(question.id, answer.trim());
                            setQuestionAnswers(prev => {
                              const next = { ...prev };
                              delete next[question.id];
                              return next;
                            });
                          }
                        }
                      }}
                      placeholder="Type your answer..."
                      className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button
                      onClick={() => {
                        const answer = questionAnswers[question.id];
                        if (answer?.trim()) {
                          onAnswerQuestion?.(question.id, answer.trim());
                          setQuestionAnswers(prev => {
                            const next = { ...prev };
                            delete next[question.id];
                            return next;
                          });
                        }
                      }}
                      disabled={!questionAnswers[question.id]?.trim()}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Approval Actions - Show when plan is ready and no unanswered questions */}
      {mode === "plan" && planStatus === PlanStatus.READY && !hasUnansweredQuestions && (
        <div className="px-4 py-3 border-t border-border bg-accent/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-foreground">Plan ready for approval</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onReviewPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              >
                <Eye size={14} />
                Review
              </button>
              <button
                onClick={onApprovePlan}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
              >
                <Check size={14} />
                Approve & Build
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder={placeholderText}
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
    prevProps.hasUnansweredQuestions === nextProps.hasUnansweredQuestions &&
    prevProps.clarifyingQuestions === nextProps.clarifyingQuestions
  );
});
