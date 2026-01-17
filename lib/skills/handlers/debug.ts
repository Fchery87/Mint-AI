/**
 * Debug Skill Handler
 *
 * Identifies and fixes bugs, errors, or unexpected behavior
 * in the current codebase.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const DEBUG_SYSTEM_PROMPT = `You are a debugging expert. Your role is to identify root causes of bugs and fix them effectively.

Guidelines:
- Reproduce the problem first (understand what's happening)
- Identify the root cause, not just symptoms
- Consider the full context (上下游代码)
- Fix the root cause, not just the symptom
- Add defensive code to prevent future issues
- Explain the bug and your fix clearly

Response format:
1. Problem Summary - What is happening
2. Root Cause - Why it's happening
3. Fix - Your solution with code
4. Prevention - How to avoid this in the future`;

export const debugHandler: SkillHandler = {
  config: {
    name: 'Debug',
    description: 'Identifies and fixes bugs, errors, or unexpected behavior',
    triggerPatterns: [],
    stage: WorkflowStage.CODING,
    requiresFiles: true,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.DEBUG,
      stage: WorkflowStage.THINKING,
      content: '',
      reasoning: 'Analyzing the bug...',
    };

    yield {
      type: SkillType.DEBUG,
      stage: WorkflowStage.CODING,
      content: '',
      reasoning: 'Identifying root cause...',
    };

    yield {
      type: SkillType.DEBUG,
      stage: WorkflowStage.DONE,
      content: input,
    };
  },
};

export function createDebugPrompt(userInput: string): string {
  return `${DEBUG_SYSTEM_PROMPT}

Bug Report: ${userInput}

Please debug this issue and provide a fix.`;
}
