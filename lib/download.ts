/**
 * Utility functions for downloading generated components
 */

/**
 * Download component code as a file
 */
export function downloadComponent(code: string, filename?: string): void {
  // Generate filename with timestamp if not provided
  const defaultFilename = `Component-${new Date().toISOString().slice(0, 10)}-${Date.now()}.tsx`;
  const finalFilename = filename || defaultFilename;

  // Create blob with the code
  const blob = new Blob([code], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);

  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy component code to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Download component with dependencies as a ZIP
 * (Future enhancement - requires JSZip library)
 */
export function downloadComponentWithDeps(
  code: string,
  _dependencies?: Record<string, string>
): void {
  // TODO: Implement when JSZip is added
  // For now, just download the component file
  downloadComponent(code);
  console.warn('Full package download not yet implemented. Downloaded component only.');
}

/**
 * Extract component name from code
 */
export function extractComponentName(code: string): string | null {
  // Try to extract from: export default function ComponentName
  const defaultExportMatch = code.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultExportMatch) {
    return defaultExportMatch[1];
  }

  // Try to extract from: export function ComponentName
  const namedExportMatch = code.match(/export\s+function\s+(\w+)/);
  if (namedExportMatch) {
    return namedExportMatch[1];
  }

  // Try to extract from: const ComponentName = () =>
  const constArrowMatch = code.match(/(?:export\s+)?const\s+(\w+)\s*=\s*\(/);
  if (constArrowMatch) {
    return constArrowMatch[1];
  }

  return null;
}

/**
 * Generate a smart filename based on component code
 */
export function generateFilename(code: string): string {
  const componentName = extractComponentName(code);
  const timestamp = new Date().toISOString().slice(0, 10);

  if (componentName) {
    return `${componentName}.tsx`;
  }

  return `Component-${timestamp}.tsx`;
}
