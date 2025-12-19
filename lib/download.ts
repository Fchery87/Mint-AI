/**
 * Utility functions for downloading generated components
 */

import { getExtensionForLanguage, getDefaultFilename } from './preview-support';

type DownloadLanguage = string; // Any language

function languageToExtension(language?: string): string {
  return getExtensionForLanguage(language || 'tsx');
}

function languageToMimeType(language?: string): string {
  switch ((language || '').toLowerCase()) {
    case 'html':
      return 'text/html;charset=utf-8';
    case 'css':
      return 'text/css;charset=utf-8';
    case 'javascript':
      return 'text/javascript;charset=utf-8';
    case 'typescript':
    case 'tsx':
      return 'text/typescript;charset=utf-8';
    default:
      return 'text/plain;charset=utf-8';
  }
}

/**
 * Download component code as a file
 */
export function downloadComponent(
  code: string,
  filename?: string,
  language: DownloadLanguage | string = 'tsx'
): void {
  const extension = languageToExtension(language);

  // Generate filename with timestamp if not provided
  const defaultFilename = `Component-${new Date()
    .toISOString()
    .slice(0, 10)}-${Date.now()}.${extension}`;
  let finalFilename = filename || defaultFilename;
  if (!finalFilename.includes('.'))
    finalFilename = `${finalFilename}.${extension}`;

  // Create blob with the code
  const blob = new Blob([code], { type: languageToMimeType(language) });
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
 * Download a project as a ZIP file
 */
export async function downloadProjectAsZip(
  files: Array<{ path: string; content: string }>,
  projectName: string = 'project'
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add each file to the ZIP
  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Generate the ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);

  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download component with dependencies as a ZIP (legacy - use downloadProjectAsZip)
 */
export function downloadComponentWithDeps(
  code: string,
  _dependencies?: Record<string, string>
): void {
  // For backward compatibility, just download the component file
  downloadComponent(code);
  console.warn(
    'Full package download not yet implemented. Downloaded component only.'
  );
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
export function generateFilename(
  code: string,
  language: DownloadLanguage | string = 'tsx'
): string {
  const componentName = extractComponentName(code);
  const extension = languageToExtension(language);

  // If we can extract a component name, use it
  if (
    componentName &&
    ['tsx', 'ts', 'jsx', 'js', 'vue', 'svelte'].includes(extension)
  ) {
    return `${componentName}.${extension}`;
  }

  // Otherwise use smart defaults from preview-support
  return getDefaultFilename(language);
}
