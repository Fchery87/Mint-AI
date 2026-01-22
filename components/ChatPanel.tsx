import { useRef } from "react";
import { Logo } from "@/components/ui/logo";
import { MessageItem, type ChatMessage, type ThinkingItem } from "@/components/MessageItem";
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
}

export default function ChatPanel({
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
}: ChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim() && !isLoading) {
      onSendMessage(message.text);
      if (message.files && message.files.length > 0) {
        console.log("Attachments received:", message.files);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-sm w-full space-y-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-6">
                  <Logo className="scale-150" hideText />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">How can I help you?</h2>
                <p className="text-sm text-muted-foreground">
                  Describe the UI component you want to build and I'll generate the code for you.
                </p>
              </div>
              
              <div className="grid gap-2">
                {[
                  { title: "Create a todo app", desc: "With tasks & completion" },
                  { title: "Build a login form", desc: "With validation & styling" },
                  { title: "Dashboard cards", desc: "With charts & stats" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(item.title)}
                    className="group relative p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 text-left transition-all duration-200"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
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
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <PromptInputProvider onSubmit={handleSubmit}>
          <PromptInput
            globalDrop
            multiple
            className="rounded-xl bg-muted/50 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
          >
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachmentCard data={attachment} />}
            </PromptInputAttachments>
            <PromptInputBody>
              <PromptInputTextarea
                ref={textareaRef}
                placeholder="Describe what you want to build..."
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
        <div className="text-[10px] text-center text-muted-foreground mt-2">
          Mint AI can make mistakes. Please check the code.
        </div>
      </div>
    </div>
  );
}
