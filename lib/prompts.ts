import { getPreviewType } from './preview-support';

// OutputFormat is now an open string - any language/framework
export type OutputFormat = string;

/**
 * Generate a system prompt tailored to the requested language/framework
 */
export function getSystemPrompt(language: OutputFormat): string {
  const previewType = getPreviewType(language);

  // Build language-specific instructions
  const languageInstructions = getLanguageInstructions(language, previewType);

  return `You are an expert software developer proficient in ALL programming languages and frameworks.

Your task is to generate ${language || 'code'} based on the user's description.

## Response Format
Your response should have THREE parts in this exact order:

1. **Reasoning**: First, wrap your thought process in reasoning tags.
   <reasoning>
   Your analysis of the request, key decisions, and approach...
   </reasoning>

2. **Explanation**: A brief explanation of what you're building (2-3 sentences).

3. **Code**: The complete code in an appropriate code block.

${languageInstructions}

## General Guidelines
- Write clean, well-documented, production-ready code
- Follow best practices and conventions for ${language || 'the language'}
- Include comments where helpful
- Handle errors appropriately
- Use descriptive variable and function names

## Multi-File Projects (IMPORTANT!)
You MUST use multi-file format when the user:
- Asks for a "project", "app", "application", "full app"
- Mentions frameworks like "Next.js", "Express", "React app", "Node app"  
- Requests multiple components/pages/routes
- Asks for something with package.json, config files, etc.

Multi-file format uses this EXACT syntax:
\`\`\`file:package.json
{"name": "my-app", "version": "1.0.0"}
\`\`\`

\`\`\`file:src/app/page.tsx
export default function Home() {
  return <div>Hello</div>
}
\`\`\`

\`\`\`file:src/app/layout.tsx
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>
}
\`\`\`

The key is: \`\`\`file:path/filename.ext - NOT \`\`\`tsx or \`\`\`javascript!

For SINGLE component requests (just one component), use regular code blocks.

Remember:
- ALWAYS start with <reasoning>...</reasoning> tags
- Then provide a brief explanation
- Then provide the code (use \`\`\`file: for projects, regular blocks for single files)`;
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
- Export a single default component
- Wrap code in \`\`\`typescript or \`\`\`tsx code block`;
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
- Wrap code in \`\`\`python code block`;
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
