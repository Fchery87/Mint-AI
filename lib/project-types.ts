/**
 * Types for multi-file project support
 */

import { getExtensionForLanguage } from './preview-support';

export interface ProjectFile {
  path: string; // e.g., "src/app/page.tsx"
  content: string;
  language: string; // for syntax highlighting
}

export interface ProjectOutput {
  type: 'single' | 'project';
  files: ProjectFile[];
  name?: string; // project name
}

/**
 * Detect language from file path
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';

  const extToLang: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    vue: 'vue',
    svelte: 'svelte',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    sh: 'bash',
    sql: 'sql',
  };

  return extToLang[ext] || 'plaintext';
}

/**
 * Parse multi-file output from AI response
 * Looks for ```file:path/to/file.ext markers
 */
export function parseProjectOutput(response: string): ProjectOutput {
  // Look for file markers: ```file:path/to/file.ext
  const filePattern = /```file:([^\n]+)\n([\s\S]*?)```/g;
  const files: ProjectFile[] = [];

  let match;
  while ((match = filePattern.exec(response)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    files.push({
      path,
      content,
      language: getLanguageFromPath(path),
    });
  }

  // If we found file markers, it's a project
  if (files.length > 0) {
    // Try to extract project name from README or package.json
    const packageJson = files.find((f) => f.path === 'package.json');
    let name = 'project';
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        name = pkg.name || 'project';
      } catch {
        // ignore parse errors
      }
    }

    return { type: 'project', files, name };
  }

  // Fallback: look for inline file markers without fences
  const inlineFiles = parseInlineFileMarkers(response);
  if (inlineFiles.length > 0) {
    return {
      type: 'project',
      files: inlineFiles,
      name: inlineFiles.find((f) => f.path === 'package.json')
        ? 'project'
        : 'project',
    };
  }

  // Otherwise, treat as single file output
  // Extract the code from the first code block
  const codePattern = /```(\w+)?\n([\s\S]*?)```/;
  const codeMatch = response.match(codePattern);

  if (codeMatch) {
    const rawLanguage = (codeMatch[1] || '').toLowerCase();
    const content = codeMatch[2].trim();
    const inferredLanguage = inferLanguageFromContent(content);

    // Prefer the explicit fence language, but correct common cases where
    // "typescript" blocks actually contain JSX (tsx).
    const language =
      rawLanguage === 'typescript' && inferredLanguage === 'tsx'
        ? 'tsx'
        : rawLanguage || inferredLanguage || 'plaintext';

    const ext = getExtensionForLanguage(language);
    const path = inferDefaultPathFromLanguage(language, ext);

    return {
      type: 'single',
      files: [
        {
          path,
          content,
          language,
        },
      ],
    };
  }

  // Fallback: infer language from content for better UX
  const inferredLanguage = inferLanguageFromContent(response);
  const inferredPath = inferDefaultPathFromLanguage(inferredLanguage);

  return {
    type: 'single',
    files: [
      {
        path: inferredPath,
        content: response.trim(),
        language: inferredLanguage,
      },
    ],
  };
}

function parseInlineFileMarkers(response: string): ProjectFile[] {
  const normalized = response.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const files: ProjectFile[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('file:')) {
      const path = line.slice('file:'.length).trim();
      i += 1;
      const contentLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('file:')) {
        contentLines.push(lines[i]);
        i += 1;
      }
      const content = contentLines.join('\n').trim();
      files.push({
        path,
        content,
        language: getLanguageFromPath(path),
      });
      continue;
    }
    i += 1;
  }

  return files;
}

function inferLanguageFromContent(content: string): string {
  const text = content.replace(/\r\n/g, '\n');

  // React/TSX-ish - check FIRST (most common for this app)
  if (
    /import\s+.*\s+from\s+['"]react['"]/.test(text) ||
    /from\s+['"]react['"]/.test(text) ||
    /import\s+React\b/.test(text) ||
    /export\s+default\s+function\s+\w+/.test(text) ||
    /return\s*\(\s*</.test(text) ||
    /<[A-Z][a-zA-Z]*[\s/>]/.test(text) // JSX component tags
  ) {
    return 'tsx';
  }

  // HTML
  if (/(<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>])/i.test(text)) {
    return 'html';
  }

  // JS/TS - check before Python (JS imports look like Python)
  if (
    /import\s+.*\s+from\s+['"]/.test(text) || // ES6 imports
    /export\s+(default|const|function|class)\s+/.test(text) ||
    /const\s+\w+\s*=\s*\(/.test(text) || // arrow functions
    /interface\s+\w+\s*\{/.test(text) || // TypeScript
    /type\s+\w+\s*=/.test(text) // TypeScript
  ) {
    return 'typescript';
  }

  // Python - more specific checks to avoid false positives with JS
  if (
    /(^|\n)\s*def\s+\w+\s*\(/.test(text) || // Python function def
    /(^|\n)\s*class\s+\w+\s*[:(]/.test(text) || // Python class
    /(^|\n)\s*from\s+\w+\s+import\s+/.test(text) || // Python from X import Y
    /:\s*\n\s+(pass|return|if|for|while)\b/.test(text) // Python indented blocks
  ) {
    return 'python';
  }

  return 'plaintext';
}

function inferDefaultPathFromLanguage(language: string, ext?: string): string {
  const resolvedExt = ext || getExtensionForLanguage(language);

  switch (language) {
    case 'python':
      return 'main.py';
    case 'html':
      return 'index.html';
    case 'tsx':
      return 'Component.tsx';
    case 'typescript':
      return 'index.ts';
    case 'javascript':
      return 'index.js';
    default:
      return `output.${resolvedExt || 'txt'}`;
  }
}

/**
 * Build a tree structure from flat file paths
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  language?: string;
  targetPath?: string; // original file path when using virtual grouping
}

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  const isFlat = files.length > 1 && files.every((f) => !f.path.includes('/'));

  const getVirtualGroup = (file: ProjectFile): string => {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'src';
    if (['py'].includes(ext)) return 'src';
    if (['css', 'scss'].includes(ext)) return 'styles';
    if (['html', 'htm'].includes(ext)) return 'public';
    if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'config';
    if (['md'].includes(ext)) return 'docs';
    return 'other';
  };

  for (const file of files) {
    const virtualPath = isFlat
      ? `${getVirtualGroup(file)}/${file.path}`
      : file.path;
    const parts = virtualPath.split('/');
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      let node = current.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          language: isFile ? file.language : undefined,
          targetPath: isFile && isFlat ? file.path : undefined,
          children: isFile ? undefined : [],
        };
        current.push(node);
      }

      if (!isFile && node.children) {
        current = node.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        if (node.children) {
          node.children = sortNodes(node.children);
        }
        return node;
      });
  };

  return sortNodes(root);
}
