/**
 * Pyodide execution wrapper for Python code
 */

import type { PyodideInterface } from 'pyodide';

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;

export interface PythonExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

/**
 * Load Pyodide (lazy loading, ~6MB)
 */
export async function loadPyodide(): Promise<PyodideInterface> {
  // Return existing instance if already loaded
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing loading promise if currently loading
  if (pyodideLoading) {
    return pyodideLoading;
  }

  // Start loading
  pyodideLoading = (async () => {
    const { loadPyodide: load } = await import('pyodide');
    const pyodide = await load({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/',
    });

    pyodideInstance = pyodide;
    pyodideLoading = null;
    return pyodide;
  })();

  return pyodideLoading;
}

/**
 * Execute Python code with Pyodide
 */
export async function executePython(
  code: string,
  timeout: number = 30000
): Promise<PythonExecutionResult> {
  const startTime = performance.now();

  try {
    // Load Pyodide if not already loaded
    const pyodide = await loadPyodide();

    // Capture stdout/stderr
    let output = '';

    // Redirect stdout to capture print statements
    await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
    `);

    // Execute user code with timeout
    const executionPromise = pyodide.runPythonAsync(code);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout (30s)')), timeout)
    );

    const result = await Promise.race([executionPromise, timeoutPromise]);

    // Get captured output
    const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
    const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

    output = stdout || '';
    if (stderr) {
      output += `\n${stderr}`;
    }

    // Add result if it's not None
    if (result !== undefined && result !== null) {
      output += output ? `\n${result}` : String(result);
    }

    const executionTime = performance.now() - startTime;

    return {
      output: output || '(no output)',
      executionTime,
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;

    return {
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    };
  }
}

/**
 * Install Python packages
 */
export async function installPackage(packageName: string): Promise<void> {
  const pyodide = await loadPyodide();
  await pyodide.loadPackage(packageName);
}

/**
 * Check if Pyodide is loaded
 */
export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null;
}

/**
 * Get Pyodide loading status
 */
export function getPyodideStatus(): 'not-loaded' | 'loading' | 'loaded' {
  if (pyodideInstance) return 'loaded';
  if (pyodideLoading) return 'loading';
  return 'not-loaded';
}
