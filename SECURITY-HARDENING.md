# Security Hardening Architecture Specification

**Document Version:** 1.0.0  
**Created:** 2026-01-16  
**Status:** Draft  
**Priority Order:** 1-9 (as defined in security audit)

---

## 1. HTML Preview XSS Mitigation

### Problem
User-generated code is executed via `new Function()` and injected into `srcdoc` iframes without proper sanitization.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Code     │────▶│  DOMPurify       │────▶│  Sanitized      │
│   (untrusted)   │     │  + SRI Validation│     │  HTML           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ CDN Script       │     │ Sandboxed       │
                        │ SRI Hash Check   │     │ Iframe          │
                        └──────────────────┘     └─────────────────┘
```

### Components

#### 1.1 Sanitization Service (`lib/sanitize.ts`)
```typescript
import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowScripts?: boolean;
  allowSameOrigin?: boolean;
  addNosniff?: boolean;
}

export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  const config = {
    ALLOWED_TAGS: options.allowScripts 
      ? [...DOMPurify.defaultAllowedTags, 'script', 'style'] 
      : DOMPurify.defaultAllowedTags,
    ALLOWED_ATTR: options.allowScripts 
      ? [...DOMPurify.defaultAllowedAttr, 'onerror', 'onclick'] 
      : DOMPurify.defaultAllowedAttr,
    FORBID_TAGS: ['iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['srcset', 'data'],
  };
  
  return DOMPurify.sanitize(html, config);
}
```

#### 1.2 CDN Script Integrity Checker (`lib/cdn-integrity.ts`)
```typescript
import crypto from 'crypto';

const SRI_HASHES: Record<string, string> = {
  'https://unpkg.com/@babel/standalone/babel.min.js': 
    'sha384-7H4oNvJvZzGt/FXcRlNpMlq5Z3M6EkvGKwG9g0q3qT6H0s2k3gY2E7w==',
  'https://cdn.tailwindcss.com': 
    'sha384-+iuW4e5qZz8A5Y4vGXMk2u2Z8qY8k5c5j9l7k3gY2E7w==',
  // Add more as needed
};

export async function verifySri(url: string, content: string): Promise<boolean> {
  const expectedHash = SRI_HASHES[url];
  if (!expectedHash) {
    console.warn(`No SRI hash configured for ${url}`);
    return false;
  }
  
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return hash === expectedHash;
}
```

#### 1.3 Updated HtmlPreview Component
```typescript
// Replace new Function() execution with safer approach
// Use Babel standalone's programmatic API instead
```

### Files to Modify
- `components/HtmlPreview.tsx` - Replace unsafe code execution
- Create `lib/sanitize.ts` - Sanitization service
- Create `lib/cdn-integrity.ts` - SRI validation

---

## 2. Convex Authentication & Authorization

### Problem
Convex database tables have no access control - any user can access any workspace.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Convex API    │────▶│  Auth Middleware │────▶│  Workspace      │
│   Request       │     │  (server-side)   │     │  Validator      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ User Session     │
                        │ (auth context)   │
                        └──────────────────┘
```

### Components

#### 2.1 Session Context (`lib/auth/session.ts`)
```typescript
import { getAuthToken } from './token';
import { verifyToken } from './jwt';

export interface SessionUser {
  id: string;
  email?: string;
  workspaces: string[];
}

export async function getSession(): Promise<SessionUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('Authentication required');
  return session;
}
```

#### 2.2 Authorization Rules (`convex/auth.ts`)
```typescript
import { query, mutation } from './_generated/server';
import { getSession, requireSession } from '../lib/auth/session';

export const getWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const session = await requireSession();
    const workspace = await ctx.db.get(args.workspaceId);
    
    if (!workspace) return null;
    
    // Check ownership
    const isOwner = workspace.ownerId === session.id;
    const isCollaborator = workspace.collaborators?.includes(session.id);
    
    if (!isOwner && !isCollaborator) {
      throw new Error('Access denied');
    }
    
    return workspace;
  },
});

// Apply similar patterns to:
// - listFiles (restrict by workspace access)
// - upsertFile (validate workspace ownership)
// - saveMessage (validate workspace access)
// - getMessages (restrict to workspace members)
```

#### 2.3 Updated Schema (`convex/schema.ts`)
```typescript
export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    ownerId: v.string(),           // ADD: Owner user ID
    collaborators: v.optional(v.array(v.string())),  // ADD: Collaborator IDs
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.string(),
    metadata: v.optional(v.any()),
  }),

  // ... existing tables
});
```

### Files to Modify
- `convex/schema.ts` - Add owner/collaborator fields
- Create `lib/auth/session.ts` - Session management
- Create `lib/auth/token.ts` - Token handling
- Create `lib/auth/jwt.ts` - JWT verification
- `convex/workspaces.ts` - Add authorization to all queries/mutations

---

## 3. CORS Configuration Fix

### Problem
Default CORS allows all origins (`*`), creating security risk.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   HTTP Request  │────▶│  CORS Validator  │────▶│  Allowed Origin │
│                 │     │  (strict config) │     │  or Reject      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

#### 3.1 Strict CORS Configuration (`next.config.ts`)
```typescript
const config: NextConfig = {
  // ... existing config
  
  async headers() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'false', // Require explicit setting
          },
          // ... other headers
        ],
      },
    ];
  },
  
  async rewrites() {
    // Validate ALLOWED_ORIGINS is set in production
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
      throw new Error('ALLOWED_ORIGINS environment variable must be set in production');
    }
  },
};
```

### Files to Modify
- `next.config.ts` - Update CORS configuration
- `.env.local.example` - Add documentation about required ALLOWED_ORIGINS

---

## 4. Distributed Rate Limiting

### Problem
In-memory rate limiting is bypassable and doesn't scale.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Request   │────▶│  Rate Limiter    │────▶│  Redis/Upstash  │
│                 │     │  (Redis client)  │     │  (shared state) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ Sliding Window   │
                        │ Algorithm        │
                        └──────────────────┘
```

### Components

#### 4.1 Redis Rate Limiter (`lib/ratelimit/redis.ts`)
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Use Redis sorted set for sliding window
  const pipeline = redis.pipeline();
  
  // Remove old entries
  pipeline.zremrangebyscore(key, 0, windowStart);
  
  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  
  // Count requests in window
  pipeline.zcard(key);
  
  // Set expiry
  pipeline.expire(key, Math.ceil(windowMs / 1000));
  
  const results = await pipeline.exec();
  const count = results?.[2]?.[1] as number || 0;
  
  const resetAt = now + windowMs;
  const remaining = Math.max(0, limit - count);
  
  return {
    allowed: count < limit,
    remaining,
    resetAt,
  };
}
```

#### 4.2 Fallback In-Memory Limiter (`lib/ratelimit/memory.ts`)
```typescript
// For development/single-instance deployment
// Uses the existing Map-based implementation with cleanup
```

#### 4.3 Rate Limiter Factory (`lib/ratelimit/index.ts`)
```typescript
import { checkRateLimit as checkRedisRateLimit } from './redis';
import { checkRateLimit as checkMemoryRateLimit } from './memory';

// Use Redis if REDIS_URL is set, otherwise use memory
export const checkRateLimit = process.env.REDIS_URL 
  ? checkRedisRateLimit 
  : checkMemoryRateLimit;
```

### Dependencies to Add
```json
{
  "ioredis": "^5.4.1"
}
```

### Files to Create
- `lib/ratelimit/index.ts` - Factory
- `lib/ratelimit/redis.ts` - Redis implementation
- `lib/ratelimit/memory.ts` - Fallback implementation

### Files to Modify
- `app/api/chat/route.ts` - Use new rate limiter
- `.env.local.example` - Add REDIS_URL documentation

---

## 5. CSP Hardening

### Problem
`'unsafe-inline'` in CSP weakens XSS protection.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Script Tag    │────▶│  CSP Validator   │────▶│  Nonce-Based    │
│   in HTML       │     │  (nonce generator│     │  Script Policy  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

#### 5.1 Nonce Generator (`lib/csp/nonce.ts`)
```typescript
import crypto from 'crypto';

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function getCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openrouter.ai https://*.sentry.io https://cdn.jsdelivr.net https://unpkg.com wss://*.convex.cloud",
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
}
```

#### 5.2 Updated Middleware (`middleware.ts`)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce } from './lib/csp/nonce';

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  
  const response = NextResponse.next();
  
  // Add CSP header with nonce
  response.headers.set('Content-Security-Policy', getCspHeader(nonce));
  
  // Make nonce available to server components
  response.headers.set('x-nonce', nonce);
  
  return response;
}

export const config = {
  matcher: '/:path*',
};
```

### Strategy for Unsafe Inline

For inline styles in user code (e.g., React style props), use one of:
1. **Hash-based**: Hash inline styles and add to CSP (complex)
2. **Style object**: Convert inline styles to CSS classes
3. **Allow unsafe-inline for style only**: `style-src 'self' 'unsafe-inline'` (less ideal but acceptable for generated code)

### Files to Create
- `lib/csp/nonce.ts` - Nonce generation
- `middleware.ts` - CSP middleware

---

## 6. Request Timeout Configuration

### Problem
No timeouts on external API calls, causing potential hanging requests.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Request   │────▶│  Timeout Wrapper │────▶│  External API   │
│                 │     │  (AbortSignal)   │     │  with Timeout   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

#### 6.1 Timeout Utility (`lib/fetch/timeout.ts`)
```typescript
interface FetchOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const timeout = options.timeout ?? 30000; // Default 30s
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
```

#### 6.2 Updated API Route (`app/api/chat/route.ts`)
```typescript
import { fetchWithTimeout } from '@/lib/fetch/timeout';

// LLM API timeout
const LLM_TIMEOUT = 60000; // 60s

// Web search timeout
const SEARCH_TIMEOUT = 10000; // 10s

// GitHub API timeout
const GITHUB_TIMEOUT = 30000; // 30s
```

#### 6.3 OpenAI Client Configuration
```typescript
const client = new OpenAI({
  baseURL: provider.baseURL,
  apiKey: provider.apiKey,
  defaultHeaders: provider.headers,
  // OpenAI SDK doesn't support direct timeout, handle via fetch wrapper if needed
});
```

### Files to Create
- `lib/fetch/timeout.ts` - Timeout utility

### Files to Modify
- `app/api/chat/route.ts` - Apply timeouts to all external fetches
- `lib/github.ts` - Add timeout to GitHub API calls

---

## 7. Console Log Cleanup

### Problem
Debug `console.log` statements left in production code.

### Components

#### 7.1 ESLint Rule (`eslint.config.mjs`)
```typescript
export default tseslint.config(
  {
    rules: {
      'no-console': 'error', // Block console.log in production
      'no-debugger': 'error',
    },
  },
  {
    // Allow console in development
    files: ['**/*.dev.ts', '**/*.development.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);
```

#### 7.2 Pre-commit Hook (`.husky/pre-commit`)
```bash
#!/bin/bash
# Run lint check before commit
npx eslint app components lib --max-warnings 0
```

### Files to Modify
- Remove `console.log` from:
  - `components/ChatPanel.tsx` (line 56)
  - `lib/download.ts`
  - `lib/cursor.ts`
  - `components/WorkspacePanel.tsx`
- Add `.eslint.config.mjs` if not present
- Add `.husky/` configuration

---

## 8. Memory Cleanup (Session Expiry)

### Problem
In-memory chat histories and usage tracking grow indefinitely.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Session Data  │────▶│  Cleanup Interval│────▶│  Expired Data   │
│   (Map)         │     │  (every 5 min)   │     │  Removed        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

#### 8.1 Session Manager (`lib/sessions/manager.ts`)
```typescript
interface SessionData {
  chatHistory: Array<{ role: string; content: string }>;
  usageMetrics: UsageMetrics[];
  lastAccessed: number;
}

const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY_SIZE = 100; // Max messages per session

const sessions = new Map<string, SessionData>();

// Cleanup expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.lastAccessed > MAX_SESSION_AGE) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

export function getSession(id: string): SessionData | null {
  const session = sessions.get(id);
  if (!session) return null;
  
  // Update last accessed
  session.lastAccessed = Date.now();
  return session;
}

export function addToHistory(id: string, message: { role: string; content: string }): void {
  let session = sessions.get(id);
  if (!session) {
    session = { chatHistory: [], usageMetrics: [], lastAccessed: Date.now() };
    sessions.set(id, session);
  }
  
  // Add message
  session.chatHistory.push(message);
  
  // Limit history size
  if (session.chatHistory.length > MAX_HISTORY_SIZE) {
    session.chatHistory = session.chatHistory.slice(-MAX_HISTORY_SIZE);
  }
}
```

#### 8.2 Updated Chat Route (`app/api/chat/route.ts`)
```typescript
import { getSession, addToHistory } from '@/lib/sessions/manager';

// Replace direct Map access with session manager
```

### Files to Create
- `lib/sessions/manager.ts` - Session management with cleanup
- `lib/sessions/types.ts` - Type definitions

### Files to Modify
- `app/api/chat/route.ts` - Use session manager
- `lib/cost-tracking.ts` - Use session manager for usage tracking

---

## 9. Security Headers (COEP/COOP)

### Problem
Missing COEP and COOP headers for better process isolation.

### Components

#### 9.1 Updated Security Headers (`next.config.ts`)
```typescript
const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Existing headers...
          
          // New isolation headers
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          
          // Additional security headers
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};
```

### Important: SharedArrayBuffer Note

COEP `require-corp` requires pages to be served with `Cross-Origin-Opener-Policy: same-origin`. This affects:
- `SharedArrayBuffer` usage (requires cross-origin isolation)
- Some performance APIs

If the application doesn't use these features, the headers are safe to add. If they are needed, additional COOP/COEP configuration may be required.

### Files to Modify
- `next.config.ts` - Add COEP/COOP headers

---

## Implementation Order & Dependencies

```
Phase 1 (Foundation)
├── 3. CORS Configuration Fix
├── 9. Security Headers (COEP/COOP)
└── 7. Console Log Cleanup

Phase 2 (Critical Security)
├── 1. HTML Preview XSS Mitigation
├── 5. CSP Hardening
└── 6. Request Timeouts

Phase 3 (Data Protection)
├── 2. Convex Authentication
└── 8. Memory Cleanup

Phase 4 (Scalability)
└── 4. Distributed Rate Limiting
```

### Dependencies Between Tasks

| Task | Depends On |
|------|------------|
| CSP Hardening | None |
| HTML Preview XSS | CSP Hardening (for better isolation) |
| Convex Auth | None |
| Rate Limiting | None |
| Memory Cleanup | None |
| Request Timeouts | None |
| Console Logs | None |
| CORS Fix | None |
| Security Headers | None |

---

## Testing Strategy

### Unit Tests
- Sanitization: Test XSS payloads are blocked
- Rate Limiting: Test limit enforcement
- Session Cleanup: Test expiry behavior
- CSP: Test nonce generation

### Integration Tests
- End-to-end rate limit test
- Authentication flow test
- CSP header verification

### Security Testing
- XSS payload injection tests
- CSRF token validation
- Rate limit bypass attempts

---

## Rollback Plan

Each change should be wrapped in feature flags for quick rollback:

```typescript
const features = {
  STRICT_CORS: process.env.FEATURE_STRICT_CORS === 'true',
  DISTRIBUTED_RATELIMIT: process.env.FEATURE_DISTRIBUTED_RATELIMIT === 'true',
  // ...
};
```

---

## Migration Guide

### For Existing Deployments

1. **Backup environment variables**
2. **Add new environment variables** (ALLOWED_ORIGINS, REDIS_URL, etc.)
3. **Deploy in phases** following implementation order
4. **Monitor error rates** after each change
5. **Roll back immediately** if issues detected

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-16 | Security Audit | Initial specification |

---

## References

- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Redis Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiter/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-security)
