/**
 * XSS Sanitization Utility
 * 
 * Provides lightweight HTML entity escaping to prevent XSS attacks.
 * Use before displaying user-generated content or markdown.
 * 
 * Security considerations:
 * - Escapes all HTML special characters to their entity equivalents
 * - Handles edge cases like null/undefined/empty inputs
 * - No external dependencies (lightweight)
 * - Uses allowlist approach for maximum security
 */

/**
 * HTML entity map for XSS prevention
 * Maps dangerous characters to their HTML entity equivalents
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
} as const;

/**
 * Regular expression matching all characters that need escaping
 * Uses a character class for efficient matching
 */
const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Escape HTML entities to prevent XSS attacks
 * 
 * Converts dangerous HTML characters to their safe entity equivalents.
 * This prevents script injection and other XSS vectors.
 * 
 * @param input - The string to sanitize (can be any type, coerced to string)
 * @returns Sanitized string with HTML entities escaped, or empty string for null/undefined
 * 
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * 
 * escapeHtml('Hello <b>World</b>')
 * // Returns: 'Hello &lt;b&gt;World&lt;/b&gt;'
 * ```
 */
export function escapeHtml(input: unknown): string {
  // Handle null/undefined - return empty string
  if (input === null || input === undefined) {
    return '';
  }

  // Convert to string
  const str = String(input);

  // Fast path: empty string
  if (str.length === 0) {
    return '';
  }

  // Fast path: no dangerous characters found
  if (!HTML_ESCAPE_REGEX.test(str)) {
    return str;
  }

  // Replace dangerous characters with their entity equivalents
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Sanitize chat message content for safe display
 * 
 * This is the primary function for sanitizing chat messages before rendering.
 * It escapes HTML entities to prevent XSS while preserving the message structure.
 * 
 * Use this before passing content to markdown renderers or displaying in the UI.
 * 
 * @param content - The chat message content to sanitize
 * @returns Sanitized content safe for display
 * 
 * @example
 * ```typescript
 * // In a React component
 * const sanitizedContent = sanitizeChatMessage(userMessage);
 * return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(sanitizedContent) }} />;
 * ```
 */
export function sanitizeChatMessage(content: string): string {
  return escapeHtml(content);
}

/**
 * Sanitize content for use in HTML attributes
 * 
 * More restrictive than escapeHtml - also escapes spaces and newlines
 * for safe use in HTML attributes like title, alt, data-* etc.
 * 
 * @param input - The string to sanitize for attribute use
 * @returns Sanitized string safe for HTML attributes
 * 
 * @example
 * ```typescript
 * const title = sanitizeAttribute(userInput);
 * return `<div title="${title}">Content</div>`;
 * ```
 */
export function sanitizeAttribute(input: string): string {
  if (!input) {
    return '';
  }

  return escapeHtml(input)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if a string contains potentially dangerous HTML
 * 
 * Useful for validation before deciding whether to sanitize or reject input.
 * 
 * @param input - The string to check
 * @returns True if the string contains HTML-like content
 * 
 * @example
 * ```typescript
 * if (containsHtml(userInput)) {
 *   console.warn('User input contains HTML, sanitizing...');
 * }
 * ```
 */
export function containsHtml(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Check for common HTML patterns
  const htmlPattern = /<[^>]+>|&[a-zA-Z#][a-zA-Z0-9]*;/;
  return htmlPattern.test(input);
}

/**
 * Strip all HTML tags from a string (aggressive sanitization)
 * 
 * Removes all HTML tags entirely, leaving only text content.
 * Use when you need plain text only, no HTML rendering at all.
 * 
 * @param input - The string to strip tags from
 * @returns Plain text with all HTML tags removed
 * 
 * @example
 * ```typescript
 * stripHtmlTags('<p>Hello <b>World</b></p>')
 * // Returns: 'Hello World'
 * ```
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Create a sanitized template literal function
 * 
 * Usage: sanitized`Hello ${userInput}`
 * Automatically escapes all interpolated values.
 * 
 * @param strings - Template literal strings
 * @param values - Interpolated values to escape
 * @returns Sanitized string
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const result = sanitized`User said: ${userInput}`;
 * // Returns: 'User said: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitized(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, string, i) => {
    const value = values[i];
    return result + string + (value !== undefined ? escapeHtml(value) : '');
  }, '');
}
