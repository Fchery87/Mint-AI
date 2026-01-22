'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThinkingLabel, getStageInfo, getToolLabel } from '@/lib/streaming';
import {
  useChatStream,
  type ThinkingItem,
  type ToolItem,
  type ChatMessage,
  type UseChatStreamOptions,
} from '@/lib/hooks/use-streaming';

// Re-export the hook and types for backwards compatibility
export { useChatStream };
export type { ThinkingItem, ToolItem, ChatMessage, UseChatStreamOptions };

// Thinking Block Component
function ThinkingBlock({ 
  thinking, 
  isStreaming 
}: { 
  thinking: ThinkingItem; 
  isStreaming: boolean;
}) {
  const info = getThinkingLabel(thinking.thinkingType);
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) setIsOpen(true);
  }, [isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-mint-200/60 bg-mint-50/30 dark:border-mint-700/40 dark:bg-mint-950/20 overflow-hidden',
        'max-w-[85%]'
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-mint-100/50 dark:hover:bg-mint-900/20 transition-colors"
      >
        <span className="text-base">{info.icon}</span>
        <span className={cn('text-xs font-semibold', `text-${info.color}-600`)}>
          {info.label}
        </span>
        {isStreaming && (
          <span className="flex gap-1 ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-bounce [animation-delay:0.1s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-bounce [animation-delay:0.2s]" />
          </span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 ml-auto transition-transform', isOpen && 'rotate-180')} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 border-t border-mint-200/60 dark:border-mint-700/40">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {thinking.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Tool Call Component
function ToolBlock({ tool }: { tool: ToolItem }) {
  const info = getToolLabel(tool.toolName);
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/60 dark:border-amber-700/40 max-w-[85%]">
      <span className="text-sm">{info.icon}</span>
      <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
        {info.label}
      </span>
      {tool.status === 'running' && (
        <Loader2 className="w-3 h-3 animate-spin ml-auto text-amber-600" />
      )}
      {tool.status === 'complete' && (
        <CheckCircle className="w-3 h-3 ml-auto text-green-600" />
      )}
    </div>
  );
}

// Progress Indicator Component
function ProgressIndicator({ progress }: { progress: { stage: string; message: string; percent?: number } }) {
  const stage = getStageInfo(progress.stage);
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full max-w-[85%]">
      <span className="text-base animate-pulse">{stage.icon}</span>
      <span className="text-sm text-muted-foreground">{progress.message}</span>
      {progress.percent !== undefined && (
        <span className="text-xs text-muted-foreground ml-auto">{progress.percent}%</span>
      )}
    </div>
  );
}

// Main ChatPanel Component using the streaming hook
interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<Response>;
  className?: string;
}

export function ChatPanel({ onSendMessage, className }: ChatPanelProps) {
  const { messages, isLoading, progress, sendMessage, abort } = useChatStream({ onSendMessage });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex flex-col gap-2',
              msg.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            {/* User message */}
            {msg.role === 'user' && (
              <div className="max-w-[80%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-br-sm">
                {msg.content}
              </div>
            )}

            {/* Assistant message */}
            {msg.role === 'assistant' && (
              <>
                {/* Thinking blocks */}
                {msg.thinking?.map((t, ti) => (
                  <ThinkingBlock key={ti} thinking={t} isStreaming={isLoading && idx === messages.length - 1 && !t.isComplete} />
                ))}

                {/* Tool calls */}
                {msg.tools?.map((tool, ti) => (
                  <ToolBlock key={ti} tool={tool} />
                ))}

                {/* Progress indicator */}
                {idx === messages.length - 1 && isLoading && progress && (
                  <ProgressIndicator progress={progress} />
                )}

                {/* Active skill */}
                {msg.skill && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                    <span>{getStageInfo(msg.skill.stage).icon}</span>
                    <span className="text-xs font-medium">{getStageInfo(msg.skill.stage).label}</span>
                  </div>
                )}

                {/* Content */}
                {msg.content && (
                  <div className="max-w-[85%] px-4 py-3 bg-muted rounded-2xl rounded-bl-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
              </>
            )}
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isLoading && !progress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 px-4 py-2 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={abort}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
