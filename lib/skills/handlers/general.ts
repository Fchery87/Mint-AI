/**
 * General Skill Handler
 *
 * Handles conversational messages and general questions that
 * don't match specific skill triggers.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const GENERAL_SYSTEM_PROMPT = `You are a helpful AI assistant for a coding workspace.

Guidelines:
- Be conversational and friendly
- Help with coding questions
- Ask clarifying questions when needed
- Suggest relevant actions when appropriate
- Keep responses concise and helpful`;

export const generalHandler: SkillHandler = {
  config: {
    name: 'General',
    description: 'Handles conversational messages and general questions',
    triggerPatterns: [],
    stage: WorkflowStage.IDLE,
    requiresFiles: false,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.GENERAL,
      stage: WorkflowStage.IDLE,
      content: input,
    };
  },
};

export function createGeneralPrompt(userInput: string): string {
  return `${GENERAL_SYSTEM_PROMPT}

User Message: ${userInput}

Please respond to the user's message.`;
}
