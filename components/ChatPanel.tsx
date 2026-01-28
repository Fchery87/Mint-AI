import { useRef, useState, memo, useCallback, useMemo } from "react";
import { Cpu, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberButton } from "@/components/ui";
import { SkillComposer } from "@/components/SkillComposer";
import type { SkillChainItem } from "@/components/SkillComposer";
import MessageItem, { type ChatMessage, type ThinkingItem } from "@/components/MessageItem";
import { ThinkingBlock } from "@/components/ThinkingBlock";
import { StreamingIndicator } from "@/components/StreamingIndicator";
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

// Re-export types for consumers
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
  // Plan approval props
  planStatus?: PlanStatus;
  canStartBuild?: boolean;
  hasUnansweredQuestions?: boolean;
  onApprovePlan?: () => void;
  onReviewPlan?: () => void;
  // Enhanced code action props
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

  // Memoize callback handlers to prevent unnecessary re-renders of children
  const handleSubmit = useCallback((message: PromptInputMessage) => {
    if (message.text.trim() && !isLoading) {
      onSendMessage(message.text);
      if (message.files && message.files.length > 0) {
        console.log("Attachments received:", message.files);
      }
    }
  }, [isLoading, onSendMessage]);

  const handleExecuteSkillChain = useCallback(async (chain: SkillChainItem[]) => {
    const enabledSkills = chain.filter(item => item.enabled).map(item => item.skill);
    console.log("Executing skill chain:", enabledSkills);
    // TODO: Implement actual skill chain execution
    // For now, just send a message with the skill chain info
    onSendMessage(`Execute skill chain: ${enabledSkills.join(" → ")}`);
  }, [onSendMessage]);

  const handleSaveSkillChain = useCallback((chain: SkillChainItem[]) => {
    const enabledSkills = chain.filter(item => item.enabled).map(item => item.skill);
    console.log("Saving skill chain:", enabledSkills);
    // TODO: Implement skill chain persistence
  }, []);

  // Memoize the toggle handler
  const toggleSkillComposer = useCallback(() => {
    setShowSkillComposer(prev => !prev);
  }, []);

  // Memoize the back button handler
  const handleBackToChat = useCallback(() => {
    setShowSkillComposer(false);
  }, []);

  // Memoize suggestion click handler
  const handleSuggestionClick = useCallback((title: string) => {
    onSendMessage(title);
  }, [onSendMessage]);

  // Memoize messages list to prevent unnecessary re-renders
  // Must be at top level before any conditional returns (Rules of Hooks)
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

  if (showSkillComposer) {
    return (
      <div className="flex flex-col h-full">
        {/* Header - Cyberpunk */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm bg-secondary shadow-neon-secondary-sm animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">
              Skill_Composer
            </span>
          </div>
          <button
            onClick={handleBackToChat}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider font-mono cyber-chamfer-sm border border-border/40 hover:border-secondary hover:bg-secondary/10 hover:shadow-neon-secondary-sm transition-all duration-fast"
          >
            ← Back to Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SkillComposer
            onExecute={handleExecuteSkillChain}
            onSave={handleSaveSkillChain}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Cyberpunk */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-primary shadow-neon-sm animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Chat_Interface
          </span>
        </div>
        <button
          onClick={toggleSkillComposer}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider font-mono cyber-chamfer-sm border border-border/40 hover:border-primary hover:bg-primary/10 hover:shadow-neon-sm transition-all duration-fast group"
        >
          <span className="text-primary group-hover:text-primary transition-colors">⚡ SKILL_COMPOSER</span>
          {showSkillComposer ? "▼" : "▶"}
        </button>
      </div>

      {/* Messages - Cyberpunk Empty State */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 cyber-grid">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-sm w-full space-y-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-6">
                  <Cpu size={48} className="text-primary shadow-neon animate-pulse" />
                </div>
                <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-primary">
                  How can I help you?
                </h2>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                  Describe the system you want to build and I'll generate the code.
                </p>
              </div>
              
              <div className="grid gap-2">
                {[
                  { title: "Create a todo app", desc: "With tasks & completion" },
                  { title: "Build a login form", desc: "With validation & styling" },
                  { title: "Dashboard cards", desc: "With charts & stats" },
                ].map((item, i) => (
                  <CyberButton
                    key={i}
                    onClick={() => handleSuggestionClick(item.title)}
                    variant="outline"
                    className="w-full justify-start text-left group"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-mono font-bold uppercase text-sm group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                        {item.desc}
                      </div>
                    </div>
                  </CyberButton>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Active Thinking Timeline - Shows during streaming */}
            <AnimatePresence>
              {isLoading && activeSkill && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <StreamingIndicator 
                    skill={activeSkill}
                    status={`${activeSkill.type} // ${activeSkill.stage}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {messageList}

            {/* Streaming Indicator at bottom */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span className="uppercase tracking-wider">
                      {activeSkill ? `${activeSkill.stage}...` : "Processing..."}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - Cyberpunk */}
      <div className="p-4 border-t border-border/60 bg-muted/20 backdrop-blur-sm">
        <PromptInputProvider onSubmit={handleSubmit}>
          <PromptInput
            globalDrop
            multiple
            className="cyber-chamfer-md bg-card/40 border-2 border-border/60 focus-within:border-primary focus-within:shadow-neon-sm transition-all duration-fast"
          >
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachmentCard data={attachment} />}
            </PromptInputAttachments>
            <PromptInputBody>
              <PromptInputTextarea
                ref={textareaRef}
                placeholder="> Describe the system you want to build..."
                className="font-mono uppercase tracking-wider placeholder:text-muted-foreground/60"
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
        <div className="text-[10px] text-center text-muted-foreground mt-3 font-mono uppercase tracking-wider">
          <span className="text-primary terminal-prompt">{'>'}</span> MINT_AI_PROTOCOL // CAUTION: MAY CONTAIN ERRORS
        </div>
      </div>
    </div>
  );
}

// Memoize the ChatPanel component to prevent unnecessary re-renders
export default memo(ChatPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.status === nextProps.status &&
    prevProps.activeSkill === nextProps.activeSkill &&
    prevProps.planStatus === nextProps.planStatus &&
    prevProps.canStartBuild === nextProps.canStartBuild &&
    prevProps.hasUnansweredQuestions === nextProps.hasUnansweredQuestions
  );
});
