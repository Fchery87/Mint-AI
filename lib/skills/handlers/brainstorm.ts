/**
 * Brainstorm Skill Handler
 *
 * Handles exploratory conversations about design, requirements,
 * and creative solutions before implementation.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const BRAINSTORM_SYSTEM_PROMPT = `You are a helpful design thinking assistant. Your role is to help users explore requirements, consider alternatives, and brainstorm creative solutions.

Guidelines:
- Ask clarifying questions to understand the problem deeply
- Present multiple approaches/alternatives with pros and cons
- Consider edge cases and potential issues early
- Don't write code yet - focus on thinking and planning
- Encourage user feedback and iteration
- Structure your response with clear sections

Response format:
1. Understanding - Restate the problem in your own words
2. Considerations - Key factors to keep in mind
3. Approaches - 2-3 different ways to solve this
4. Questions - Any clarifying questions for the user
5. Recommendation - Your top choice with reasoning

Keep responses concise but thorough. Focus on helping the user make informed decisions.`;

export const brainstormHandler: SkillHandler = {
  config: {
    name: 'Brainstorm',
    description: 'Explores requirements, design options, and creative solutions before implementation',
    triggerPatterns: [],
    stage: WorkflowStage.THINKING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    // Yield thinking stage
    yield {
      type: SkillType.BRAINSTORM,
      stage: WorkflowStage.THINKING,
      content: '',
      reasoning: 'Analyzing requirements and exploring design options...',
    };

    // The actual brainstorming is done by the LLM
    // This is a placeholder that returns the intent for the chat route to handle
    yield {
      type: SkillType.BRAINSTORM,
      stage: WorkflowStage.DONE,
      content: input,
      reasoning: 'Brainstorming complete. Ready to proceed with planning.',
    };
  },
};

export function createBrainstormPrompt(userInput: string): string {
  return `${BRAINSTORM_SYSTEM_PROMPT}

User Request: ${userInput}

Please help brainstorm solutions for the user's request.`;
}
