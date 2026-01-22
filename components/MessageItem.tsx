'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThinkingBlock } from '@/components/ThinkingBlock';
import { SkillBadge, SkillThinkingIndicator } from '@/components/SkillBadge';
import { PlanContentRenderer } from '@/components/PlanContentRenderer';
import { SkillType } from '@/types/skill';
import { PlanStatus } from '@/types/plan-build';
import { CheckCircle, Loader2, Terminal, FileCode, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ThinkingItem {
  content: string;
  thinkingType: string;
  isComplete: boolean;
}

export interface ToolItem {
  toolName: string;
  status: 'starting' | 'running' | 'complete' | 'error';
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: ThinkingItem[];
  tools?: ToolItem[];
  toolResults?: string;
  skill?: {
    type: SkillType;
    stage: string;
  };
}

interface MessageItemProps {
  message: ChatMessage;
  isLatest: boolean;
  isStreaming: boolean;
  activeSkill?: { type: SkillType; stage: string; confidence?: number } | null;
  // Plan approval props
  planStatus?: PlanStatus;
  canStartBuild?: boolean;
  hasUnansweredQuestions?: boolean;
  onApprovePlan?: () => void;
  onReviewPlan?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Activity Block (for the activity timeline)
// ─────────────────────────────────────────────────────────────────────────────

function ToolActivityBlock({ tool }: { tool: ToolItem }) {
  const getToolIcon = (name: string) => {
    if (name.includes('file') || name.includes('write') || name.includes('read')) {
      return <FileCode className="w-3.5 h-3.5" />;
    }
    if (name.includes('search') || name.includes('web')) {
      return <Search className="w-3.5 h-3.5" />;
    }
    return <Terminal className="w-3.5 h-3.5" />;
  };

  const getToolLabel = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg border border-amber-500/20 text-xs">
      <span className="text-amber-600 dark:text-amber-400">
        {getToolIcon(tool.toolName)}
      </span>
      <span className="font-medium text-amber-700 dark:text-amber-300">
        {getToolLabel(tool.toolName)}
      </span>
      {tool.status === 'running' && (
        <Loader2 className="w-3 h-3 animate-spin ml-auto text-amber-500" />
      )}
      {tool.status === 'complete' && (
        <CheckCircle className="w-3 h-3 ml-auto text-emerald-500" />
      )}
      {tool.message && (
        <span className="text-muted-foreground truncate max-w-[150px]">
          {tool.message}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Results Block
// ─────────────────────────────────────────────────────────────────────────────

function ToolResultsBlock({ results }: { results: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = results.trim().split('\n');
  const isLong = lines.length > 5;

  return (
    <div className="w-full max-w-[85%] bg-zinc-900/50 rounded-xl border border-zinc-500/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/30 transition-colors rounded-t-xl"
      >
        <div className="w-2 h-2 rounded-full bg-zinc-600" />
        <span className="text-zinc-500 text-[11px] font-medium">Workspace Action Result</span>
        {isLong && (
          <ChevronDown
            className={cn(
              'w-3 h-3 ml-auto text-zinc-500 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {(!isLong || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="px-3 py-2 font-mono text-[11px] text-zinc-400 whitespace-pre-wrap border-t border-zinc-500/10">
              {results.trim()}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MessageItem Component
// ─────────────────────────────────────────────────────────────────────────────

export function MessageItem({
  message,
  isLatest,
  isStreaming,
  activeSkill,
  planStatus,
  canStartBuild,
  hasUnansweredQuestions,
  onApprovePlan,
  onReviewPlan,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const hasThinking = message.thinking && message.thinking.length > 0;
  const hasTools = message.tools && message.tools.length > 0;
  const hasToolResults = Boolean(message.toolResults);
  const hasActivityTimeline = hasThinking || hasTools;

  // User message
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm bg-primary text-primary-foreground shadow-md shadow-primary/10 text-sm leading-relaxed">
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Assistant message with activity timeline
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start gap-2 w-full"
    >
      {/* Activity Timeline */}
      {hasActivityTimeline && (
        <div className="relative pl-4 space-y-2 w-full">
          {/* Vertical timeline line */}
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

          {/* Thinking blocks */}
          {message.thinking?.map((thinking, idx) => (
            <div key={`thinking-${idx}`} className="relative">
              <div className="absolute -left-2.5 top-2 w-2 h-2 rounded-full bg-primary/60 ring-2 ring-background" />
              <ThinkingBlock
                content={thinking.content}
                thinkingType={thinking.thinkingType}
                isStreaming={isLatest && isStreaming && !thinking.isComplete}
                isComplete={thinking.isComplete}
                className="ml-2 max-w-[85%]"
              />
            </div>
          ))}

          {/* Tool calls */}
          {message.tools?.map((tool, idx) => (
            <div key={`tool-${idx}`} className="relative ml-2">
              <div className="absolute -left-4.5 top-1.5 w-2 h-2 rounded-full bg-amber-500/60 ring-2 ring-background" />
              <ToolActivityBlock tool={tool} />
            </div>
          ))}
        </div>
      )}

      {/* Tool Results */}
      {hasToolResults && <ToolResultsBlock results={message.toolResults!} />}

      {/* Message Content */}
      {message.content && (
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm bg-muted text-foreground text-sm leading-relaxed">
          <PlanContentRenderer
            content={message.content}
            planStatus={planStatus}
            canStartBuild={canStartBuild}
            hasUnansweredQuestions={hasUnansweredQuestions}
            onApprovePlan={onApprovePlan}
            onReviewPlan={onReviewPlan}
          />
        </div>
      )}

      {/* Skill Badge */}
      {message.skill && (
        <div className="ml-1">
          <SkillBadge skill={message.skill} size="sm" showStage={false} />
        </div>
      )}

      {/* Loading indicator when streaming with no content yet */}
      {isLatest && isStreaming && !message.content && !hasThinking && (
        <div className="flex items-center gap-2">
          {activeSkill ? (
            <SkillThinkingIndicator skill={activeSkill} />
          ) : (
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.1s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default MessageItem;
