import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ===== Better Auth Tables =====
  
  /**
   * Users table - stores user account information
   * Managed by Better Auth but integrated with Convex schema
   */
  users: defineTable({
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_email', ['email']),

  /**
   * Sessions table - stores active user sessions
   * Maps session tokens to user IDs for authentication
   */
  sessions: defineTable({
    userId: v.id('users'),
    expiresAt: v.number(),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index('by_token', ['token']),

  /**
   * Accounts table - stores OAuth provider account links
   * Used for Phase 2 when we add GitHub/Google OAuth
   */
  accounts: defineTable({
    userId: v.id('users'),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  /**
   * Verifications table - stores email verification tokens
   * Used for Phase 2 when we add email verification
   */
  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
  }),

  // ===== Mint AI Application Tables =====

  /**
   * Workspaces table - stores AI-generated project workspaces
   * Now includes ownerId for authentication and authorization
   */
  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id('users'), // NEW: Link to user who owns this workspace
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.string(), // e.g., "active", "archived"
    metadata: v.optional(v.any()),
  }).index('by_owner', ['ownerId']),

  /**
   * Files table - stores files within a workspace
   * Linked to workspaces for authorization checks
   */
  files: defineTable({
    workspaceId: v.id('workspaces'),
    path: v.string(),
    content: v.string(),
    language: v.string(),
    updatedAt: v.number(),
  }).index('by_workspace_path', ['workspaceId', 'path']),

  /**
   * Messages table - stores chat messages within a workspace
   * Linked to workspaces for authorization checks
   */
  messages: defineTable({
    workspaceId: v.id('workspaces'),
    role: v.string(), // "user" | "assistant" | "system"
    content: v.string(),
    reasoning: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_workspace', ['workspaceId']),

  /**
   * Workspace Members table - stores workspace collaborators
   * For Phase 3 when we add workspace sharing/collaboration
   * Currently unused but prepared for future RBAC implementation
   */
  workspaceMembers: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    role: v.string(), // "owner", "editor", "viewer"
    addedAt: v.number(),
    addedBy: v.id('users'),
  }).index('by_workspace', ['workspaceId'])
    .index('by_user', ['userId']),
});
