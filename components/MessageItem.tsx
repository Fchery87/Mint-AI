'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThinkingBlock } from '@/components/ThinkingBlock';
import { SkillBadge, SkillThinkingIndicator } from '@/components/SkillBadge';
import { PlanContentRenderer } from '@/components/PlanContentRenderer';
import { EnhancedMessageContent } from '@/components/EnhancedMessageContent';
import { SkillType } from '@/types/skill';
import { PlanStatus } from '@/types/plan-build';
import { CheckCircle, Loader2, Terminal, FileCode, Search, ChevronDown, GitCompare, Play, Beaker, XCircle } from 'lucide-react';
import { useState, memo, useMemo } from 'react';

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
  // Enhanced code actions
  onRunCode?: (code: string, language: string) => void;
  onDiffCode?: (before: string, after: string) => void;
  onApplyCode?: (code: string, filename?: string) => void;
  onApplyArtifact?: (files: Array<{ path: string; code: string }>) => void;
  onCopyCode?: (code: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Activity Block
// ─────────────────────────────────────────────────────────────────────────────

function ToolActivityBlock({ tool }: { tool: ToolItem }) {
  const getToolIcon = (name: string) => {
    if (name.includes('file') || name.includes('write') || name.includes('read') || name.includes('create')) {
      return <FileCode className="w-3.5 h-3.5" />;
    }
    if (name.includes('search') || name.includes('web') || name.includes('find')) {
      return <Search className="w-3.5 h-3.5" />;
    }
    if (name.includes('diff') || name.includes('patch')) {
      return <GitCompare className="w-3.5 h-3.5" />;
    }
    if (name.includes('command') || name.includes('run') || name.includes('exec')) {
      return <Play className="w-3.5 h-3.5" />;
    }
    if (name.includes('test')) {
      return <Beaker className="w-3.5 h-3.5" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-accent';
      case 'complete':
        return 'text-emerald-500';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-accent/10 border-accent/30';
      case 'complete':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'error':
        return 'bg-destructive/10 border-destructive/30';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
      getStatusBg(tool.status)
    )}>
      <span className={cn("flex-shrink-0", getStatusColor(tool.status))}>
        {getToolIcon(tool.toolName)}
      </span>
      <span className="text-xs font-medium text-foreground">
        {getToolLabel(tool.toolName)}
      </span>
      {tool.status === 'running' && (
        <Loader2 className="w-3 h-3 animate-spin ml-auto text-accent" />
      )}
      {tool.status === 'complete' && (
        <CheckCircle className="w-3 h-3 ml-auto text-emerald-500" />
      )}
      {tool.status === 'error' && (
        <XCircle className="w-3 h-3 ml-auto text-destructive" />
      )}
      {tool.message && tool.status !== 'running' && tool.status !== 'complete' && tool.status !== 'error' && (
        <span className="text-muted-foreground truncate max-w-[150px] text-xs">
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
  const isLong = lines.length > 8;

  // Parse results to show summary
  const resultCount = results.split('[').length - 1;
  const hasErrors = results.toLowerCase().includes('error');

  return (
    <div className="w-full max-w-[90%] bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-slate-800/50 transition-colors group"
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          hasErrors ? "bg-red-500" : "bg-emerald-500"
        )} />
        <span className="text-slate-300 text-xs font-medium">
          {hasErrors ? 'Tool Execution Results' : 'Tool Execution Results'}
        </span>
        <span className="text-slate-500 text-xs">
          ({resultCount} {resultCount === 1 ? 'action' : 'actions'})
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 ml-auto text-slate-500 transition-transform duration-200',
            isExpanded && 'rotate-180',
            'group-hover:text-slate-400'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {(!isLong || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700/50">
              <pre className="px-4 py-3 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {results.trim()}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isLong && !isExpanded && (
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/30">
          <span className="text-slate-500 text-xs">
            {lines.length} lines total. Click to expand.
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MessageItem Component
// ─────────────────────────────────────────────────────────────────────────────

function MessageItemComponent({
  message,
  isLatest,
  isStreaming,
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
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const hasThinking = message.thinking && message.thinking.length > 0;
  const hasTools = message.tools && message.tools.length > 0;
  const hasToolResults = Boolean(message.toolResults);
  const hasActivityTimeline = hasThinking || hasTools;

  // Detect if this is plan content
  const isPlanContent = useMemo(() => {
    if (!message.content) return false;
    return (
      message.content.includes('### 1.') ||
      message.content.includes('<plan') ||
      message.content.includes('<question')
    );
  }, [message.content]);

  // User message
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="message-user">
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
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />

          {/* Thinking blocks */}
          {message.thinking?.map((thinking, idx) => (
            <div key={`thinking-${idx}`} className="relative">
              <div className="absolute -left-2.5 top-2 w-2 h-2 rounded-full bg-accent/60 ring-2 ring-background" />
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
        <div className="message-assistant">
          {isPlanContent ? (
            <PlanContentRenderer
              content={message.content}
              planStatus={planStatus}
              canStartBuild={canStartBuild}
              hasUnansweredQuestions={hasUnansweredQuestions}
              onApprovePlan={onApprovePlan}
              onReviewPlan={onReviewPlan}
            />
          ) : (
            <EnhancedMessageContent
              content={message.content}
              onRunCode={onRunCode}
              onDiffCode={onDiffCode}
              onApplyCode={onApplyCode}
              onApplyArtifact={onApplyArtifact}
              onCopyCode={onCopyCode}
            />
          )}
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
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MessageItemComponent, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.message === nextProps.message &&
    prevProps.isLatest === nextProps.isLatest &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.activeSkill === nextProps.activeSkill &&
    prevProps.planStatus === nextProps.planStatus &&
    prevProps.canStartBuild === nextProps.canStartBuild &&
    prevProps.hasUnansweredQuestions === nextProps.hasUnansweredQuestions
  );
});
