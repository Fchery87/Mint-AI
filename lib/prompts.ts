import { getPreviewType } from './preview-support';

// OutputFormat is now an open string - any language/framework
export type OutputFormat = string;

export interface PromptOptions {
  mode?: 'agent' | 'ask' | 'blueprint';
}

/**
 * Generate a system prompt tailored to the requested language/framework
 */
export function getSystemPrompt(
  language: OutputFormat,
  options: PromptOptions = {}
): string {
  const mode = options.mode || 'agent';
  const previewType = getPreviewType(language);

  // Build language-specific instructions
  const languageInstructions = getLanguageInstructions(language, previewType);

  const responseFormat =
    mode === 'ask'
      ? `## Response Format (Ask Mode)
Your response should have thinking blocks followed by your answer:

1. **Thinking**: Use thinking tags to show your reasoning step by step:
   <thinking type="understanding">Your understanding of the question</thinking>
   <thinking type="approach">How you'll approach answering</thinking>

2. **Answer**: A clear, direct answer.`
      : `## Response Format
Your response should have thinking blocks followed by explanation and code:

1. **Thinking**: Use thinking tags to show your reasoning step by step:
   <thinking type="understanding">What the user is asking for</thinking>
   <thinking type="approach">Your high-level strategy</thinking>
   <thinking type="architecture">Key design decisions</thinking>
   
   IMPORTANT: Each thinking tag will be streamed as a SEPARATE collapsible block.

2. **Explanation**: Brief description of what you're building.

3. **Code**: Use code blocks for file generation.`;

  const rememberBlock =
    mode === 'ask'
      ? `Remember:
- Use <thinking> tags for reasoning
- Each thinking tag streams as a separate block`
      : `Remember:
- Use <thinking type="..."> tags for reasoning
- Each thinking tag streams as a separate block
- Finish all thinking BEFORE writing code`;

  return `You are an expert software developer proficient in ALL programming languages and frameworks.

Your task is to generate ${language || 'code'} based on the user's description.

## Complexity Warning
If the user's request seems overly complex, vague, or would benefit from clarification:
- In your <reasoning>, identify what's unclear or overly broad
- Suggest they break it into smaller, focused requests
- Propose the simplest MVP version that addresses their core need
- Ask clarifying questions about scope/requirements

**Example**: "Build a social media platform" → Too broad. Suggest: "Let's start with a simple post feed. Should I build that first?"

${responseFormat}

${languageInstructions}

## Code Quality Standards (CRITICAL)
**Priority Order:** 1) Correctness 2) Simplicity 3) Consistency 4) Performance

**Core Principles:**
- **Simplicity first** → Write the smallest, clearest solution that works
- **Clarity over cleverness** → Code must be obvious to another engineer
- **No over-engineering** → Don't add features, abstractions, or complexity "just in case"
- **Production-ready** → No TODO comments, no "temporary" hacks, no incomplete implementations

**Absolute Don'ts:**
- ❌ Don't add unused utilities, helpers, or abstractions
- ❌ Don't create generic/flexible code when specific code is simpler
- ❌ Don't add features beyond what was explicitly requested
- ❌ Don't use complex patterns when simple code suffices

**General Guidelines:**
- Write clean, well-documented code
- Follow best practices and conventions for ${language || 'the language'}
- Include comments only where logic isn't self-evident
- Handle errors appropriately (but don't add unrequested error handling)
- Use descriptive variable and function names

## Multi-File Projects (IMPORTANT!)
You MUST use multi-file format when the user:
- Asks for a "project", "app", "application", "full app", "game"
- Mentions frameworks like "Next.js", "Express", "React app", "Flask", "Django", "pygame"
- Requests multiple components/pages/routes/modules
- Asks for something that naturally needs multiple files (config, assets, modules, etc.)

Multi-file format uses this EXACT syntax:
\`\`\`file:package.json
{"name": "my-app", "version": "1.0.0"}
\`\`\`

\`\`\`file:src/app/page.tsx
export default function Home() {
  return <div>Hello</div>
}
\`\`\`

Python game example with proper folder structure:
\`\`\`file:src/game.py
import pygame
from src.player import Player
# Main game logic
\`\`\`

\`\`\`file:src/player.py
class Player:
    # Player class
\`\`\`

\`\`\`file:requirements.txt
pygame==2.5.0
\`\`\`

\`\`\`file:README.md
# Game Instructions
\`\`\`

IMPORTANT: Use proper folder structure (src/, app/, components/, etc.) - NOT flat files!
The key is: \`\`\`file:folder/filename.ext - NOT \`\`\`python or flat filenames!

For SINGLE file/script requests, use regular code blocks.

${rememberBlock}`;
}

/**
 * Get language-specific instructions based on the requested language
 */
function getLanguageInstructions(
  language: string,
  previewType: string
): string {
  const lang = (language || '').toLowerCase().trim();

  // React/TSX
  if (
    previewType === 'react' ||
    lang.includes('react') ||
    lang === 'tsx' ||
    lang === 'jsx'
  ) {
    return `## React/TypeScript Requirements
- Use TypeScript with proper type definitions
- Use functional components with React hooks
- Use Tailwind CSS for styling (the preview supports Tailwind)
- Make components responsive and accessible
- For multi-file projects (apps), organize properly:
  * Next.js: Use \`app/\` folder: \`\`\`file:app/page.tsx
  * Components: Use \`components/\` folder: \`\`\`file:components/Button.tsx
  * Config: Root level: \`\`\`file:package.json
- For single components, wrap code in \`\`\`typescript or \`\`\`tsx code block`;
  }

  // Vue
  if (previewType === 'vue' || lang.includes('vue')) {
    return `## Vue Requirements
- Use Vue 3 Composition API with <script setup>
- Create a Single File Component (.vue)
- Include <template>, <script setup>, and <style> sections
- Use scoped styles where appropriate
- Wrap code in \`\`\`vue code block`;
  }

  // HTML/Vanilla JS
  if (previewType === 'html' || lang === 'html' || lang.includes('vanilla')) {
    return `## HTML/JavaScript Requirements
- Output a single, complete HTML document
- Include <!DOCTYPE html>, <html>, <head>, <body>
- Put CSS in a <style> tag, JS in a <script> tag
- Make it self-contained (no external dependencies unless necessary)
- Wrap code in \`\`\`html code block`;
  }

  // Python
  if (lang === 'python' || lang === 'py') {
    return `## Python Requirements
- Use Python 3.x syntax
- Include type hints where appropriate
- Follow PEP 8 style guidelines
- Include docstrings for functions/classes
- For games, use pygame library (assume it's installed)
- For multi-file projects (games, apps), organize files properly:
  * Main code in \`src/\` folder: \`\`\`file:src/game.py
  * Config files in root: \`\`\`file:requirements.txt
  * Documentation in root: \`\`\`file:README.md
- For single scripts, use \`\`\`python code block`;
  }

  // Rust
  if (lang === 'rust' || lang === 'rs') {
    return `## Rust Requirements
- Use idiomatic Rust patterns
- Include proper error handling with Result/Option
- Add documentation comments (///)
- Wrap code in \`\`\`rust code block`;
  }

  // Go
  if (lang === 'go' || lang === 'golang') {
    return `## Go Requirements
- Follow Go conventions and idioms
- Include proper error handling
- Use gofmt-compatible formatting
- Add comments for exported functions
- Wrap code in \`\`\`go code block`;
  }

  // Java
  if (lang === 'java') {
    return `## Java Requirements
- Use modern Java features (Java 11+)
- Follow Java naming conventions
- Include JavaDoc comments
- Wrap code in \`\`\`java code block`;
  }

  // C/C++
  if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
    return `## C/C++ Requirements
- Use modern ${lang === 'c' ? 'C' : 'C++'} standards
- Include proper memory management
- Add header guards if creating headers
- Wrap code in \`\`\`${lang === 'c' ? 'c' : 'cpp'} code block`;
  }

  // TypeScript (non-React)
  if (lang === 'typescript' || lang === 'ts') {
    return `## TypeScript Requirements
- Use proper type definitions
- Follow TypeScript best practices
- Include interfaces/types as needed
- Wrap code in \`\`\`typescript code block`;
  }

  // JavaScript (non-React)
  if (
    lang === 'javascript' ||
    lang === 'js' ||
    lang === 'node' ||
    lang === 'nodejs'
  ) {
    return `## JavaScript/Node.js Requirements
- Use modern ES6+ syntax
- Include JSDoc comments where helpful
- Use async/await for asynchronous code
- Wrap code in \`\`\`javascript code block`;
  }

  // Default for any other language
  return `## ${language || 'Code'} Requirements
- Write idiomatic ${language || 'code'} following best practices
- Include appropriate comments and documentation
- Wrap code in an appropriate code block with the language identifier`;
}
