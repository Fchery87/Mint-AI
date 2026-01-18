/**
 * Security utilities for API key masking and safe error handling
 */

/**
 * API key environment variable patterns to mask
 */
const API_KEY_PATTERNS = [
  /OPENROUTER_API_KEY/i,
  /ZAI_API_KEY/i,
  /OPENAI_API_KEY/i,
  /CUSTOM_API_KEY/i,
  /EXA_API_KEY/i,
  /SENTRY_DSN/i,
  /DATABASE_URL/i,
  /AUTH_SECRET/i,
  /NEXTAUTH_SECRET/i,
  /SESSION_SECRET/i,
  /ENCRYPTION_KEY/i,
  /AWS_ACCESS_KEY/i,
  /AWS_SECRET_KEY/i,
  /_API_KEY$/i,
  /_SECRET$/i,
  /_TOKEN$/i,
  /_PASSWORD$/i,
];

/**
 * Common API key formats to detect and mask
 */
const API_KEY_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI-style keys
  /sk-proj-[a-zA-Z0-9_-]{20,}/g,
  /qk-[a-zA-Z0-9]{20,}/g,
  /xoxb-[0-9]{10,}-[0-9]{10,}/g, // Slack bot tokens
  /gh[pousr]_[a-zA-Z0-9]{36}/g, // GitHub tokens
  /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, // JWT tokens
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi, // Generic Bearer tokens
  /Basic\s+[a-zA-Z0-9+\/=]+/gi, // Basic auth
];

/**
 * Mask an API key value, showing only first 4 and last 4 characters
 */
function maskKeyValue(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.substring(0, 4)}${'*'.repeat(8)}${key.substring(key.length - 4)}`;
}

/**
 * Mask all API keys in an object (recursively)
 */
export function maskApiKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    let masked = obj;

    // Mask API key value patterns
    for (const pattern of API_KEY_VALUE_PATTERNS) {
      masked = masked.replace(pattern, (match) => maskKeyValue(match));
    }

    return masked;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    const typedObj = obj as Record<string, unknown>;

    for (const [key, value] of Object.entries(typedObj)) {
      // Check if this key should be masked
      const shouldMask = API_KEY_PATTERNS.some((pattern) => pattern.test(key));

      if (shouldMask && typeof value === 'string') {
        // Mask the value
        result[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) => maskApiKeys(item));
      } else if (typeof value === 'object') {
        result[key] = maskApiKeys(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return obj;
}

/**
 * Safely extract error message without exposing sensitive data
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;

    // Mask any API key patterns in the message
    for (const pattern of API_KEY_VALUE_PATTERNS) {
      message = message.replace(pattern, (match) => maskKeyValue(match));
    }

    return message;
  }

  return 'An unexpected error occurred';
}

/**
 * Sanitize error object for logging/sending to Sentry
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const sanitized: Record<string, unknown> = {
      message: getSafeErrorMessage(error),
      name: error.name,
    };

    // Add stack trace without exposing sensitive paths
    if (error.stack) {
      // Remove any sensitive information from stack trace
      sanitized.stack = error.stack
        .split('\n')
        .map((line) => {
          // Remove file paths that might contain secrets
          return line.replace(/\/[^\/]*\.env[^\/]*/gi, '[REDACTED_PATH]');
        })
        .join('\n');
    }

    // Mask any API keys in the error object
    sanitized.extra = maskApiKeys(error);

    return sanitized;
  }

  return {
    message: String(error),
    type: typeof error,
  };
}

/**
 * Safe console.error that masks API keys
 */
export function safeConsoleError(context: string, error: unknown): void {
  const sanitized = sanitizeErrorForLogging(error);
  console.error(`[${context}]`, JSON.stringify(sanitized, null, 2));
}
