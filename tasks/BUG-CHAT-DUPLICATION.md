# Deep Dive: Chat Session Issues

## Problem Statement
After submitting a prompt, two issues occur:
1. **Prompt duplication**: The user's message appears twice in the chat
2. **Code appears in chat**: After the reasoning `</reasoning>` tag closes, code blocks are being displayed in the chat section instead of streaming to the editor

## Root Cause Analysis

### Issue 1: Prompt Duplication

**Location**: `app/page.tsx:316-318` and `app/page.tsx:110-125`

**Cause**:
1. When user sends message, it's added to local state (`setMessages((prev) => [...prev, userMessage])`) at line 316
2. Immediately saved to Convex (`saveConvexMessage`) at line 318
3. A `useEffect` hook (lines 110-125) syncs from Convex back to state
4. The sync condition `messages.length < convexMessages.length` (line 115) triggers because:
   - Local state has the new user message (added immediately)
   - Convex now also has the new message (saved immediately)
   - The sync effect runs and overwrites local state with Convex state

**The race**:
- Timeline: User submits → Local state updates → Convex save initiated → Convex sync effect runs → Convex save completes → Sync effect sees Convex has same count → Overwrites state
- The issue is that the sync effect doesn't account for messages that were just locally added

### Issue 2: Code Streaming to Chat Instead of Editor

**Location**: `app/api/chat/route.ts:254-340`

**Cause**:
1. The API streams content as chunks, parsing `<reasoning>` and `</reasoning>` tags
2. When reasoning starts (`<reasoning>` tag at line 254), content before it is emitted as `explanation-chunk`
3. When reasoning ends (`</reasoning>` tag at line 276), any remaining content is emitted as `explanation-chunk` (lines 326-338)
4. **Problem**: The LLM response after reasoning typically includes BOTH natural language explanation AND code blocks
5. All of this content gets sent as `explanation-chunk` which that client (`page.tsx:395-405`) adds to `streamedExplanation`
6. Code extraction only happens at the END when `done` event fires (line 404-406), but by then code has already been displayed in the chat

**Flow**:
```
LLM Output: <reasoning>...</reasoning>Here's the code:\n```tsx\nexport function App() {...}\n```

Streaming Behavior:
1. <reasoning> detected → reasoning mode
2. Content inside <reasoning> → `reasoning-chunk` (goes to reasoning block)
3. </reasoning> detected → exit reasoning mode
4. "Here's the code:\n```tsx\nexport function App() {...}\n```" → `explanation-chunk` (goes to chat) ❌ WRONG
5. At end: extract code → send to editor
```

**Expected behavior**:
```
1. Natural language explanation → `explanation-chunk` → chat
2. Code blocks → `code-chunk` or deferred → editor
```

## Solutions Implemented

### Fix for Issue 1: Prompt Duplication ✅

**Approach**: Improved sync logic to prevent overwriting during active use

**Changes**: `app/page.tsx:111-124`
- Modified sync condition to only trigger when:
  - We have NO messages (initial load)
  - OR Convex has significantly more messages than local (page refresh)
- Prevents sync from overwriting when a message was just added locally

**New logic**:
```typescript
const shouldSync = messages.length === 0 || (convexMessages.length > messages.length + 1);
```

### Fix for Issue 2: Code in Chat ✅

**Approach**: Parse code blocks during streaming in API

**Changes**: `app/api/chat/route.ts:310-359`
- Added regex to detect ``` fences in buffered content
- Split content into explanation and code parts
- Emit separate events:
  - `explanation-chunk` for prose text
  - `code-chunk` for code blocks with language

**New logic**:
```typescript
const codeFenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
// Parse buffer, split into explanation + code parts
// Emit separate events
```

## Verification
1. Send a test prompt
2. Verify user message appears once ✅
3. Verify reasoning appears in collapsible block
4. Verify explanation appears in chat (no code blocks)
5. Verify code streams to editor panel

## Related Files
- `app/page.tsx` - Message state and sync logic (FIXED)
- `app/api/chat/route.ts` - Streaming implementation (FIXED)
- `components/ChatPanel.tsx` - Message rendering
- `convex/schema.ts` - Message persistence

## Status
- ✅ Issue 1: Prompt duplication - FIXED
- ✅ Issue 2: Code streaming to chat - FIXED (improved with proper code fence tracking)

## Additional Fix (Issue 2 Refined)

**Problem**: Initial fix used regex to parse code blocks after buffering, but streaming meant code fences arrived incrementally before being complete.

**Solution**: Added state-based tracking for code blocks:
- `inCodeBlock` flag to track when inside a code fence
- `codeBlockStartTag` to capture the opening fence for language extraction
- Buffer content emitted immediately when fence detected
- Separate handling for code content inside fences

**Changes**: `app/api/chat/route.ts:236-396`
- Added code fence start detection (lines 312-335)
- Added code fence end detection (lines 337-365)
- Stream content appropriately based on state:
  - Outside reasoning & outside code: explanation-chunk
  - Inside code fences: code-chunk (with language)
  - Inside reasoning: reasoning-chunk

## Testing Verification
1. ✅ User messages appear once (no duplication)
2. ✅ Reasoning appears in collapsible block
3. ✅ Explanation text appears in chat (without code blocks)
4. ✅ Code blocks stream to editor panel (not chat)
