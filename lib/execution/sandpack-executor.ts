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
