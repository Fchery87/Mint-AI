/**
 * Sandpack execution wrapper for React/JavaScript/TypeScript
 */

import type { ProjectFile } from '@/lib/project-types';

export interface SandpackConfig {
  files: Record<string, { code: string }>;
  template: 'react' | 'react-ts' | 'vanilla' | 'vanilla-ts';
  dependencies?: Record<string, string>;
}

/**
 * Convert ProjectFile[] to Sandpack file format
 */
export function projectFilesToSandpack(files: ProjectFile[]): SandpackConfig {
  const sandpackFiles: Record<string, { code: string }> = {};
  let template: SandpackConfig['template'] = 'react-ts';
  const dependencies: Record<string, string> = {};

  // Detect template based on files
  const hasTypeScript = files.some(
    (f) => f.path.endsWith('.tsx') || f.path.endsWith('.ts')
  );
  const hasCss = files.some((f) => f.path.endsWith('.css') || f.path.endsWith('.scss'));
  const scriptFiles = files.filter(
    (f) => f.path.endsWith('.js') || f.path.endsWith('.ts')
  );
  const hasReact = files.some(
    (f) =>
      f.content.includes('import React') ||
      f.content.includes('from "react"') ||
      f.content.includes("from 'react'")
  );

  if (hasReact && hasTypeScript) {
    template = 'react-ts';
  } else if (hasReact) {
    template = 'react';
  } else if (hasTypeScript) {
    template = 'vanilla-ts';
  } else {
    template = 'vanilla';
  }

  // Convert files to Sandpack format
  for (const file of files) {
    // Sandpack expects files to start with /
    const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
    sandpackFiles[path] = { code: file.content };
  }

  // Extract dependencies from package.json if present
  const packageJson = files.find((f) => f.path === 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      if (pkg.dependencies) {
        Object.assign(dependencies, pkg.dependencies);
      }
    } catch (e) {
      console.warn('Failed to parse package.json:', e);
    }
  }

  // Ensure we have an entry point
  if (
    !sandpackFiles['/App.tsx'] &&
    !sandpackFiles['/App.jsx'] &&
    !sandpackFiles['/index.tsx'] &&
    !sandpackFiles['/index.jsx']
  ) {
    // Find the first component file
    const componentFile = files.find(
      (f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx')
    );

    if (componentFile) {
      const entryPath = hasTypeScript ? '/App.tsx' : '/App.jsx';
      sandpackFiles[entryPath] = { code: componentFile.content };
    }
  }

  if (template === 'vanilla' || template === 'vanilla-ts') {
    if (!sandpackFiles['/index.html']) {
      const existingHtml = files.find(
        (f) => f.path.endsWith('.html') || f.path.endsWith('.htm')
      );
      const html = existingHtml
        ? existingHtml.content
        : `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox</title>
    ${hasCss ? '<link rel="stylesheet" href="/styles.css" />' : ''}
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/index.${
      template === 'vanilla-ts' ? 'ts' : 'js'
    }"></script>
  </body>
</html>`;
      sandpackFiles['/index.html'] = { code: html };
    }

    const entryPath = template === 'vanilla-ts' ? '/index.ts' : '/index.js';
    if (!sandpackFiles[entryPath]) {
      const primaryScript = scriptFiles[0];
      const importPath = primaryScript
        ? `./${primaryScript.path.replace(/^\//, '')}`
        : '';
      const entryCode = importPath
        ? `import '${importPath}';\n`
        : '// Entry point for Sandpack\n';
      sandpackFiles[entryPath] = { code: entryCode };
    }

    if (hasCss && !sandpackFiles['/styles.css']) {
      const cssFile = files.find((f) => f.path.endsWith('.css'));
      if (cssFile) {
        sandpackFiles['/styles.css'] = { code: cssFile.content };
      }
    }
  }

  return {
    files: sandpackFiles,
    template,
    dependencies:
      Object.keys(dependencies).length > 0 ? dependencies : undefined,
  };
}

/**
 * Convert single file to Sandpack format
 */
export function singleFileToSandpack(
  code: string,
  language: string
): SandpackConfig {
  const isTypeScript = ['tsx', 'typescript', 'ts'].includes(
    language.toLowerCase()
  );
  const template: SandpackConfig['template'] = isTypeScript
    ? 'react-ts'
    : 'react';
  const entryPath = isTypeScript ? '/App.tsx' : '/App.jsx';

  return {
    files: {
      [entryPath]: { code },
    },
    template,
  };
}
