/**
 * Retry utility with exponential backoff
 *
 * Wraps async operations with configurable retry logic and exponential backoff.
 * Useful for handling transient failures in network requests or external service calls.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Factor to multiply delay by after each retry (default: 2) */
  backoffFactor?: number;
  /** Optional callback called on each retry attempt with the error and attempt number */
  onRetry?: (error: Error, attempt: number) => void;
  /** Optional predicate to determine if an error is retryable (default: all errors are retryable) */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Delays execution for the specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates the delay for a given retry attempt using exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffFactor: number,
  maxDelayMs: number
): number {
  const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  return Math.min(exponentialDelay, maxDelayMs);
}

/**
 * Wraps an async function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute with retry logic
 * @param options - Configuration options for retry behavior
 * @returns A promise that resolves with the function's return value
 * @throws The last error encountered if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('/api/chat', { method: 'POST', body: JSON.stringify(data) }),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
    onRetry,
    isRetryable = () => true,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Check if the error is retryable
      if (!isRetryable(lastError)) {
        throw lastError;
      }

      // Calculate delay for this retry attempt
      const retryDelay = calculateDelay(
        attempt + 1,
        initialDelayMs,
        backoffFactor,
        maxDelayMs
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Wait before next attempt
      await delay(retryDelay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Creates a retryable version of a function with preset options
 *
 * @param fn - The async function to make retryable
 * @param defaultOptions - Default retry options for the function
 * @returns A retryable version of the function
 *
 * @example
 * ```typescript
 * const retryableFetch = createRetryable(
 *   (url: string, init?: RequestInit) => fetch(url, init),
 *   { maxRetries: 5, initialDelayMs: 500 }
 * );
 *
 * const response = await retryableFetch('/api/data');
 * ```
 */
export function createRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultOptions: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return withRetry(() => fn(...args), defaultOptions);
  };
}

/**
 * Helper to determine if an HTTP error status code is retryable
 *
 * @param status - HTTP status code
 * @returns true if the status code indicates a retryable error
 */
export function isRetryableHttpStatus(status: number): boolean {
  // Retry on server errors (5xx) and specific client errors
  const retryableStatuses = new Set([
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ]);
  return retryableStatuses.has(status);
}

/**
 * Helper to create an isRetryable predicate for fetch responses
 *
 * @returns A predicate function that checks if a fetch error is retryable
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('/api/data').then(r => {
 *     if (!r.ok) throw new Error(`HTTP ${r.status}`);
 *     return r.json();
 *   }),
 *   {
 *     maxRetries: 3,
 *     isRetryable: createFetchRetryPredicate()
 *   }
 * );
 * ```
 */
export function createFetchRetryPredicate(): (error: Error) => boolean {
  return (error: Error): boolean => {
    // Check for network errors (no response)
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ECONNRESET')
    ) {
      return true;
    }

    // Check for HTTP status errors
    const statusMatch = error.message.match(/HTTP\s+(\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return isRetryableHttpStatus(status);
    }

    return true; // Default to retryable for unknown errors
  };
}
