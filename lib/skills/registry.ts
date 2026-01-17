/**
 * Skill Registry
 *
 * Central registry for all available skills with their configurations,
 * trigger patterns, and handlers.
 */

import {
  SkillType,
  WorkflowStage,
  SkillConfig,
  SkillHandler,
  IntentMatch,
} from '@/types/skill';

// Import handlers
import { brainstormHandler } from './handlers/brainstorm';
import { planHandler } from './handlers/plan';
import { codeHandler } from './handlers/code';
import { debugHandler } from './handlers/debug';
import { reviewHandler } from './handlers/review';
import { searchHandler } from './handlers/search';
import { generalHandler } from './handlers/general';

const skillConfigs: Record<SkillType, SkillConfig> = {
  [SkillType.BRAINSTORM]: {
    name: 'Brainstorm',
    description: 'Explores requirements, design options, and creative solutions before implementation',
    triggerPatterns: [
      /how (should|can|could)/i,
      /what('s| is) the best (way|approach|pattern)/i,
      /ideas (for|to)/i,
      /design (a|an|the)/i,
      /thinking about/i,
      /explore/i,
      /considering/i,
      /alternatives to/i,
      /^brainstorm/i,
      /let's think about/i,
    ],
    stage: WorkflowStage.THINKING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  [SkillType.PLAN]: {
    name: 'Plan',
    description: 'Creates detailed implementation plans with step-by-step breakdown',
    triggerPatterns: [
      /create a plan/i,
      /break down/i,
      /steps to/i,
      /roadmap/i,
      /implementation plan/i,
      /how to implement/i,
      /plan out/i,
      /list the steps/i,
      /^plan/i,
      /task breakdown/i,
    ],
    stage: WorkflowStage.PLANNING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  [SkillType.CODE]: {
    name: 'Code',
    description: 'Writes, edits, or modifies code in the workspace',
    triggerPatterns: [
      /^(write|create|build|add|make)/i,
      /implement/i,
      /generate (code|the|a)/i,
      /write a (component|function|hook|class)/i,
      /create a (file|component|page)/i,
      /build (a|an|the)/i,
      /add (a|an|the|feature)/i,
      /update (the|a)/i,
      /modify/i,
      /change/i,
      /refactor/i,
    ],
    stage: WorkflowStage.CODING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  [SkillType.DEBUG]: {
    name: 'Debug',
    description: 'Identifies and fixes bugs, errors, or unexpected behavior',
    triggerPatterns: [
      /fix (the|a|this)/i,
      /bug/i,
      /error/i,
      /not working/i,
      /broken/i,
      /issue with/i,
      /problem with/i,
      /debug/i,
      /what's wrong/i,
      /something's wrong/i,
      /doesn't work/i,
      /failing/i,
    ],
    stage: WorkflowStage.CODING,
    requiresFiles: true,
    supportsStreaming: true,
  },

  [SkillType.REVIEW]: {
    name: 'Review',
    description: 'Reviews code quality, suggests improvements, and ensures best practices',
    triggerPatterns: [
      /review (the|this|my)/i,
      /check (the|code|quality)/i,
      /improve (the|this|code)/i,
      /refactor (the|this)/i,
      /optimize/i,
      /clean up/i,
      /best practices/i,
      /suggestions for/i,
    ],
    stage: WorkflowStage.REVIEWING,
    requiresFiles: true,
    supportsStreaming: true,
  },

  [SkillType.SEARCH]: {
    name: 'Search',
    description: 'Searches the web for documentation, examples, or current information',
    triggerPatterns: [
      /^search/i,
      /look up/i,
      /find (information|documentation|examples)/i,
      /latest (news|version|release)/i,
      /how to use (react|typescript|tailwind)/i,
      /documentation for/i,
      /what is (react|typescript|next)/i,
      /check the docs/i,
    ],
    stage: WorkflowStage.THINKING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  [SkillType.GENERAL]: {
    name: 'General',
    description: 'Handles conversational messages and general questions',
    triggerPatterns: [],
    stage: WorkflowStage.IDLE,
    requiresFiles: false,
    supportsStreaming: true,
  },
};

const handlers: Record<SkillType, SkillHandler> = {
  [SkillType.BRAINSTORM]: brainstormHandler,
  [SkillType.PLAN]: planHandler,
  [SkillType.CODE]: codeHandler,
  [SkillType.DEBUG]: debugHandler,
  [SkillType.REVIEW]: reviewHandler,
  [SkillType.SEARCH]: searchHandler,
  [SkillType.GENERAL]: generalHandler,
};

/**
 * Classify user intent based on message content
 */
export function classifyIntent(input: string): IntentMatch {
  const normalizedInput = input.trim().toLowerCase();

  // Check each skill's trigger patterns
  for (const [skillType, config] of Object.entries(skillConfigs)) {
    for (const pattern of config.triggerPatterns) {
      if (pattern.test(normalizedInput)) {
        return {
          skillType: skillType as SkillType,
          confidence: 0.85,
          matchedPattern: pattern.source,
        };
      }
    }
  }

  // Default to general skill
  return {
    skillType: SkillType.GENERAL,
    confidence: 0.5,
  };
}

/**
 * Get skill configuration by type
 */
export function getSkillConfig(type: SkillType): SkillConfig {
  return skillConfigs[type];
}

/**
 * Get skill handler by type
 */
export function getSkillHandler(type: SkillType): SkillHandler | null {
  return handlers[type] || null;
}

/**
 * Get all available skill configurations
 */
export function getAllSkillConfigs(): SkillConfig[] {
  return Object.values(skillConfigs);
}

/**
 * Get handler for a specific intent
 */
export function getHandlerForIntent(input: string): {
  handler: SkillHandler;
  match: IntentMatch;
} | null {
  const match = classifyIntent(input);
  const handler = getSkillHandler(match.skillType);

  if (!handler) {
    return null;
  }

  return { handler, match };
}
