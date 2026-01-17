import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.string(), // e.g., "active", "archived"
    metadata: v.optional(v.any()),
  }),

  files: defineTable({
    workspaceId: v.id('workspaces'),
    path: v.string(),
    content: v.string(),
    language: v.string(),
    updatedAt: v.number(),
  }).index('by_workspace_path', ['workspaceId', 'path']),

  messages: defineTable({
    workspaceId: v.id('workspaces'),
    role: v.string(), // "user" | "assistant" | "system"
    content: v.string(),
    reasoning: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_workspace', ['workspaceId']),
});
