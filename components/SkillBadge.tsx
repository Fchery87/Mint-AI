/**
 * SkillBadge Component
 *
 * Displays the currently active skill with cyberpunk styling.
 */

'use client';

import { SkillType } from '@/types/skill';
import { Lightbulb, FileText, Terminal, Bug, Eye, Search, MessageSquare } from 'lucide-react';

interface SkillBadgeProps {
  skill: {
    type: SkillType;
    stage: string;
    confidence?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showStage?: boolean;
}

const skillConfig: Record<SkillType, { label: string; color: string; icon: typeof Lightbulb }> = {
  [SkillType.BRAINSTORM]: {
    label: 'Brainstorm',
    color: 'bg-primary/10 text-primary border-primary/30',
    icon: Lightbulb,
  },
  [SkillType.PLAN]: {
    label: 'Plan',
    color: 'bg-secondary/10 text-secondary border-secondary/30',
    icon: FileText,
  },
  [SkillType.CODE]: {
    label: 'Code',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    icon: Terminal,
  },
  [SkillType.DEBUG]: {
    label: 'Debug',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    icon: Bug,
  },
  [SkillType.REVIEW]: {
    label: 'Review',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    icon: Eye,
  },
  [SkillType.SEARCH]: {
    label: 'Search',
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    icon: Search,
  },
  [SkillType.GENERAL]: {
    label: 'Chat',
    color: 'bg-muted/30 text-muted-foreground border-border/40',
    icon: MessageSquare,
  },
};

const stageLabels: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  planning: 'Planning',
  coding: 'Coding',
  testing: 'Testing',
  reviewing: 'Reviewing',
  done: 'Done',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

// Detailed progress messages for each skill + stage combination
const skillProgressMessages: Record<string, Record<string, string>> = {
  [SkillType.BRAINSTORM]: {
    thinking: 'Analyzing requirements...',
    done: 'Brainstorming complete',
  },
  [SkillType.PLAN]: {
    planning: 'Creating implementation plan...',
    done: 'Plan ready',
  },
  [SkillType.CODE]: {
    coding: 'Writing code...',
    testing: 'Running tests...',
    done: 'Code complete',
  },
  [SkillType.DEBUG]: {
    thinking: 'Analyzing the issue...',
    coding: 'Fixing the bug...',
    done: 'Debug complete',
  },
  [SkillType.REVIEW]: {
    reviewing: 'Reviewing code quality...',
    done: 'Review complete',
  },
  [SkillType.SEARCH]: {
    thinking: 'Searching for information...',
    done: 'Search complete',
  },
  [SkillType.GENERAL]: {
    idle: 'Processing...',
    done: 'Done',
  },
};

export function SkillBadge({ skill, size = 'md', showStage = true }: SkillBadgeProps) {
  const config = skillConfig[skill.type] || skillConfig[SkillType.GENERAL];
  const stageLabel = stageLabels[skill.stage] || 'Active';
  const progressMessage = skillProgressMessages[skill.type]?.[skill.stage] || stageLabel;
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.color}
        ${sizeStyles[size]}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
      {showStage && skill.stage !== 'done' && (
        <span className="opacity-75">• {progressMessage}</span>
      )}
    </div>
  );
}

/**
 * Animated thinking indicator for active skills with detailed progress
 */
export function SkillThinkingIndicator({ skill }: { skill: { type: SkillType; stage: string } }) {
  const config = skillConfig[skill.type] || skillConfig[SkillType.GENERAL];
  const progressMessage = skillProgressMessages[skill.type]?.[skill.stage] || stageLabels[skill.stage] || 'Working...';
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`
          inline-flex items-center gap-2 rounded-full border px-3 py-1
          ${config.color} ${sizeStyles['md']}
        `}
      >
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
        <div className="flex gap-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
            •
          </span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
            •
          </span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
            •
          </span>
        </div>
      </div>
      {/* Detailed progress message */}
      <div className="text-xs text-muted-foreground ml-1 animate-pulse">
        {progressMessage}
      </div>
    </div>
  );
}
