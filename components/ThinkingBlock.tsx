'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, Search, CheckCircle, Cpu, Target, FileCode, AlertTriangle, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  content: string;
  thinkingType: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  className?: string;
}

// Map thinking types to icons and titles
const thinkingTypeConfig: Record<string, { icon: typeof Lightbulb; title: string; color: string }> = {
  requirements: { icon: FileCode, title: 'Requirements', color: 'text-blue-600' },
  considerations: { icon: AlertTriangle, title: 'Considerations', color: 'text-amber-600' },
  approaches: { icon: Lightbulb, title: 'Approaches', color: 'text-purple-600' },
  questions: { icon: Search, title: 'Questions', color: 'text-cyan-600' },
  understanding: { icon: Target, title: 'Understanding', color: 'text-blue-600' },
  breakdown: { icon: FileCode, title: 'Breakdown', color: 'text-indigo-600' },
  dependencies: { icon: Cpu, title: 'Dependencies', color: 'text-slate-600' },
  challenges: { icon: AlertTriangle, title: 'Challenges', color: 'text-amber-600' },
  architecture: { icon: Cpu, title: 'Architecture', color: 'text-purple-600' },
  components: { icon: FileCode, title: 'Components', color: 'text-green-600' },
  edgecases: { icon: AlertTriangle, title: 'Edge Cases', color: 'text-red-600' },
  analysis: { icon: Search, title: 'Analysis', color: 'text-blue-600' },
  hypothesis: { icon: Lightbulb, title: 'Hypothesis', color: 'text-purple-600' },
  investigation: { icon: Search, title: 'Investigation', color: 'text-cyan-600' },
  solution: { icon: CheckCircle, title: 'Solution', color: 'text-green-600' },
  overview: { icon: Target, title: 'Overview', color: 'text-blue-600' },
  correctness: { icon: CheckCircle, title: 'Correctness', color: 'text-green-600' },
  bestpractices: { icon: Cpu, title: 'Best Practices', color: 'text-purple-600' },
  improvements: { icon: Lightbulb, title: 'Improvements', color: 'text-amber-600' },
  info: { icon: Search, title: 'Information', color: 'text-blue-600' },
  approach: { icon: Route, title: 'Approach', color: 'text-purple-600' },
  findings: { icon: Lightbulb, title: 'Findings', color: 'text-green-600' },
};

function getThinkingConfig(type: string): { icon: typeof Lightbulb; title: string; color: string } {
  const config = thinkingTypeConfig[type];
  if (config) return config;
  
  // Default fallback
  return {
    icon: Lightbulb,
    title: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
    color: 'text-mint-600',
  };
}

export function ThinkingBlock({ content, thinkingType, isStreaming = false, isComplete = false, className }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);
  const config = getThinkingConfig(thinkingType);
  const Icon = config.icon;

  // Auto-expand when streaming
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  // Auto-collapse after complete
  useEffect(() => {
    if (isComplete && !isStreaming) {
      const timer = setTimeout(() => setIsOpen(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isComplete, isStreaming]);

  if (!content.trim()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-mint-200/60 bg-mint-50/30 dark:border-mint-700/40 dark:bg-mint-950/20 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-mint-100/50 dark:hover:bg-mint-900/20 transition-colors"
      >
        <div className="relative">
          <Icon className={cn('w-4 h-4', config.color)} />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mint-500 animate-pulse" />
          )}
        </div>
        <span className={cn('text-xs font-semibold flex-1', config.color)}>
          {config.title}
          {isStreaming && <span className="ml-1.5 opacity-75">...</span>}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 border-t border-mint-200/60 dark:border-mint-700/40">
              <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Legacy component for backward compatibility
interface ReasoningBlockProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function ReasoningBlock({ content, isStreaming = false, className }: ReasoningBlockProps) {
  return (
    <ThinkingBlock
      content={content}
      thinkingType="reasoning"
      isStreaming={isStreaming}
      className={className}
    />
  );
}
