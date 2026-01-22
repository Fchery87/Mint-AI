'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  containsPlanElements,
  extractQuestions,
  parsePlanTag
} from '@/lib/plan-parser';
import type { ClarifyingQuestion, PlanStep } from '@/types/plan-build';
import { PlanStatus } from '@/types/plan-build';
import {
  HelpCircle,
  CheckCircle2,
  FileCode,
  Zap,
  ListOrdered,
  Target,
  Lightbulb,
  PencilLine
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Section Header (for ### headings)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ 
  number, 
  title, 
  icon 
}: { 
  number?: string; 
  title: string; 
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {number && (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {number}
        </span>
      )}
      {icon && <span className="text-primary">{icon}</span>}
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Card
// ─────────────────────────────────────────────────────────────────────────────

function QuestionCard({ 
  question, 
  index 
}: { 
  question: ClarifyingQuestion; 
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
          Q{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {question.required && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wide">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-foreground mt-1 leading-relaxed">
            {question.question}
          </p>
        </div>
      </div>
      
      {question.options && question.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 pl-8">
          {question.options.map((option, i) => (
            <button
              key={i}
              className="px-2.5 py-1 text-xs rounded-lg bg-background border border-border/50 
                         hover:border-primary/50 hover:bg-primary/5 transition-colors
                         text-muted-foreground hover:text-foreground"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Card
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({ 
  step, 
  index 
}: { 
  step: PlanStep; 
  index: number;
}) {
  const complexityColors = {
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-3 group"
    >
      {/* Step number */}
      <div className="flex flex-col items-center">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
          {index + 1}
        </span>
        {/* Connector line */}
        <div className="flex-1 w-px bg-border/40 mt-1" />
      </div>
      
      {/* Step content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-sm text-foreground">{step.title}</span>
          {step.estimatedComplexity && (
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide border',
              complexityColors[step.estimatedComplexity]
            )}>
              {step.estimatedComplexity}
            </span>
          )}
        </div>
        
        {step.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {step.description}
          </p>
        )}
        
        {step.filesToModify && step.filesToModify.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <FileCode className="w-3 h-3 text-muted-foreground" />
            {step.filesToModify.map((file, i) => (
              <span 
                key={i}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground"
              >
                {file}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Block
// ─────────────────────────────────────────────────────────────────────────────

function SummaryBlock({ content }: { content: string }) {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mt-2">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Parser & Renderer
// ─────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  type: 'section' | 'questions' | 'plan' | 'summary' | 'text';
  sectionNumber?: string;
  sectionTitle?: string;
  questions?: ClarifyingQuestion[];
  steps?: PlanStep[];
  planTitle?: string;
  content?: string;
}

function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  
  // Split by section headers while preserving them
  const sections = content.split(/(?=^###\s+)/m);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Check if this is a section header
    const headerMatch = section.match(/^###\s+(\d+)\.\s+(.+?)(?:\n|$)/);
    
    if (headerMatch) {
      const [, number, title] = headerMatch;
      const sectionContent = section.replace(/^###\s+\d+\.\s+.+?\n?/, '').trim();
      
      blocks.push({
        type: 'section',
        sectionNumber: number,
        sectionTitle: title.trim(),
      });
      
      // Parse section content
      if (sectionContent) {
        // Check for questions
        if (sectionContent.includes('<question')) {
          const questions = extractQuestions(sectionContent);
          if (questions.length > 0) {
            blocks.push({ type: 'questions', questions });
          }
        }
        // Check for plan
        else if (sectionContent.includes('<plan')) {
          const planMatch = sectionContent.match(/<plan[^>]*>[\s\S]*?<\/plan>/i);
          if (planMatch) {
            const { title, steps } = parsePlanTag(planMatch[0]);
            blocks.push({ type: 'plan', planTitle: title, steps });
          }
        }
        // Check for summary (last section or contains summary-like content)
        else if (title.toLowerCase().includes('summary') || 
                 (number === '4' && !sectionContent.includes('<'))) {
          blocks.push({ type: 'summary', content: sectionContent });
        }
        // Plain text
        else if (sectionContent.trim()) {
          blocks.push({ type: 'text', content: sectionContent });
        }
      }
    } else {
      // Not a section header - check for standalone elements
      const trimmed = section.trim();
      
      if (trimmed.includes('<question')) {
        const questions = extractQuestions(trimmed);
        if (questions.length > 0) {
          blocks.push({ type: 'questions', questions });
        }
      } else if (trimmed.includes('<plan')) {
        const planMatch = trimmed.match(/<plan[^>]*>[\s\S]*?<\/plan>/i);
        if (planMatch) {
          const { title, steps } = parsePlanTag(planMatch[0]);
          blocks.push({ type: 'plan', planTitle: title, steps });
        }
      } else if (trimmed && !trimmed.startsWith('<')) {
        blocks.push({ type: 'text', content: trimmed });
      }
    }
  }
  
  return blocks;
}

function getSectionIcon(title: string): React.ReactNode {
  const lower = title.toLowerCase();
  if (lower.includes('understand')) return <Target className="w-4 h-4" />;
  if (lower.includes('question') || lower.includes('clarif')) return <HelpCircle className="w-4 h-4" />;
  if (lower.includes('plan') || lower.includes('implement')) return <ListOrdered className="w-4 h-4" />;
  if (lower.includes('summary')) return <Lightbulb className="w-4 h-4" />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface PlanContentRendererProps {
  content: string;
  className?: string;
  // Plan approval props
  planStatus?: PlanStatus;
  canStartBuild?: boolean;
  hasUnansweredQuestions?: boolean;
  onApprovePlan?: () => void;
  onReviewPlan?: () => void;
}

export function PlanContentRenderer({
  content,
  className,
  planStatus,
  canStartBuild,
  hasUnansweredQuestions,
  onApprovePlan,
  onReviewPlan,
}: PlanContentRendererProps) {
  const isPlanContent = useMemo(() => {
    return containsPlanElements(content) || content.includes('### 1.');
  }, [content]);

  const blocks = useMemo(() => {
    if (!isPlanContent) return [];
    return parseContentBlocks(content);
  }, [content, isPlanContent]);

  // Determine if we should show approval buttons
  const showApprovalButtons = useMemo(() => {
    // Must have plan content with steps
    if (!isPlanContent || blocks.length === 0) return false;
    const hasPlanSteps = blocks.some((block) => block.type === 'plan' && block.steps && block.steps.length > 0);
    if (!hasPlanSteps) return false;

    // Must be in READY status
    if (planStatus !== PlanStatus.READY) return false;

    // Must have both handlers
    if (!onApprovePlan || !onReviewPlan) return false;

    return true;
  }, [isPlanContent, blocks, planStatus, onApprovePlan, onReviewPlan]);

  const handleProceedToBuild = () => {
    if (!onApprovePlan) return;
    onApprovePlan();
  };

  // If not plan content, render as plain text
  if (!isPlanContent) {
    return (
      <div className={cn('whitespace-pre-wrap', className)}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'section':
            return (
              <SectionHeader
                key={i}
                number={block.sectionNumber}
                title={block.sectionTitle!}
                icon={getSectionIcon(block.sectionTitle!)}
              />
            );

          case 'questions':
            return (
              <div key={i} className="space-y-2">
                {block.questions?.map((q, qi) => (
                  <QuestionCard key={q.id} question={q} index={qi} />
                ))}
              </div>
            );

          case 'plan':
            return (
              <div key={i} className="space-y-1">
                {block.planTitle && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {block.planTitle}
                    </span>
                  </div>
                )}
                <div className="space-y-0">
                  {block.steps?.map((step, si) => (
                    <StepCard key={step.id} step={step} index={si} />
                  ))}
                </div>
              </div>
            );

          case 'summary':
            return <SummaryBlock key={i} content={block.content!} />;

          case 'text':
            return (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {block.content}
              </p>
            );

          default:
            return null;
        }
      })}

      {/* Approval Buttons */}
      {showApprovalButtons && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 justify-end pt-6 mt-4 border-t border-border/40"
        >
          <button
            onClick={onReviewPlan}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-lg
                       bg-muted/50 hover:bg-muted border border-border/50
                       hover:border-border transition-all duration-200
                       text-sm font-medium text-foreground"
          >
            <PencilLine className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            Review Plan
          </button>

          <button
            onClick={handleProceedToBuild}
            disabled={!canStartBuild || hasUnansweredQuestions}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg
                       bg-primary hover:bg-primary/90 disabled:bg-muted
                       disabled:text-muted-foreground
                       border border-primary/20 hover:border-primary/30
                       shadow-lg shadow-primary/20 hover:shadow-primary/30
                       transition-all duration-200
                       text-sm font-semibold text-primary-foreground
                       disabled:shadow-none disabled:border-border/50"
          >
            <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Proceed to Build
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default PlanContentRenderer;
