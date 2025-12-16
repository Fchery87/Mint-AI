/**
 * Environment variable validation
 * Ensures all required env vars are set before the app runs
 */

export function validateEnv() {
  const required = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  const missing: string[] = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\n` +
        `Please create a .env.local file with these variables.\n` +
        `See .env.local.example for reference.`
    );
  }

  return true;
}

/**
 * Get environment variable with validation
 * In build mode, allows empty values (will fail at runtime)
 */
export function getEnv(key: string): string {
  const value = process.env[key];

  // Allow empty in build mode
  if (!value && process.env.NODE_ENV !== "production" && process.env.NEXT_PHASE === "phase-production-build") {
    console.warn(`Warning: ${key} not set during build. Will be required at runtime.`);
    return "";
  }

  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Check if app is in production
 */
export const isProd = process.env.NODE_ENV === "production";

/**
 * Check if app is in development
 */
export const isDev = process.env.NODE_ENV === "development";
