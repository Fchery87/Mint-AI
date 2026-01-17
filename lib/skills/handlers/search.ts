/**
 * Search Skill Handler
 *
 * Searches the web for documentation, examples, or current information.
 * Integrates with Exa API for web search context.
 */

import { SkillType, WorkflowStage, SkillContext, SkillResult, SkillHandler } from '@/types/skill';

const SEARCH_SYSTEM_PROMPT = `You are a research assistant. Your role is to find relevant information and documentation.

Guidelines:
- Provide accurate, up-to-date information
- Include links to official documentation
- Give practical examples
- Explain concepts clearly
- Note any version-specific considerations`;

export const searchHandler: SkillHandler = {
  config: {
    name: 'Search',
    description: 'Searches the web for documentation, examples, or current information',
    triggerPatterns: [],
    stage: WorkflowStage.THINKING,
    requiresFiles: false,
    supportsStreaming: true,
  },

  async *process(input: string, _context: SkillContext): AsyncIterable<SkillResult> {
    yield {
      type: SkillType.SEARCH,
      stage: WorkflowStage.THINKING,
      content: '',
      reasoning: 'Searching for information...',
    };

    yield {
      type: SkillType.SEARCH,
      stage: WorkflowStage.DONE,
      content: input,
    };
  },
};

export function createSearchQuery(userInput: string): string {
  // Extract the actual search query from the user's message
  const patterns = [
    /^search (for |)(.+)$/i,
    /^look up (.+)$/i,
    /^find (information |documentation |examples for )(.+)$/i,
    /^what is (.+)$/i,
    /^how to use (.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match) {
      return match[match.length - 1] || userInput;
    }
  }

  // Default: return the cleaned message
  return userInput
    .replace(/^(search|look up|find|what is|how to|check the docs)/i, '')
    .replace(/^(for|about|on) /i, '')
    .trim();
}

export function createSearchPrompt(userInput: string, searchResults: string): string {
  return `${SEARCH_SYSTEM_PROMPT}

User Question: ${userInput}

Search Results:
${searchResults}

Please provide a helpful answer based on the search results. Include relevant links and examples.`;
}
