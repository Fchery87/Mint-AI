# Better Auth Implementation Guide

## Overview

This document explains the Better Auth implementation for Mint AI, including setup, usage, and next steps.

## What Was Implemented

### 1. Core Auth Files

- **`lib/auth/config.ts`** - Better Auth configuration with Convex adapter
- **`lib/auth/index.ts`** - Re-exports for easy importing
- **`lib/convex-auth.ts`** - Authentication utilities for Convex queries/mutations

### 2. Database Schema

Updated `convex/schema.ts` with:
- `users` table - User accounts
- `sessions` table - Active sessions
- `accounts` table - OAuth provider links (for Phase 2)
- `verifications` table - Email verification tokens (for Phase 2)
- `workspaces` table - Added `ownerId` field
- `workspaceMembers` table - For future collaboration features

### 3. API Routes

- **`app/api/auth/[...all]/route.ts`** - Catch-all auth handler for Better Auth

### 4. Middleware

- **`middleware.ts`** - Protects `/app/*` and `/api/chat/*` routes

### 5. Convex Functions

Updated `convex/workspaces.ts` with:
- `create()` - Requires authentication, creates workspace owned by user
- `get()` - Requires workspace access (owner or member)
- `listFiles()` - Requires workspace access
- `upsertFile()` - Requires workspace ownership
- `saveMessage()` - Requires workspace access
- `getMessages()` - Requires workspace access
- `listUserWorkspaces()` - Lists all workspaces for authenticated user

### 6. UI Components

- **`components/auth/LoginForm.tsx`** - Email/password login form
- **`components/auth/SignupForm.tsx`** - User registration form
- **`app/login/page.tsx`** - Login page
- **`app/signup/page.tsx`** - Signup page

## Environment Setup

### 1. Generate Secret Key

```bash
openssl rand -base64 32
```

### 2. Add to `.env.local`

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=<your-generated-secret>
BETTER_AUTH_URL=http://localhost:3000
```

See `.env.local.auth` for the full template including Phase 2 variables.

## Usage

### In Client Components

```typescript
"use client";

import { signIn, signOut, getSession } from "@/lib/auth";

export function MyComponent() {
  const handleLogin = async () => {
    const result = await signIn.email({
      email: "user@example.com",
      password: "password",
    });
    
    if (result.error) {
      console.error("Login failed:", result.error);
    } else {
      console.log("Logged in successfully");
    }
  };
  
  const handleLogout = async () => {
    await signOut();
  };
  
  return (
    <button onClick={handleLogin}>Login</button>
  );
}
```

### In Server Components

```typescript
import { getSession } from "@/lib/auth";

export default async function ServerPage() {
  const session = await getSession();
  
  if (!session) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### In Convex Functions

```typescript
import { requireAuth, requireWorkspaceOwnership, hasWorkspaceAccess } from "@/lib/convex-auth";

export const myMutation = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    // Require user to be authenticated
    const userId = await requireAuth(ctx);
    
    // Require user to own the workspace
    await requireWorkspaceOwnership(ctx, args.workspaceId);
    
    // ... proceed with mutation
  },
});
```

## Deployment Checklist

Before deploying to production:

- [ ] Generate and set `BETTER_AUTH_SECRET` in production environment
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Deploy Convex schema changes
- [ ] Test login/logout flow
- [ ] Test workspace authorization
- [ ] Verify middleware protection
- [ ] Check session cookie behavior (secure cookies in production)
- [ ] Set up error monitoring (Sentry)

## Migration Plan

### For Existing Data

The current implementation requires authentication. Existing workspaces without an `ownerId` will need migration.

#### Option 1: Create Anonymous Users (Recommended)

```typescript
// convex/migrations/addAuth.ts
import { mutation } from "./_generated/server";

export default mutation({
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    
    for (const workspace of workspaces) {
      // Create anonymous user for existing workspace
      const userId = await ctx.db.insert("users", {
        email: `anon-${workspace._id}@legacy.mintai.local`,
        name: "Legacy User",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Update workspace with owner
      await ctx.db.patch(workspace._id, {
        ownerId: userId,
      });
      
      // Add as member
      await ctx.db.insert("workspaceMembers", {
        workspaceId: workspace._id,
        userId,
        role: "owner",
        addedAt: Date.now(),
        addedBy: userId,
      });
    }
  },
});
```

#### Option 2: Feature Flag - Optional Auth

Modify middleware to make auth optional initially:

```typescript
// middleware.ts
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";

export default authMiddleware((req) => {
  if (!REQUIRE_AUTH) {
    return NextResponse.next();
  }
  // ... existing auth checks
});
```

## Next Steps

### Phase 2: OAuth & Email (Future)

- Add GitHub OAuth
- Add Google OAuth
- Implement email verification
- Add password reset flow
- Add email notifications

### Phase 3: Collaboration (Future)

- Implement workspace sharing
- Add role-based permissions (viewer, editor, owner)
- Create team workspaces
- Add activity feed

## Troubleshooting

### "Unauthorized" Errors

If you see "Unauthorized" errors in Convex functions:

1. Check that middleware is passing cookies
2. Verify session token in database
3. Check session expiration
4. Ensure `BETTER_AUTH_SECRET` is set

### Schema Deployment Errors

If Convex deployment fails:

1. Ensure Better Auth is installed
2. Check that schema syntax is correct
3. Verify no conflicts with existing data
4. Use `convex dev` to test locally first

### Middleware Not Working

If protected routes are accessible without auth:

1. Check `matcher` configuration in `middleware.ts`
2. Verify Next.js version (requires Next.js 13+)
3. Check for conflicts with other middleware
4. Test with incognito mode to rule out cookie issues

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
