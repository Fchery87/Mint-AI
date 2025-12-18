/**
 * Preview support detection for different languages/frameworks
 * Determines if code can be rendered in a browser iframe
 */

// Languages that can be previewed in a browser iframe
const PREVIEWABLE_LANGUAGES = new Set([
  // Web fundamentals
  'html',
  'css',
  'javascript',
  'js',

  // React ecosystem
  'react',
  'react-tsx',
  'react-jsx',
  'tsx',
  'jsx',

  // Vue
  'vue',
  'vue-sfc',
  'vue3',

  // Other frontend frameworks
  'svelte', // Could be previewable with REPL-style compiler
  'vanilla-js',
  'vanilla',

  // HTML variants
  'htm',
  'xhtml',
]);

/**
 * Check if a language can be previewed in the browser
 */
export function isPreviewable(language: string): boolean {
  if (!language) return false;
  const normalized = language.toLowerCase().trim().replace(/\s+/g, '-');
  return PREVIEWABLE_LANGUAGES.has(normalized);
}

/**
 * Get preview type for a language
 */
export type PreviewType = 'react' | 'html' | 'vue' | 'code-only';

export function getPreviewType(language: string): PreviewType {
  if (!language) return 'code-only';

  const normalized = language.toLowerCase().trim().replace(/\s+/g, '-');

  // React family
  if (['react', 'react-tsx', 'react-jsx', 'tsx', 'jsx'].includes(normalized)) {
    return 'react';
  }

  // Vue family
  if (['vue', 'vue-sfc', 'vue3'].includes(normalized)) {
    return 'vue';
  }

  // HTML family (includes vanilla JS since it renders via HTML)
  if (
    [
      'html',
      'htm',
      'xhtml',
      'vanilla-js',
      'vanilla',
      'javascript',
      'js',
      'css',
    ].includes(normalized)
  ) {
    return 'html';
  }

  return 'code-only';
}

/**
 * Map language names to file extensions
 */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  // Web
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  css: 'css',
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',

  // React
  react: 'tsx',
  'react-tsx': 'tsx',
  'react-jsx': 'jsx',
  tsx: 'tsx',
  jsx: 'jsx',

  // Vue/Svelte
  vue: 'vue',
  'vue-sfc': 'vue',
  vue3: 'vue',
  svelte: 'svelte',

  // Backend / System
  python: 'py',
  py: 'py',
  rust: 'rs',
  go: 'go',
  golang: 'go',
  java: 'java',
  kotlin: 'kt',
  swift: 'swift',
  ruby: 'rb',
  php: 'php',
  perl: 'pl',

  // C family
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'cs',
  'c#': 'cs',

  // Other
  scala: 'scala',
  haskell: 'hs',
  elixir: 'ex',
  erlang: 'erl',
  clojure: 'clj',
  lua: 'lua',
  r: 'r',
  julia: 'jl',
  dart: 'dart',
  zig: 'zig',
  nim: 'nim',

  // Shell/scripting
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  zsh: 'zsh',
  powershell: 'ps1',

  // Data/Config
  json: 'json',
  yaml: 'yaml',
  yml: 'yml',
  toml: 'toml',
  xml: 'xml',
  sql: 'sql',
  graphql: 'graphql',

  // Markdown/Docs
  markdown: 'md',
  md: 'md',

  // Node specific
  node: 'js',
  nodejs: 'js',
  'node-js': 'js',
};

/**
 * Get file extension for a language
 */
export function getExtensionForLanguage(language: string): string {
  if (!language) return 'txt';
  const normalized = language.toLowerCase().trim().replace(/\s+/g, '-');
  return LANGUAGE_EXTENSIONS[normalized] || 'txt';
}

/**
 * Get a default filename for a language
 */
export function getDefaultFilename(language: string): string {
  const ext = getExtensionForLanguage(language);
  const normalized = language.toLowerCase().trim();

  // Special cases for common patterns
  if (ext === 'html') return 'index.html';
  if (ext === 'css') return 'styles.css';
  if (ext === 'py') return 'main.py';
  if (ext === 'go') return 'main.go';
  if (ext === 'rs') return 'main.rs';
  if (ext === 'java') return 'Main.java';
  if (ext === 'tsx' || ext === 'jsx') return 'Component.tsx';
  if (ext === 'vue') return 'Component.vue';
  if (ext === 'svelte') return 'Component.svelte';
  if (ext === 'js' && normalized.includes('node')) return 'index.js';

  return `code.${ext}`;
}
