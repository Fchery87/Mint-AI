# API Routes - v0 SDK Integration

**Technology**: Next.js App Router + TypeScript
**Entry Point**: `route.ts` files
**Parent Context**: See [../../CLAUDE.md](../../CLAUDE.md)

This directory contains server-side API endpoints. The chat route integrates with the v0 SDK to generate UI components based on user messages.

---

## Development Commands

### This Directory

```bash
# From project root
bun typecheck app/api     # Type check API code
bun run dev              # Start dev server (includes API)

# Test API with curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a button", "chatId": "optional-id"}'
```

### Pre-PR Checklist

```bash
# Verify API still type-checks
bun typecheck app/api

# Test locally
bun run dev
# Open browser and test chat flow

# Check for console errors
# Look at terminal output for error logs
```

---

## Architecture & Patterns

### Directory Structure

```
app/api/
└── chat/
    └── route.ts        # Main chat endpoint
```

### Route Handler Pattern

All API routes follow this structure:

```typescript
import { NextRequest, NextResponse } from "next/server";

// 1. Define request/response types
interface MyRequest {
  field: string;
}

interface MyResponse {
  result: string;
}

// 2. Export HTTP method
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 3. Parse and validate input
    const body: MyRequest = await req.json();

    // 4. Business logic

    // 5. Return typed response
    return NextResponse.json({
      result: "success",
    } as MyResponse);
  } catch (error) {
    // 6. Handle errors
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

### v0 SDK Integration Pattern

The chat route (`/api/chat/route.ts`) uses v0 SDK for component generation:

```typescript
import { V0Client } from "v0-sdk";

const v0Client = new V0Client({
  apiKey: process.env.V0_API_KEY,
});

// Create new chat or get existing
let chat;
if (chatId) {
  chat = v0Client.getChat(chatId);
} else {
  chat = await v0Client.createChat();
}

// Send message and get response
const response = await chat.sendMessage(message);

// Response contains:
// - chat.id: Unique chat identifier (save for session continuity)
// - response.previewUrl: Live demo URL to preview generated component
// - response.message: Optional text response from v0
```

### Error Handling Pattern

All API routes must handle errors gracefully:

```typescript
// ✅ DO: Explicit error handling
try {
  const data = await v0Client.createChat();
  return NextResponse.json(data);
} catch (error) {
  console.error("Chat error:", error);

  // Return appropriate status codes
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Failed to create chat" },
    { status: 500 }
  );
}

// ❌ DON'T: Silent failures
const data = await v0Client.createChat(); // No try-catch!
return NextResponse.json(data);
```

### Request Validation Pattern

Validate all incoming data:

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();

  // ✅ DO: Validate required fields
  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json(
      { error: "Message is required and must be a string" },
      { status: 400 }
    );
  }

  // ✅ DO: Validate optional fields if present
  if (body.chatId && typeof body.chatId !== "string") {
    return NextResponse.json(
      { error: "ChatId must be a string if provided" },
      { status: 400 }
    );
  }

  // Proceed with logic
}
```

### Environment Variable Usage

API routes have access to environment variables:

```typescript
// ✅ DO: Check env vars exist before using
if (!process.env.V0_API_KEY) {
  return NextResponse.json(
    { error: "V0_API_KEY not configured" },
    { status: 500 }
  );
}

// ✅ DO: Log missing secrets safely (never log actual values)
console.error("Configuration error: V0_API_KEY missing");

// ❌ DON'T: Log sensitive values
console.log("API Key:", process.env.V0_API_KEY); // DANGEROUS!
```

---

## Key Files

### Core API Logic

- **`app/api/chat/route.ts`** - Chat endpoint handling
  - Entry point: `POST /api/chat`
  - Accepts: `{ message: string, chatId?: string }`
  - Returns: `{ id: string, demo: string, message?: string }`
  - Uses: v0 SDK to generate components

### Related Files

- **`app/page.tsx`** - Client that calls `/api/chat`
  - Sends chat messages via fetch
  - Manages chat state and message history
  - Displays preview URL in iframe

---

## v0 SDK Patterns

### Creating a Chat Session

```typescript
// First message - create new chat
const chat = await v0Client.createChat();
const response = await chat.sendMessage("Create a login form");

return NextResponse.json({
  id: chat.id,  // Save this for future messages
  demo: response.previewUrl,
  message: response.message,
});
```

### Continuing a Chat Session

```typescript
// Subsequent messages - reuse existing chat
const chat = v0Client.getChat(chatId);
const response = await chat.sendMessage("Make it bigger");

// Chat ID remains the same, v0 maintains context
return NextResponse.json({
  id: chat.id,
  demo: response.previewUrl,
  message: response.message,
});
```

### Handling v0 API Limits

```typescript
// v0 API may rate limit requests
try {
  const response = await chat.sendMessage(message);
} catch (error) {
  if (error.status === 429) {
    return NextResponse.json(
      { error: "Rate limited. Please wait a moment and try again." },
      { status: 429 }
    );
  }
  throw error;
}
```

---

## Response Types

The chat endpoint returns:

```typescript
interface ChatResponse {
  id: string;      // Chat session ID (use for next request)
  demo: string;    // URL to live preview (use in iframe)
  message?: string; // Optional AI response text
}

// Error response
interface ErrorResponse {
  error: string; // Human-readable error message
}
```

---

## Common Patterns

### Message Flow

```
Client (page.tsx)
  ↓ POST /api/chat
  ↓ { message, chatId }
API (route.ts)
  ↓ Create/get chat via v0Client
  ↓ Send message to v0 API
  ↓ Get response with preview URL
Client receives
  ↓ { id, demo, message }
  ↓ Update chat history
  ↓ Display preview in iframe
```

### Session Persistence

Currently, chat ID is only preserved in client memory:

```typescript
// Client-side (app/page.tsx)
const [chatId, setChatId] = useState<string | undefined>();

// First message creates chat
const response = await fetch("/api/chat", { /* ... */ });
setChatId(response.data.id); // Save for next message

// Future messages reuse chat ID
const nextResponse = await fetch("/api/chat", {
  body: JSON.stringify({ message, chatId }), // Send saved ID
});
```

**Future Enhancement**: Store `chatId` in localStorage for persistence across page reloads.

---

## Quick Search Commands

### Find API Endpoints

```bash
# All HTTP methods
rg -n "export (async )?function (GET|POST|PUT|DELETE)" app/api

# Chat route specifically
find app/api -name "route.ts"

# v0 SDK usage
rg -n "v0Client\|V0Client" app/api
```

### Find v0 Integration

```bash
# All v0Client calls
rg -n "v0Client\." app/api

# Error handling
rg -n "catch|error|Error" app/api/chat/route.ts

# Response creation
rg -n "NextResponse\.json" app/api
```

### Type Checking

```bash
# Check API types
bun typecheck app/api

# Find untyped variables
rg -n ": any" app/api
```

---

## Common Gotchas

### Environment Variables

- `V0_API_KEY` must be set in `.env.local` for API to work
- Missing key causes "V0_API_KEY not configured" error
- Check `.env.local.example` for required variables

### Request Body Parsing

- Next.js App Router requires explicit `await req.json()`
- Body can only be read once (save it in variable)

```typescript
// ❌ DON'T: Read body twice
const body1 = await req.json();
const body2 = await req.json(); // Will error - already consumed

// ✅ DO: Read once and reuse
const body = await req.json();
const message = body.message;
const chatId = body.chatId;
```

### CORS (if needed)

Currently, API is same-origin only. If adding cross-origin requests, add:

```typescript
export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://trusted-domain.com",
      "Access-Control-Allow-Methods": "POST",
    },
  });
}
```

### Status Codes

Use appropriate HTTP status codes:

```typescript
200 // OK - request successful
201 // Created - new resource created
400 // Bad Request - client error (validation)
401 // Unauthorized - auth required
429 // Too Many Requests - rate limited
500 // Internal Server Error - server bug
```

---

## Testing API Routes (Future)

When Vitest is set up, create `route.test.ts`:

```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/chat', () => {
  it('should create new chat on first message', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Create a button' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.demo).toBeDefined();
  });
});
```

---

## Pre-PR Checklist

Before submitting changes to API routes:

- [ ] TypeScript passes: `bun typecheck app/api`
- [ ] Request/response types are defined
- [ ] All error paths are handled with appropriate status codes
- [ ] Environment variables are validated
- [ ] Sensitive data is never logged
- [ ] v0 SDK integration tested locally with valid API key
- [ ] Chat ID persistence logic verified
- [ ] Preview URL is accessible from client
- [ ] No hardcoded URLs or API keys

---

## Resources

- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **v0 SDK Documentation**: Check `node_modules/v0-sdk/README.md`
- **NextRequest/NextResponse**: https://nextjs.org/docs/app/api-reference/functions/next-request
- **HTTP Status Codes**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
