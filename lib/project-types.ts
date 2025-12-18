/**
 * Types for multi-file project support
 */

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

  // Otherwise, treat as single file output
  // Extract the code from the first code block
  const codePattern = /```(\w+)?\n([\s\S]*?)```/;
  const codeMatch = response.match(codePattern);

  if (codeMatch) {
    const language = codeMatch[1] || 'tsx';
    const content = codeMatch[2].trim();
    return {
      type: 'single',
      files: [
        {
          path: `Component.${language === 'typescript' ? 'tsx' : language}`,
          content,
          language,
        },
      ],
    };
  }

  // Fallback: return raw response as single file
  return {
    type: 'single',
    files: [
      {
        path: 'output.txt',
        content: response,
        language: 'plaintext',
      },
    ],
  };
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
}

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
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
