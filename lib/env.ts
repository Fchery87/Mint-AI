/**
 * Environment variable validation
 * Ensures all required env vars are set before the app runs
 */

export function validateEnv() {
  // No mandatory environment variables at this phase.
  // Add required variables to this function as the project grows.

  return true;
}

/**
 * Get environment variable with validation
 * In build mode, allows empty values (will fail at runtime)
 */
export function getEnv(key: string): string {
  const value = process.env[key];

  // Allow empty in build mode
  if (
    !value &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    console.warn(
      `Warning: ${key} not set during build. Will be required at runtime.`
    );
    return '';
  }

  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Check if app is in production
 */
export const isProd = process.env.NODE_ENV === 'production';

/**
 * Check if app is in development
 */
export const isDev = process.env.NODE_ENV === 'development';
