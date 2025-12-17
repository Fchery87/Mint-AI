'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningBlockProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function ReasoningBlock({ content, isStreaming = false, className }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  // Auto-expand when streaming, collapse when done
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    } else if (content) {
      // Auto-collapse after streaming finishes
      const timer = setTimeout(() => setIsOpen(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, content]);

  if (!content.trim()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-amber-200/50 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="relative">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </div>
        <span className="text-xs font-medium text-amber-800 dark:text-amber-200 flex-1">
          Thinking
          {isStreaming && (
            <span className="ml-1.5 text-amber-600 dark:text-amber-400">...</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200',
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 text-xs text-amber-900/80 dark:text-amber-100/80 border-t border-amber-200/50 dark:border-amber-900/50 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
