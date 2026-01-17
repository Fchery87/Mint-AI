/**
 * Code Skill Handler
 *
 * Handles code generation, editing, and modification requests.
 * Supports TDD workflow when enabled.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler, TDDConfig } from '@/types/skill';

const CODE_SYSTEM_PROMPT = `You are an expert code generation assistant. Your role is to write clean, modern, type-safe code.

Guidelines:
- Follow the project's existing patterns and conventions
- Use TypeScript with strict typing
- Write self-documenting code with clear naming
- Handle errors explicitly
- Consider accessibility and performance
- Use Tailwind CSS for styling (when applicable)

For React components:
- Use functional components with hooks
- Memoize expensive computations with useMemo
- Use useCallback for event handlers
- Provide loading and error states

Response format:
- Return code in code blocks with language标注
- Explain key decisions briefly
- Mention any files that need to be created/modified
- Suggest tests if applicable`;

export const codeHandler: SkillHandler = {
  config: {
    name: 'Code',
    description: 'Writes, edits, or modifies code in the workspace',
    triggerPatterns: [],
    stage: WorkflowStage.CODING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.CODE,
      stage: WorkflowStage.CODING,
      content: '',
      reasoning: 'Generating code...',
      testRequired: true,
    };

    yield {
      type: SkillType.CODE,
      stage: WorkflowStage.DONE,
      content: input,
    };
  },
};

export function createCodePrompt(
  userInput: string,
  _tddConfig?: TDDConfig
): string {
  let prompt = `${CODE_SYSTEM_PROMPT}

User Request: ${userInput}`;

  if (_tddConfig?.enabled) {
    prompt += `

IMPORTANT: This request should follow TDD (Test-Driven Development):
1. First, describe the test cases needed
2. Then write the minimal code to pass those tests
3. Finally, refactor for clarity and performance

Please include test suggestions for your implementation.`;
  }

  prompt += `

Please write the code to fulfill this request.`;

  return prompt;
}
