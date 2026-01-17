/**
 * Plan Skill Handler
 *
 * Creates detailed implementation plans with step-by-step breakdown
 * and task organization.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const PLAN_SYSTEM_PROMPT = `You are a technical project planner. Your role is to create detailed, actionable implementation plans.

Guidelines:
- Break down complex tasks into manageable steps
- Order steps logically (prerequisites first)
- Estimate complexity and identify potential blockers
- Consider edge cases and error handling
- Include testing and review steps
- Keep each step focused and actionable

Response format:
1. Overview - Brief summary of the plan
2. Steps - Numbered list with detailed actions
3. Dependencies - What each step needs
4. Risks - Potential issues and mitigations
5. Next Steps - What to do after this plan

Be specific about file changes, code patterns, and implementation details.`;

export const planHandler: SkillHandler = {
  config: {
    name: 'Plan',
    description: 'Creates detailed implementation plans with step-by-step breakdown',
    triggerPatterns: [],
    stage: WorkflowStage.PLANNING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.PLAN,
      stage: WorkflowStage.PLANNING,
      content: '',
      reasoning: 'Creating implementation plan...',
    };

    yield {
      type: SkillType.PLAN,
      stage: WorkflowStage.DONE,
      content: input,
    };
  },
};

export function createPlanPrompt(userInput: string): string {
  return `${PLAN_SYSTEM_PROMPT}

User Request: ${userInput}

Please create a detailed implementation plan.`;
}
