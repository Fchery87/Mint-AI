import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, requireWorkspaceOwnership, hasWorkspaceAccess } from '../lib/convex-auth';

/**
 * Create a new workspace
 * Requires authentication - workspace is owned by the authenticated user
 */
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await requireAuth(ctx);
    
    const now = Date.now();
    const workspaceId = await ctx.db.insert('workspaces', {
      name: args.name,
      ownerId: userId, // Link workspace to authenticated user
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    
    // Add the owner as a workspace member (for future collaboration features)
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId,
      role: 'owner',
      addedAt: now,
      addedBy: userId,
    });
    
    return workspaceId;
  },
});

/**
 * Get a workspace by ID
 * Requires authentication and workspace access (owner or member)
 */
export const get = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    // Check if user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(ctx, args.workspaceId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }
    
    return await ctx.db.get(args.workspaceId);
  },
});

/**
 * List all files in a workspace
 * Requires authentication and workspace access
 */
export const listFiles = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    // Check if user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(ctx, args.workspaceId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }
    
    return await ctx.db
      .query('files')
      .withIndex('by_workspace_path', (q) =>
        q.eq('workspaceId', args.workspaceId)
      )
      .collect();
  },
});

/**
 * Create or update a file in a workspace
 * Requires authentication and workspace ownership
 */
export const upsertFile = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    path: v.string(),
    content: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Require workspace ownership to modify files
    await requireWorkspaceOwnership(ctx, args.workspaceId);
    
    const existing = await ctx.db
      .query('files')
      .withIndex('by_workspace_path', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('path', args.path)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        language: args.language,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert('files', {
        workspaceId: args.workspaceId,
        path: args.path,
        content: args.content,
        language: args.language,
        updatedAt: now,
      });
    }
  },
});

/**
 * Save a message to the chat history
 * Requires authentication and workspace access
 */
export const saveMessage = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    role: v.string(),
    content: v.string(),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(ctx, args.workspaceId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }
    
    return await ctx.db.insert('messages', {
      workspaceId: args.workspaceId,
      role: args.role,
      content: args.content,
      reasoning: args.reasoning,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get chat history for a workspace
 * Requires authentication and workspace access
 */
export const getMessages = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    // Check if user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(ctx, args.workspaceId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this workspace');
    }
    
    return await ctx.db
      .query('messages')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .order('asc')
      .collect();
  },
});

/**
 * List all workspaces for the authenticated user
 * New query added to support user-specific workspace listing
 */
export const listUserWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const userId = await requireAuth(ctx);
    
    // Get workspaces owned by the user
    const ownedWorkspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect();
    
    // Get workspaces where user is a member (for future collaboration)
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    
    const memberWorkspaceIds = memberships
      .filter(m => m.userId !== ownedWorkspaces.find(w => w._id === m.workspaceId)?.ownerId)
      .map(m => m.workspaceId);
    
    const memberWorkspaces = await Promise.all(
      memberWorkspaceIds.map(id => ctx.db.get(id))
    );
    
    // Combine and deduplicate
    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces.filter(Boolean) as any[]];
    
    return allWorkspaces;
  },
});
