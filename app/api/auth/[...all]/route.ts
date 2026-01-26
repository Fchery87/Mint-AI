/**
 * Better Auth API Route Handler
 * 
 * This route handles all authentication API calls including:
 * - Sign up
 * - Sign in
 * - Sign out
 * - Session management
 * - Email/password operations
 * 
 * Better Auth uses this catch-all route for all auth operations.
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

/**
 * Export GET and POST handlers for all auth operations
 * Better Auth routes requests to the correct handler internally
 */
export const { GET, POST } = toNextJsHandler(auth);
