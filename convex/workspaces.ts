import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Create a new workspace
 */
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('workspaces', {
      name: args.name,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get a workspace by ID
 */
export const get = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

/**
 * List all files in a workspace
 */
export const listFiles = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
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
 */
export const upsertFile = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    path: v.string(),
    content: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
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
 */
export const saveMessage = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    role: v.string(),
    content: v.string(),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
 */
export const getMessages = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .order('asc')
      .collect();
  },
});
