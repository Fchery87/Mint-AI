/**
 * SkillBadge Component
 *
 * Displays the currently active skill with appropriate styling.
 */

'use client';

import { SkillType } from '@/types/skill';

interface SkillBadgeProps {
  skill: {
    type: SkillType;
    stage: string;
    confidence?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showStage?: boolean;
}

const skillConfig: Record<SkillType, { label: string; color: string; icon: string }> = {
  [SkillType.BRAINSTORM]: {
    label: 'Brainstorm',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '💡',
  },
  [SkillType.PLAN]: {
    label: 'Plan',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📋',
  },
  [SkillType.CODE]: {
    label: 'Code',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '💻',
  },
  [SkillType.DEBUG]: {
    label: 'Debug',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🐛',
  },
  [SkillType.REVIEW]: {
    label: 'Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '👀',
  },
  [SkillType.SEARCH]: {
    label: 'Search',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: '🔍',
  },
  [SkillType.GENERAL]: {
    label: 'Chat',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '💬',
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

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.color}
        ${sizeStyles[size]}
      `}
    >
      <span className="text-base">{config.icon}</span>
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

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`
          inline-flex items-center gap-2 rounded-full border px-3 py-1
          ${config.color} ${sizeStyles['md']}
        `}
      >
        <span className="text-base">{config.icon}</span>
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
