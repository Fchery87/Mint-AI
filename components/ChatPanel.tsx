import { useRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { ThinkingBlock } from "@/components/ThinkingBlock";
import { SkillBadge, SkillThinkingIndicator } from "@/components/SkillBadge";
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

interface ThinkingItem {
  content: string;
  thinkingType: string;
  isComplete: boolean;
}

interface Message {
  role: string;
  content: string;
  thinking?: ThinkingItem[];
  toolResults?: string;
  skill?: {
    type: SkillType;
    stage: string;
  };
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  status?: "ready" | "submitting" | "streaming" | "error";
  activeSkill?: {
    type: SkillType;
    stage: string;
    confidence?: number;
  } | null;
}

export default function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  messagesEndRef,
  activeSkill,
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={cn(
                  "flex flex-col w-full gap-2",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* Thinking Blocks (for assistant messages with thinking) */}
                {msg.role === "assistant" && msg.thinking && msg.thinking.map((thinking, tIdx) => (
                  <ThinkingBlock
                    key={tIdx}
                    content={thinking.content}
                    thinkingType={thinking.thinkingType}
                    isStreaming={idx === messages.length - 1 && !thinking.isComplete}
                    isComplete={thinking.isComplete}
                    className="w-full max-w-[85%]"
                  />
                ))}
                
                {/* Tool Results */}
                {msg.role === "assistant" && msg.toolResults && (
                  <div className="w-full max-w-[85%] bg-zinc-900/50 rounded-xl p-3 border border-zinc-500/10 font-mono text-[11px] text-zinc-400 mt-1">
                    <div className="flex items-center gap-2 text-zinc-500 mb-2 border-b border-zinc-500/10 pb-1">
                      <div className="w-2 h-2 rounded-full bg-zinc-600" />
                      <span>Workspace Action Result</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{msg.toolResults.trim()}</pre>
                  </div>
                )}
                
                {/* Message Content */}
                {(msg.content || msg.role === "user") && (
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/10"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Skill Badge for assistant messages */}
                {msg.role === "assistant" && msg.skill && (
                  <div className="ml-1">
                    <SkillBadge skill={msg.skill} size="sm" showStage={false} />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && !messages[messages.length - 1]?.content && (!messages[messages.length - 1]?.thinking || messages[messages.length - 1]?.thinking?.length === 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start gap-2"
              >
                {activeSkill ? (
                  <SkillThinkingIndicator skill={activeSkill} />
                ) : (
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.1s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  </div>
                )}
              </motion.div>
            )}
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
