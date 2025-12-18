'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, Target, Route, Cpu, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningBlockProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

interface ParsedReasoning {
  problem?: string;
  approach?: string;
  keyDecisions?: string;
  scope?: string;
  complexityCheck?: string;
  raw?: string; // Fallback if parsing fails
}

/**
 * Parse structured reasoning (AGENTS.md format)
 */
function parseReasoning(content: string): ParsedReasoning {
  const parsed: ParsedReasoning = {};

  // Try to extract structured sections
  const problemMatch = content.match(/\*\*Problem\*\*:\s*(.+?)(?=\n|$)/i);
  const approachMatch = content.match(/\*\*Approach\*\*:\s*(.+?)(?=\n\s*\*\*|$)/is);
  const decisionsMatch = content.match(/\*\*Key Decisions\*\*:\s*(.+?)(?=\n\s*\*\*|$)/is);
  const scopeMatch = content.match(/\*\*Scope\*\*:\s*(.+?)(?=\n\s*\*\*|$)/is);
  const complexityMatch = content.match(/\*\*Complexity Check\*\*:\s*(.+?)(?=\n|$)/is);

  if (problemMatch) parsed.problem = problemMatch[1].trim();
  if (approachMatch) parsed.approach = approachMatch[1].trim();
  if (decisionsMatch) parsed.keyDecisions = decisionsMatch[1].trim();
  if (scopeMatch) parsed.scope = scopeMatch[1].trim();
  if (complexityMatch) parsed.complexityCheck = complexityMatch[1].trim();

  // If we didn't find structured format, store raw content
  if (!parsed.problem && !parsed.approach) {
    parsed.raw = content;
  }

  return parsed;
}

export function ReasoningBlock({ content, isStreaming = false, className }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  // Memoize parsing to avoid re-parsing on every render
  const parsed = useMemo(() => parseReasoning(content), [content]);

  // Auto-expand when streaming, collapse when done
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
      return undefined;
    }

    if (content) {
      // Auto-collapse after streaming finishes
      const timer = setTimeout(() => setIsOpen(false), 1500);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isStreaming, content]);

  if (!content.trim()) return null;

  // Determine if we have structured reasoning
  const isStructured = useMemo(() => Boolean(parsed.problem || parsed.approach), [parsed.problem, parsed.approach]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-mint-200/60 bg-mint-50/40 dark:border-mint-700/40 dark:bg-mint-950/30 overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-mint-100/60 dark:hover:bg-mint-900/30 transition-colors"
      >
        <div className="relative">
          <Lightbulb className="w-4 h-4 text-mint-600 dark:text-mint-400" />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mint-500 animate-pulse" />
          )}
        </div>
        <span className="text-xs font-semibold text-mint-900 dark:text-mint-100 flex-1">
          Thinking
          {isStreaming && (
            <span className="ml-1.5 text-mint-700 dark:text-mint-300">...</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-mint-600 dark:text-mint-400 transition-transform duration-200',
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
            <div className="px-3 py-2 border-t border-mint-200/60 dark:border-mint-700/40">
              {isStructured ? (
                <div className="space-y-2.5 text-xs">
                  {parsed.problem && (
                    <div className="flex gap-2">
                      <Target className="w-3.5 h-3.5 text-mint-600 dark:text-mint-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-mint-900 dark:text-mint-100">Problem:</span>
                        <span className="ml-1.5 text-mint-800 dark:text-mint-200">{parsed.problem}</span>
                      </div>
                    </div>
                  )}
                  {parsed.approach && (
                    <div className="flex gap-2">
                      <Route className="w-3.5 h-3.5 text-mint-600 dark:text-mint-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-mint-900 dark:text-mint-100">Approach:</span>
                        <span className="ml-1.5 text-mint-800 dark:text-mint-200">{parsed.approach}</span>
                      </div>
                    </div>
                  )}
                  {parsed.keyDecisions && (
                    <div className="flex gap-2">
                      <Cpu className="w-3.5 h-3.5 text-mint-600 dark:text-mint-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-mint-900 dark:text-mint-100">Key Decisions:</span>
                        <span className="ml-1.5 text-mint-800 dark:text-mint-200">{parsed.keyDecisions}</span>
                      </div>
                    </div>
                  )}
                  {parsed.scope && (
                    <div className="flex gap-2">
                      <Package className="w-3.5 h-3.5 text-mint-600 dark:text-mint-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-mint-900 dark:text-mint-100">Scope:</span>
                        <span className="ml-1.5 text-mint-800 dark:text-mint-200">{parsed.scope}</span>
                      </div>
                    </div>
                  )}
                  {parsed.complexityCheck && (
                    <div className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-mint-900 dark:text-mint-100">Complexity Check:</span>
                        <span className="ml-1.5 text-mint-800 dark:text-mint-200">{parsed.complexityCheck}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-mint-800 dark:text-mint-200 whitespace-pre-wrap leading-relaxed">
                  {parsed.raw || content}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
