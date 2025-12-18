/**
 * Routes code to appropriate execution environment based on language
 *
 * Note: React/JavaScript uses the existing LivePreview (iframe) system
 * which works reliably without external dependencies. The Execute tab
 * is reserved for Python (Pyodide) which can run entirely in browser.
 */

export type ExecutorType = 'sandpack' | 'pyodide' | 'preview-only';

/**
 * Determine which executor to use for a given language
 *
 * Currently only Python uses the Execute tab (Pyodide).
 * React/JavaScript use LivePreview which is already reliable.
 */
export function getExecutor(language: string): ExecutorType {
  if (!language) return 'preview-only';

  const normalized = language.toLowerCase().trim().replace(/\s+/g, '-');

  // Pyodide: Python only
  // This is 100% browser-based with no external dependencies
  if (['python', 'py'].includes(normalized)) {
    return 'pyodide';
  }

  // All other languages use preview-only (LivePreview for React, iframe for HTML/Vue)
  // This avoids Sandpack's external bundler dependency which can timeout
  return 'preview-only';
}

/**
 * Check if a language supports code execution
 */
export function isExecutable(language: string): boolean {
  const executor = getExecutor(language);
  return executor !== 'preview-only';
}

/**
 * Get execution type for display purposes
 */
export function getExecutionLabel(executorType: ExecutorType): string {
  switch (executorType) {
    case 'sandpack':
      return 'Run in Browser';
    case 'pyodide':
      return 'Run Python';
    case 'preview-only':
      return 'Preview';
  }
}
