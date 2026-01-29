'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, Search, CheckCircle, Cpu, Target, FileCode, AlertTriangle, Route, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  content: string;
  thinkingType: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  className?: string;
}

// Map thinking types to icons and titles
const thinkingTypeConfig: Record<string, { icon: typeof Lightbulb; title: string; color: string; bgGradient: string }> = {
  requirements: { icon: FileCode, title: 'Requirements', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  considerations: { icon: AlertTriangle, title: 'Considerations', color: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
  approaches: { icon: Lightbulb, title: 'Approaches', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  questions: { icon: Search, title: 'Questions', color: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
  understanding: { icon: Target, title: 'Understanding', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  breakdown: { icon: FileCode, title: 'Breakdown', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  dependencies: { icon: Cpu, title: 'Dependencies', color: 'text-muted-foreground', bgGradient: 'from-muted/20 to-muted/10' },
  challenges: { icon: AlertTriangle, title: 'Challenges', color: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
  architecture: { icon: Cpu, title: 'Architecture', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  components: { icon: FileCode, title: 'Components', color: 'text-emerald-500', bgGradient: 'from-emerald-500/10 to-emerald-500/5' },
  edgecases: { icon: AlertTriangle, title: 'Edge Cases', color: 'text-rose-500', bgGradient: 'from-rose-500/10 to-rose-500/5' },
  analysis: { icon: Search, title: 'Analysis', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  hypothesis: { icon: Lightbulb, title: 'Hypothesis', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  investigation: { icon: Search, title: 'Investigation', color: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
  solution: { icon: CheckCircle, title: 'Solution', color: 'text-emerald-500', bgGradient: 'from-emerald-500/10 to-emerald-500/5' },
  overview: { icon: Target, title: 'Overview', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  correctness: { icon: CheckCircle, title: 'Correctness', color: 'text-emerald-500', bgGradient: 'from-emerald-500/10 to-emerald-500/5' },
  bestpractices: { icon: Cpu, title: 'Best Practices', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  improvements: { icon: Lightbulb, title: 'Improvements', color: 'text-amber-500', bgGradient: 'from-amber-500/10 to-amber-500/5' },
  info: { icon: Search, title: 'Information', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  approach: { icon: Route, title: 'Approach', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
  findings: { icon: Lightbulb, title: 'Findings', color: 'text-emerald-500', bgGradient: 'from-emerald-500/10 to-emerald-500/5' },
  reasoning: { icon: Brain, title: 'Reasoning', color: 'text-accent', bgGradient: 'from-accent/10 to-accent/5' },
};

function getThinkingConfig(type: string): { icon: typeof Lightbulb; title: string; color: string; bgGradient: string } {
  const config = thinkingTypeConfig[type];
  if (config) return config;
  
  // Default fallback with accent color
  return {
    icon: Brain,
    title: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
    color: 'text-accent',
    bgGradient: 'from-accent/10 to-accent/5',
  };
}

export function ThinkingBlock({ content, thinkingType, isStreaming = false, isComplete = false, className }: ThinkingBlockProps) {
  // Start collapsed by default, expand when streaming
  const [isOpen, setIsOpen] = useState(false);
  const config = getThinkingConfig(thinkingType);
  const Icon = config.icon;

  // Auto-expand when streaming
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  // Auto-collapse after complete (longer delay for user to read)
  useEffect(() => {
    if (isComplete && !isStreaming) {
      const timer = setTimeout(() => setIsOpen(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isComplete, isStreaming]);

  if (!content.trim()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'overflow-hidden rounded-lg',
        'bg-gradient-to-br backdrop-blur-sm',
        config.bgGradient,
        'border border-border/50',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 text-left',
          'hover:bg-white/5 transition-all duration-200',
          'group'
        )}
      >
        <div className="relative flex items-center justify-center">
          <Icon className={cn('w-4 h-4', config.color, 'transition-transform group-hover:scale-110')} />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2">
              <span className="absolute inset-0 bg-accent animate-ping opacity-75 rounded-full" />
              <span className="absolute inset-0 bg-accent rounded-full" />
            </span>
          )}
        </div>
        <span className={cn('text-xs font-medium flex-1 tracking-wide', config.color)}>
          {config.title}
          {isStreaming && (
            <span className="ml-1.5 inline-flex gap-0.5">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
            </span>
          )}
        </span>
        {isComplete && !isStreaming && (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200',
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
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2.5 border-t border-border/40">
              <div className="text-xs text-muted-foreground/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-thin font-mono">
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
