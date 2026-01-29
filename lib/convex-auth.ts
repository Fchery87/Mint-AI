/**
 * Convex Authentication Utilities
 *
 * This file provides helper functions to integrate Better Auth with Convex
 * for authentication and authorization in Convex queries and mutations.
 */

import { QueryCtx, MutationCtx } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

/**
 * Get the authenticated user ID from the request context
 * 
 * This function extracts the user ID from Better Auth session cookies
 * and validates it against the session in the database.
 * 
 * @param ctx - The Convex query or mutation context
 * @returns The user ID if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * export const myQuery = query({
 *   args: {},
 *   handler: async (ctx) => {
 *     const userId = await getAuthenticatedUserId(ctx);
 *     if (!userId) {
 *       throw new Error("Unauthorized");
 *     }
 *     // ... proceed with authenticated user
 *   }
 * });
 * ```
 */
export async function getAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  // Get the request object from the context
  // @ts-ignore - Convex QueryCtx/MutationCtx don't expose request directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request = (ctx as any).request;
  
  if (!request) {
    return null;
  }

  // Extract session token from cookies
  const cookies = request.headers.get("cookie");
  if (!cookies) {
    return null;
  }

  // Better Auth uses a cookie named "mint-auth-session-token" (based on our config)
  const sessionCookieMatch = cookies.match(/mint-auth-session-token=([^;]+)/);
  if (!sessionCookieMatch) {
    return null;
  }

  const sessionToken = sessionCookieMatch[1];

  // Look up the session in the database
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .unique();

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    // Session expired, clean it up
    // @ts-ignore - delete only exists on DatabaseWriter (MutationCtx), not DatabaseReader (QueryCtx)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.db as any).delete(session._id);
    return null;
  }

  // Return the user ID from the session
  return session.userId;
}

/**
 * Require authentication - throws an error if user is not authenticated
 * 
 * This is a convenience wrapper around getAuthenticatedUserId that throws
 * an error instead of returning null for unauthenticated users.
 * 
 * @param ctx - The Convex query or mutation context
 * @returns The authenticated user ID
 * @throws Error if user is not authenticated
 * 
 * @example
 * ```typescript
 * export const myMutation = mutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     const userId = await requireAuth(ctx);
 *     // ... proceed with authenticated user
 *   }
 * });
 * ```
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getAuthenticatedUserId(ctx);
  
  if (!userId) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  
  return userId;
}

/**
 * Check if a user owns a workspace
 * 
 * This function verifies that the authenticated user is the owner
 * of the specified workspace. Throws an error if not.
 * 
 * @param ctx - The Convex query or mutation context
 * @param workspaceId - The workspace ID to check ownership of
 * @throws Error if user is not authenticated or not the workspace owner
 * 
 * @example
 * ```typescript
 * export const updateWorkspace = mutation({
 *   args: { workspaceId: v.id("workspaces"), name: v.string() },
 *   handler: async (ctx, args) => {
 *     await requireWorkspaceOwnership(ctx, args.workspaceId);
 *     // ... proceed with update
 *   }
 * });
 * ```
 */
export async function requireWorkspaceOwnership(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
): Promise<void> {
  // Get authenticated user
  const userId = await requireAuth(ctx);

  // Get the workspace
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check ownership
  if (workspace.ownerId !== userId) {
    throw new Error(
      "Forbidden: You don't have permission to access this workspace"
    );
  }
}

/**
 * Check if a user has access to a workspace (owner or member)
 * 
 * This function checks both ownership and membership in the workspaceMembers
 * table. Use this for read operations that should be accessible to collaborators.
 * 
 * @param ctx - The Convex query or mutation context
 * @param workspaceId - The workspace ID to check access for
 * @returns True if user has access, false otherwise
 * 
 * @example
 * ```typescript
 * export const getWorkspace = query({
 *   args: { workspaceId: v.id("workspaces") },
 *   handler: async (ctx, args) => {
 *     if (!(await hasWorkspaceAccess(ctx, args.workspaceId))) {
 *       throw new Error("Forbidden");
 *     }
 *     // ... proceed with read operation
 *   }
 * });
 * ```
 */
export async function hasWorkspaceAccess(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
): Promise<boolean> {
  // Get authenticated user
  const userId = await getAuthenticatedUserId(ctx);
  if (!userId) {
    return false;
  }

  // Get the workspace
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    return false;
  }

  // Check if user is the owner
  if (workspace.ownerId === userId) {
    return true;
  }

  // Check if user is a member (for Phase 3 collaboration features)
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace", (q) => {
      // @ts-ignore - Index by_workspace only supports workspaceId; needs compound index for userId
      return q.eq("workspaceId", workspaceId).eq("userId", userId);
    })
    .first();

  return !!membership;
}

/**
 * Get user information from the database
 * 
 * @param ctx - The Convex query or mutation context
 * @param userId - The user ID to look up
 * @returns The user document or null if not found
 */
export async function getUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  return await ctx.db.get(userId);
}
