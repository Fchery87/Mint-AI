/**
 * Path Validation Utility
 *
 * Provides secure path validation to prevent directory traversal attacks
 * and other path-based security vulnerabilities.
 */

/**
 * Result of path validation
 */
export interface PathValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dangerous patterns that indicate directory traversal attempts
 */
const DANGEROUS_PATTERNS = [
  /\.\./, // Parent directory references
  /^\//, // Absolute paths (Unix)
  /^[a-zA-Z]:/, // Absolute paths (Windows)
  /%2e%2e/i, // URL-encoded ..
  /%2f/i, // URL-encoded /
  /\\/, // Backslash (Windows-style)
  /\0/, // Null bytes
  /^\.+$/, // Only dots
];

/**
 * Validate a file path for security issues
 *
 * Checks for:
 * - Directory traversal attempts (../)
 * - Absolute paths
 * - Null bytes
 * - Empty paths
 * - URL-encoded traversal attempts
 *
 * @param path - The file path to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * validatePath('src/components/Button.tsx')
 * // Returns: { valid: true }
 *
 * validatePath('../../../etc/passwd')
 * // Returns: { valid: false, error: 'Path contains directory traversal attempt' }
 * ```
 */
export function validatePath(path: string): PathValidationResult {
  // Check for empty path
  if (!path || path.trim().length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check for null bytes
  if (path.includes('\0')) {
    return { valid: false, error: 'Path contains null bytes' };
  }

  // Check for directory traversal
  if (path.includes('..')) {
    return { valid: false, error: 'Path contains directory traversal attempt' };
  }

  // Check for absolute paths
  if (path.startsWith('/')) {
    return { valid: false, error: 'Absolute paths are not allowed' };
  }

  // Check for Windows absolute paths
  if (/^[a-zA-Z]:/.test(path)) {
    return { valid: false, error: 'Absolute paths are not allowed' };
  }

  // Check for backslash directory separators (Windows-style)
  if (path.includes('\\')) {
    return { valid: false, error: 'Backslash path separators are not allowed' };
  }

  // Check for URL-encoded traversal attempts
  if (/%2e%2e/i.test(path)) {
    return { valid: false, error: 'Path contains encoded directory traversal attempt' };
  }

  // Check for other dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(path)) {
      return { valid: false, error: 'Path contains invalid characters' };
    }
  }

  // Check for paths that are only dots
  if (/^[.]+$/.test(path)) {
    return { valid: false, error: 'Invalid path format' };
  }

  return { valid: true };
}

/**
 * Validate multiple paths at once
 *
 * @param paths - Array of paths to validate
 * @returns First validation error found, or success if all valid
 */
export function validatePaths(paths: string[]): PathValidationResult {
  for (const path of paths) {
    const result = validatePath(path);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}

/**
 * Sanitize a path by removing dangerous components
 *
 * WARNING: This is a last resort. Prefer to reject invalid paths
 * rather than attempting to sanitize them.
 *
 * @param path - The path to sanitize
 * @returns Sanitized path or null if cannot be sanitized
 */
export function sanitizePath(path: string): string | null {
  if (!path) return null;

  // Remove null bytes
  let sanitized = path.replace(/\0/g, '');

  // Normalize slashes
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove parent directory references
  sanitized = sanitized.replace(/\.\.\/|\/\.\.\/|^\.\.\//g, '');

  // Remove leading slashes (absolute path)
  sanitized = sanitized.replace(/^\/+/, '');

  // Remove Windows drive letters
  sanitized = sanitized.replace(/^[a-zA-Z]:/, '');

  // Remove leading dots
  sanitized = sanitized.replace(/^\.+/, '');

  // Remove URL-encoded traversal
  sanitized = sanitized.replace(/%2e%2e/gi, '');

  // Clean up multiple slashes
  sanitized = sanitized.replace(/\/+/g, '/');

  // Final validation
  const validation = validatePath(sanitized);
  if (!validation.valid) {
    return null;
  }

  return sanitized || null;
}

/**
 * Check if a path is within a allowed base directory
 *
 * @param path - The path to check
 * @param baseDir - The base directory that must contain the path
 * @returns True if path is within base directory
 */
export function isPathWithinBase(path: string, baseDir: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const normalizedBase = baseDir.replace(/\\/g, '/').replace(/^\/+/, '');

  // Ensure base directory ends with slash for proper prefix check
  const baseWithSlash = normalizedBase.endsWith('/')
    ? normalizedBase
    : normalizedBase + '/';

  // Path must either equal base or start with base/
  return normalizedPath === normalizedBase
    || normalizedPath.startsWith(baseWithSlash);
}

/**
 * Get a safe error message for invalid paths
 *
 * @param path - The invalid path (will be truncated in message)
 * @param result - The validation result
 * @returns Safe error message for display
 */
export function getPathValidationErrorMessage(
  path: string,
  result: PathValidationResult
): string {
  if (result.valid) {
    return '';
  }

  // Truncate path for security (don't expose full path in error messages)
  const displayPath = path.length > 50
    ? path.substring(0, 50) + '...'
    : path;

  return `Invalid path "${displayPath}": ${result.error}`;
}
