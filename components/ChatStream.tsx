'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillType } from '@/types/skill';
import { getThinkingLabel, getStageInfo, getToolLabel } from '@/lib/streaming';

// Stream event types
type StreamEventType = 'skill' | 'progress' | 'thinking' | 'tool' | 'text' | 'code' | 'done' | 'error';

interface StreamEvent {
  type: StreamEventType;
  data: any;
}

interface ThinkingItem {
  thinkingType: string;
  content: string;
  isComplete: boolean;
}

interface ToolItem {
  toolName: string;
  status: 'starting' | 'running' | 'complete' | 'error';
  message?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: ThinkingItem[];
  tools?: ToolItem[];
  skill?: { type: SkillType; stage: string };
}

interface UseChatStreamOptions {
  onSendMessage: (message: string) => Promise<Response>;
  onError?: (error: Error) => void;
}

export function useChatStream({ onSendMessage, onError }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState<{ type: SkillType; stage: string } | null>(null);
  const [progress, setProgress] = useState<{ stage: string; message: string; percent?: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setActiveSkill(null);
    setProgress(null);

    // Create placeholder for assistant message
    const assistantMessage: ChatMessage = { role: 'assistant', content: '', thinking: [], tools: [] };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await onSendMessage(message);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentThinking: ThinkingItem | null = null;
      let currentTool: ToolItem | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Look for event: lines
          if (!line.startsWith('event: ')) continue;
          
          const eventType = line.slice(7).trim();
          
          // Find the data: line that follows
          let dataLine = '';
          let dataIndex = i + 1;
          while (dataIndex < lines.length && !lines[dataIndex].startsWith('data: ')) {
            dataIndex++;
          }
          if (dataIndex >= lines.length) continue;
          
          dataLine = lines[dataIndex];
          if (!dataLine.startsWith('data: ')) continue;

          // Skip processed lines
          i = dataIndex;

          try {
            const data = JSON.parse(dataLine.slice(6));
            const event: StreamEvent = { type: eventType as StreamEventType, data };

            switch (event.type) {
              case 'skill':
                setActiveSkill({ type: data.type, stage: data.stage });
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], skill: data };
                  return updated;
                });
                break;

              case 'progress':
                setProgress({ stage: data.stage, message: data.message, percent: data.percent });
                break;

              case 'thinking':
                // Handle thinking completion event (isComplete: true with no/empty content)
                if (data.isComplete) {
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    const thinking = lastMsg.thinking || [];
                    const existingIndex = thinking.findIndex(t => t.thinkingType === data.thinkingType);
                    
                    if (existingIndex >= 0) {
                      thinking[existingIndex] = { ...thinking[existingIndex], isComplete: true };
                    } else {
                      // Create new thinking item marked as complete
                      thinking.push({
                        thinkingType: data.thinkingType,
                        content: data.content || '',
                        isComplete: true,
                      });
                    }
                    
                    updated[updated.length - 1] = { ...lastMsg, thinking };
                    return updated;
                  });
                  currentThinking = null;
                  break;
                }

                // Handle normal thinking content events
                if (!currentThinking || currentThinking.thinkingType !== data.thinkingType) {
                  // Complete previous thinking if any
                  if (currentThinking) {
                    setMessages(prev => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      const thinking = lastMsg.thinking || [];
                      const existingIndex = thinking.findIndex(t => t.thinkingType === currentThinking!.thinkingType);
                      
                      if (existingIndex >= 0) {
                        thinking[existingIndex] = { ...thinking[existingIndex], isComplete: true };
                      }
                      
                      updated[updated.length - 1] = { ...lastMsg, thinking };
                      return updated;
                    });
                  }
                  currentThinking = {
                    thinkingType: data.thinkingType,
                    content: data.content || '',
                    isComplete: false,
                  };
                } else {
                  currentThinking.content += data.content || '';
                }
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  const thinking = lastMsg.thinking || [];
                  const existingIndex = thinking.findIndex(t => t.thinkingType === data.thinkingType);
                  
                  if (existingIndex >= 0) {
                    thinking[existingIndex] = currentThinking!;
                  } else {
                    thinking.push(currentThinking!);
                  }
                  
                  updated[updated.length - 1] = { ...lastMsg, thinking };
                  return updated;
                });
                break;

              case 'tool':
                currentTool = {
                  toolName: data.toolName,
                  status: data.status,
                  message: data.message,
                };
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  const tools = lastMsg.tools || [];
                  const existingIndex = tools.findIndex(t => t.toolName === data.toolName && t.status !== 'complete');
                  
                  if (existingIndex >= 0) {
                    tools[existingIndex] = currentTool!;
                  } else {
                    tools.push(currentTool!);
                  }
                  
                  updated[updated.length - 1] = { ...lastMsg, tools };
                  return updated;
                });
                break;

              case 'text':
                assistantContent += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
                  return updated;
                });
                break;

              case 'done':
                setProgress(null);
                setIsLoading(false);
                break;

              case 'error':
                throw new Error(data.error);
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      setIsLoading(false);
      // Remove assistant placeholder on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      abortControllerRef.current = null;
    }
  }, [isLoading, onSendMessage, onError]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setProgress(null);
  }, []);

  return {
    messages,
    isLoading,
    activeSkill,
    progress,
    sendMessage,
    abort,
  };
}

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
