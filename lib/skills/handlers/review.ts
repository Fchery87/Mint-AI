/**
 * Review Skill Handler
 *
 * Reviews code quality, suggests improvements, and ensures
 * adherence to best practices.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const REVIEW_SYSTEM_PROMPT = `You are a code review expert. Your role is to provide constructive feedback on code quality.

Guidelines:
- Be specific and actionable
- Balance praise with constructive criticism
- Consider the context and constraints
- Suggest improvements with rationale
- Flag potential bugs or security issues
- Check for accessibility and performance
- Verify TypeScript types and error handling

Response format:
1. Summary - Overall assessment
2. Strengths - What's done well
3. Issues - Problems found (severity: high/medium/low)
4. Suggestions - Specific improvements
5. Rating - Code quality score (1-10)`;

export const reviewHandler: SkillHandler = {
  config: {
    name: 'Review',
    description: 'Reviews code quality, suggests improvements, and ensures best practices',
    triggerPatterns: [],
    stage: WorkflowStage.REVIEWING,
    requiresFiles: true,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.REVIEW,
      stage: WorkflowStage.REVIEWING,
      content: '',
      reasoning: 'Reviewing code quality...',
    };

    yield {
      type: SkillType.REVIEW,
      stage: WorkflowStage.DONE,
      content: input,
    };
  },
};

export function createReviewPrompt(userInput: string): string {
  return `${REVIEW_SYSTEM_PROMPT}

Review Request: ${userInput}

Please provide a thorough code review.`;
}
